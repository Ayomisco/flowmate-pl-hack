import { Magic } from 'magic-sdk';

// Singleton Magic instance
let _magic: Magic | null = null;

export function getMagic(): Magic {
  if (!_magic) {
    // Intentionally NOT using FlowExtension — it requires a working RPC node
    // handshake at instantiation time which can fail and hang the iframe in v33.
    // Flow address is derived server-side from the Magic issuer DID instead.
    _magic = new Magic(import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY as string);
  }
  return _magic;
}
