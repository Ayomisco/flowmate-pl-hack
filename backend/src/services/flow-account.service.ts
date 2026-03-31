/**
 * Flow Account Service
 * Creates new Cadence (non-EVM) Flow accounts on testnet for new users.
 * Admin account pays the account creation fee.
 */

import { randomBytes } from 'crypto';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { ADMIN_ADDR, signSecp256k1 } from './flow-transfer.service.js';

const ADMIN_KEY = env.flowAccountPrivateKey || '';
const ACCESS_NODE = 'https://rest-testnet.onflow.org';

// Cadence 1.0 — creates a new account with the provided secp256k1 public key
const CREATE_ACCOUNT_CADENCE = `
transaction(publicKey: String) {
    prepare(signer: auth(BorrowValue) &Account) {
        let key = PublicKey(
            publicKey: publicKey.decodeHex(),
            signatureAlgorithm: SignatureAlgorithm.ECDSA_secp256k1
        )
        let account = Account(payer: signer)
        account.keys.add(
            publicKey: key,
            hashAlgorithm: HashAlgorithm.SHA2_256,
            weight: 1000.0
        )
    }
}
`;

/**
 * Creates a new Flow Cadence account on testnet.
 * - Generates a fresh secp256k1 key pair
 * - Admin account submits a Create Account transaction (pays the fee)
 * - Extracts the new address from the flow.AccountCreated event
 *
 * Returns { address } on success, null on failure.
 */
export async function createFlowAccount(): Promise<{ address: string } | null> {
  if (!ADMIN_KEY) {
    logger.warn('FLOW_ACCOUNT_PRIVATE_KEY not set — cannot create Flow account on-chain');
    return null;
  }

  try {
    const { secp256k1 } = await import('@noble/curves/secp256k1.js');
    const fcl = (await import('@onflow/fcl')).default ?? (await import('@onflow/fcl'));

    await (fcl as any).config({
      'flow.network': 'testnet',
      'accessNode.api': ACCESS_NODE,
    });

    // Generate a new secp256k1 key pair for the user
    const privKeyBytes = randomBytes(32);
    // getPublicKey with false = uncompressed (65 bytes: 04 prefix + 32 x + 32 y)
    // Flow uses the 64-byte raw key WITHOUT the 04 prefix
    const pubKeyUncompressed = secp256k1.getPublicKey(privKeyBytes, false);
    const pubKeyHex = Buffer.from(pubKeyUncompressed.slice(1)).toString('hex');

    const authz = async (account: any) => ({
      ...account,
      tempId: `${ADMIN_ADDR}-0`,
      addr: ADMIN_ADDR,
      keyId: 0,
      signingFunction: async (signable: any) => ({
        addr: ADMIN_ADDR,
        keyId: 0,
        signature: await signSecp256k1(signable.message),
      }),
    });

    const txId = await (fcl as any).mutate({
      cadence: CREATE_ACCOUNT_CADENCE,
      args: (arg: any, t: any) => [arg(pubKeyHex, t.String)],
      proposer: authz,
      payer: authz,
      authorizations: [authz],
      limit: 1000,
    });

    logger.info('Flow account creation tx submitted', { txId });

    // Wait for the transaction to seal so we can read the AccountCreated event
    const result = await (fcl as any).tx(txId).onceSealed();

    const event = result.events?.find((e: any) => e.type === 'flow.AccountCreated');
    if (!event?.data?.address) {
      throw new Error(`flow.AccountCreated event not found in tx ${txId}`);
    }

    const newAddress = event.data.address as string;
    logger.info('Flow Cadence account created on testnet', { newAddress, txId });

    return { address: newAddress };
  } catch (err) {
    logger.error('Failed to create Flow account on-chain', { err: (err as Error).message });
    return null;
  }
}

/**
 * Returns true if the given string is a valid Flow Cadence address format
 * (0x followed by exactly 16 hex characters = 8 bytes).
 */
export function isValidFlowAddress(addr: string): boolean {
  return /^0x[0-9a-f]{16}$/i.test(addr);
}
