import { Router, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

// GET /api/v1/vaults — returns DB vault balances
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const vaults = await prisma.vault.findMany({
      where: { userId: req.userId },
      orderBy: { type: 'asc' },
    });
    res.json({ success: true, data: vaults });
  } catch (err) {
    logger.error('Get vaults failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed to fetch vaults' });
  }
});

// POST /api/v1/vaults/transfer
router.post('/transfer', auth, async (req: AuthRequest, res: Response) => {
  const { from, to, amount } = req.body;
  if (!from || !to || !amount || parseFloat(amount) <= 0) {
    res.status(400).json({ success: false, error: 'from, to, and positive amount required' });
    return;
  }

  try {
    const [fromVault, toVault] = await Promise.all([
      prisma.vault.findFirst({ where: { userId: req.userId, type: from } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: to } }),
    ]);

    if (!fromVault || !toVault) {
      res.status(404).json({ success: false, error: 'Vault not found' });
      return;
    }

    if (Number(fromVault.balance) < parseFloat(amount)) {
      res.status(400).json({ success: false, error: 'Insufficient balance' });
      return;
    }

    await prisma.$transaction([
      prisma.vault.update({ where: { id: fromVault.id }, data: { balance: { decrement: parseFloat(amount) } } }),
      prisma.vault.update({ where: { id: toVault.id }, data: { balance: { increment: parseFloat(amount) } } }),
    ]);

    logger.info('Vault transfer', { userId: req.userId, from, to, amount });
    res.json({ success: true, data: { from, to, amount, message: 'Transfer successful' } });
  } catch (err) {
    logger.error('Vault transfer failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Transfer failed' });
  }
});

export default router;
