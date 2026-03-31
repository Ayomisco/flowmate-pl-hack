import { Magic } from 'magic-sdk';
import { FlowExtension } from '@magic-ext/flow';

// Singleton Magic instance
let _magic: Magic | null = null;

export function getMagic(): Magic {
  if (!_magic) {
    _magic = new Magic(import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY as string, {
      extensions: [new FlowExtension({ rpcUrl: 'https://rest-testnet.onflow.org' })],
    });
  }
  return _magic;
}
