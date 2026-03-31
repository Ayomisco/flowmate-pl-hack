import { Magic } from 'magic-sdk';

// Singleton Magic instance
let _magic: Magic | null = null;

export function getMagic(): Magic {
  if (!_magic) {
    // Using Magic without FlowExtension
    // Flow addresses are derived server-side from Magic issuer DID in auth.routes.ts
    // This avoids RPC initialization delays that can block the Magic instance
    _magic = new Magic(import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY as string);
  }
  return _magic;
}
