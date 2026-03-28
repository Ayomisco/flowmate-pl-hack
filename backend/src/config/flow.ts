import config from './env';
import * as fcl from '@onflow/fcl';

// Initialize FCL with Flow configuration
fcl.config({
  'accessNode.api': config.flowAccessNode,
  'app.detail.title': 'FlowMate',
  'app.detail.icon': 'https://flowmate.app/logo.svg',
  'flow.network': config.flowNetwork === 'testnet' ? 'testnet' : 'mainnet',
});

interface FlowConfig {
  accessNode: string;
  network: string;
  accountAddress: string;
  privateKey: string;
  contracts: {
    flowmateAgent: string;
    vaultManager: string;
    scheduledTransactions: string;
  };
}

const flowConfig: FlowConfig = {
  accessNode: config.flowAccessNode,
  network: config.flowNetwork,
  accountAddress: config.flowAccountAddress,
  privateKey: config.flowAccountPrivateKey,
  contracts: {
    flowmateAgent: config.flowmateAgentContract,
    vaultManager: config.vaultManagerContract,
    scheduledTransactions: config.scheduledTransactionsContract,
  },
};

/**
 * Build authorization function for transactions
 * Signs transactions with the account's private key
 */
export const buildAuthorization = async () => {
  return fcl.authorizationInclusion(fcl.signer(
    flowConfig.accountAddress,
    flowConfig.privateKey,
    0 // keyId
  ));
};

/**
 * Query the blockchain for data
 */
export const queryFlow = async (script: string, args: any[]) => {
  return fcl.query({
    cadence: script,
    args: args,
  });
};

/**
 * Send a transaction to the blockchain
 */
export const executeFlow = async (
  cadence: string,
  args: any[],
  authorizers?: any[]
) => {
  const response = await fcl.mutate({
    cadence,
    args: (arg: any, t: any) => args.map((a, i) => arg(a, t)),
    authorizations: authorizers || [buildAuthorization],
    payer: buildAuthorization,
    proposer: buildAuthorization,
  });

  return fcl.tx(response).onceSealed();
};

export default flowConfig;
export { fcl };
