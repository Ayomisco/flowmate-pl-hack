/**
 * Flow Token Transfer Service
 * Sends FLOW tokens on-chain from the admin/treasury account to a user address.
 * Uses secp256k1 (ECDSA_secp256k1 + SHA2_256) — matches the deployed account key type.
 */

import { createHash } from 'crypto';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

const ADMIN_ADDR = env.flowAccountAddress || '0xc26f3fa2883a46db';
const ADMIN_KEY = env.flowAccountPrivateKey || '';
const ACCESS_NODE = 'https://rest-testnet.onflow.org';
export const WELCOME_AMOUNT = 500;

// Cadence 1.0 — transfers FLOW from admin to recipient
const TRANSFER_CADENCE = `
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(amount: UFix64, to: Address) {
    let sentVault: @{FungibleToken.Vault}

    prepare(signer: auth(BorrowValue) &Account) {
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault from admin account")
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        let receiverRef = getAccount(to)
            .capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow FlowToken receiver for recipient")
        receiverRef.deposit(from: <-self.sentVault)
    }
}
`;

/** Sign message with ECDSA_secp256k1 + SHA2_256 (matches Flow account key type) */
async function signSecp256k1(hexMessage: string): Promise<string> {
  const { secp256k1 } = await import('@noble/curves/secp256k1.js');
  const msgBytes = Buffer.from(hexMessage, 'hex');
  // Flow uses SHA2_256 (standard SHA-256) before signing
  const hash = createHash('sha256').update(msgBytes).digest();
  const privKey = Buffer.from(ADMIN_KEY, 'hex');
  // sign() returns Uint8Array (compact 64-byte r||s)
  const sigBytes = secp256k1.sign(hash, privKey);
  return Buffer.from(sigBytes as Uint8Array).toString('hex');
}

/**
 * Sends WELCOME_AMOUNT FLOW to a new user's Flow address.
 * Returns the transaction ID if successful, null on failure.
 * Never throws — always falls back gracefully.
 */
export async function sendWelcomeFlow(toAddress: string): Promise<string | null> {
  if (!ADMIN_KEY) {
    logger.warn('FLOW_ACCOUNT_PRIVATE_KEY not set — skipping on-chain transfer');
    return null;
  }

  try {
    // Dynamic import so FCL doesn't crash at module load time
    const fcl = (await import('@onflow/fcl')).default ?? (await import('@onflow/fcl'));

    await (fcl as any).config({
      'flow.network': 'testnet',
      'accessNode.api': ACCESS_NODE,
    });

    const addr = ADMIN_ADDR.startsWith('0x') ? ADMIN_ADDR : `0x${ADMIN_ADDR}`;
    const to = toAddress.startsWith('0x') ? toAddress : `0x${toAddress}`;

    // Server-side authorization function — FCL calls signingFunction per-signature needed
    const authz = async (account: any) => ({
      ...account,
      tempId: `${addr}-0`,
      addr,
      keyId: 0,
      signingFunction: async (signable: any) => ({
        addr,
        keyId: 0,
        signature: await signSecp256k1(signable.message),
      }),
    });

    const txId = await (fcl as any).mutate({
      cadence: TRANSFER_CADENCE,
      args: (arg: any, t: any) => [
        arg(`${WELCOME_AMOUNT}.00000000`, t.UFix64),
        arg(to, t.Address),
      ],
      proposer: authz,
      payer: authz,
      authorizations: [authz],
      limit: 1000,
    });

    logger.info('Welcome FLOW transfer submitted on-chain', {
      txId,
      to,
      amount: WELCOME_AMOUNT,
    });

    return txId as string;
  } catch (err) {
    logger.warn('On-chain welcome transfer failed — DB-only fallback', {
      err: (err as Error).message,
      to: toAddress,
    });
    return null;
  }
}
