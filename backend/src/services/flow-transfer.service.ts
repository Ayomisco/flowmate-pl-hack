/**
 * Flow Token Transfer Service
 * Signs and submits Flow blockchain transactions from the admin/treasury account.
 * Uses ECDSA_secp256k1 + SHA2_256 — matches the deployed account key type.
 */

import { createHash } from 'crypto';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

export const ADMIN_ADDR = (() => {
  const a = env.flowAccountAddress || '0xc26f3fa2883a46db';
  return a.startsWith('0x') ? a : `0x${a}`;
})();

const ADMIN_KEY = env.flowAccountPrivateKey || '';
const ACCESS_NODE = 'https://rest-testnet.onflow.org';
export const WELCOME_AMOUNT = 300;

// Cadence 1.0 — transfers FLOW from signer's storage to recipient
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

/**
 * Sign message with ECDSA_secp256k1 + SHA2_256.
 * Accepts an optional privateKeyHex — defaults to admin key.
 */
export async function signSecp256k1(hexMessage: string, privateKeyHex: string = ADMIN_KEY): Promise<string> {
  const { secp256k1 } = await import('@noble/curves/secp256k1.js');
  const msgBytes = Buffer.from(hexMessage, 'hex');
  // Flow uses SHA2_256 before signing
  const hash = createHash('sha256').update(msgBytes).digest();
  const privKey = Buffer.from(privateKeyHex, 'hex');
  // In @noble/curves v2.x, sign() returns Uint8Array (compact 64-byte r||s) directly
  const sig = secp256k1.sign(hash, privKey);
  return Buffer.from(sig).toString('hex');
}

/**
 * Creates an FCL authorization function for server-side transaction signing.
 * Uses admin key by default; pass different addr/key for other accounts.
 */
export function createAdminAuthz(addr: string = ADMIN_ADDR, privKeyHex: string = ADMIN_KEY) {
  return async (account: any) => ({
    ...account,
    tempId: `${addr}-0`,
    addr,
    keyId: 0,
    signingFunction: async (signable: any) => ({
      addr,
      keyId: 0,
      signature: await signSecp256k1(signable.message, privKeyHex),
    }),
  });
}

/**
 * Sends FLOW tokens from the admin/treasury account to any recipient.
 * Returns the transaction ID if successful, null on failure. Never throws.
 */
export async function sendFlowFromAdmin(toAddress: string, amount: number): Promise<string | null> {
  if (!ADMIN_KEY) {
    logger.warn('FLOW_ACCOUNT_PRIVATE_KEY not set — skipping on-chain transfer');
    return null;
  }

  try {
    const fcl = (await import('@onflow/fcl')).default ?? (await import('@onflow/fcl'));

    await (fcl as any).config({
      'flow.network': 'testnet',
      'accessNode.api': ACCESS_NODE,
    });

    const to = toAddress.startsWith('0x') ? toAddress : `0x${toAddress}`;
    const authz = createAdminAuthz();

    const txId = await (fcl as any).mutate({
      cadence: TRANSFER_CADENCE,
      args: (arg: any, t: any) => [
        arg(amount.toFixed(8), t.UFix64),
        arg(to, t.Address),
      ],
      proposer: authz,
      payer: authz,
      authorizations: [authz],
      limit: 1000,
    });

    logger.info('FLOW transfer submitted on-chain', { txId, to, amount });
    return txId as string;
  } catch (err) {
    logger.warn('On-chain FLOW transfer failed', {
      err: (err as Error).message,
      to: toAddress,
      amount,
    });
    return null;
  }
}

/**
 * Sends the welcome bonus (300 FLOW) to a new user's Flow address.
 * Returns transaction ID if successful, null on failure.
 */
export async function sendWelcomeFlow(toAddress: string): Promise<string | null> {
  return sendFlowFromAdmin(toAddress, WELCOME_AMOUNT);
}
