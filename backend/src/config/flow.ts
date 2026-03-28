import * as fcl from "@onflow/fcl";
import { transaction, script } from "@onflow/fcl";
import config from "./env";

// Initialize FCL
fcl.config({
  "accessNode.api": config.flowAccessNode,
  "discovery.wallet": `${config.flowAccessNode.replace("rest", "http")}/flow/testnet/wallets/discovery`,
});

interface AuthorizerOptions {
  addr: string;
  keyId: number;
  signingFunction: (signable: any) => Promise<any>;
}

/**
 * Build authorization function for signing transactions
 */
export const buildAuthorization = (
  addr: string,
  keyId: number,
  privateKey: string
): AuthorizerOptions => {
  return {
    addr: fcl.sansPrefix(addr),
    keyId,
    signingFunction: async (signable: any) => {
      // This would use FCL's signing utilities
      // For now, returns the signing function reference
      return {
        signature: privateKey, // Placeholder - actual signing handled by FCL
      };
    },
  };
};

/**
 * Query Flow blockchain (read-only)
 */
export const queryFlow = async (cadenceScript: string, args: any[] = []): Promise<any> => {
  try {
    const result = await fcl.query({
      cadence: cadenceScript,
      args: (arg: any, t: any) => args.map((a) => arg(a, t)),
    });
    return result;
  } catch (error) {
    console.error("Flow query error:", error);
    throw error;
  }
};

/**
 * Execute transaction on Flow blockchain
 */
export const executeFlow = async (
  cadence: string,
  args: any[] = [],
  authorizers: AuthorizerOptions[] = []
): Promise<string> => {
  try {
    const txId = await fcl.mutate({
      cadence,
      args: (arg: any, t: any) => args.map((a) => arg(a, t)),
      proposer: authorizers[0],
      payer: authorizers[0],
      authorizations: authorizers,
      limit: 9999,
    });

    // Wait for transaction to be sealed
    return await fcl.tx(txId).onceSealed();
  } catch (error) {
    console.error("Flow transaction error:", error);
    throw error;
  }
};

export default {
  queryFlow,
  executeFlow,
  buildAuthorization,
};
