import type { Request, Response } from 'express';

let handler: ((req: Request, res: Response) => void) | null = null;
let initError: string | null = null;

const ready = (async () => {
  try {
    const { default: app } = await import('../src/app.js');
    handler = app as any;
    console.log('[FlowMate] App loaded OK');
  } catch (err: any) {
    initError = err?.message ?? String(err);
    console.error('[FlowMate] Startup error:', initError, err?.stack);
  }
})();

export default async (req: Request, res: Response) => {
  await ready;
  if (initError) {
    return res.status(500).json({ success: false, error: initError });
  }
  return handler!(req, res);
};
