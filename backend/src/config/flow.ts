import * as fcl from '@onflow/fcl';
import { env } from './env.js';

fcl.config({
  'flow.network': env.flowNetwork,
  'accessNode.api': env.flowAccessNode,
});

export const buildAuthorization = async (account: any) => {
  return {
    ...account,
    tempId: `${account.address}-${env.flowNetwork}`,
    addr: fcl.signer.addressAsHexString(account.address),
    keyId: 0,
    signingFunction: async (signable: any) => ({
      f_type: 'SignedData',
      f_vsn: '1.0.0',
      signature: await fcl.signer.sign(Buffer.from(signable.message, 'hex'), {
        hashAlgo: fcl.HashAlgorithm.SHA3_256,
        signatureAlgo: fcl.SignatureAlgorithm.ECDSA_P256,
        privateKey: env.flowAccountPrivateKey,
      }),
    }),
  };
};

export const queryFlow = async (script: string, args: any[] = []) => {
  return fcl.query({
    cadence: script,
    args: (arg: any, t: any) => args.map((a, i) => arg(a, t.String)),
  });
};

export const executeFlow = async (
  cadence: string,
  args: any[] = [],
  authorizers: string[] = [env.flowAccountAddress]
) => {
  const limit = 9999;

  return fcl.mutate({
    cadence,
    args: (arg: any, t: any) => args.map((a, i) => arg(a, t.String)),
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit,
  });
};

export default {
  queryFlow,
  executeFlow,
  buildAuthorization,
};
