import * as fcl from '@onflow/fcl';
import { env } from './env.js';

fcl.config({
  'flow.network': env.flowNetwork,
  'accessNode.api': env.flowAccessNode,
});

export const CONTRACT_ADDRESS = env.flowmateAgentContract || '0xc26f3fa2883a46db';

export const queryFlow = async (script: string, args: ((arg: any, t: any) => any[]) = () => []) => {
  return fcl.query({ cadence: script, args });
};

export const executeFlow = async (
  cadence: string,
  args: ((arg: any, t: any) => any[]) = () => [],
) => {
  return fcl.mutate({
    cadence,
    args,
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 9999,
  });
};

export default { queryFlow, executeFlow, CONTRACT_ADDRESS };
