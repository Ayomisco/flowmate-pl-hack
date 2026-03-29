import { Router, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

const EXPLORER_BASE = 'https://testnet.flowscan.io/tx';

function makeTxHash(): string {
  return randomBytes(32).toString('hex');
}

// GET /api/v1/transactions
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where: { userId: req.userId } }),
    ]);
    res.json({ success: true, data: { transactions, total, limit, offset } });
  } catch (err) {
    logger.error('Fetch transactions failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// GET /api/v1/transactions/:id
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!tx) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }
    res.json({ success: true, data: tx });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
});

// POST /api/v1/transactions/send
router.post('/send', auth, async (req: AuthRequest, res: Response) => {
  const { recipient, amount, note } = req.body;
  if (!recipient || !amount || parseFloat(amount) <= 0) {
    res.status(400).json({ success: false, error: 'recipient and positive amount required' });
    return;
  }
  const amountNum = parseFloat(amount);
  try {
    const [user, availableVault] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, select: { flowAddress: true, dailyLimit: true, dailySpent: true } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: 'available' } }),
    ]);
    if (!availableVault) {
      res.status(404).json({ success: false, error: 'Available vault not found' });
      return;
    }
    if (availableVault.balance < amountNum) {
      res.status(400).json({ success: false, error: `Insufficient balance. Available: ${availableVault.balance} FLOW` });
      return;
    }
    const dailyRemaining = (user?.dailyLimit ?? 10000) - (user?.dailySpent ?? 0);
    if (amountNum > dailyRemaining) {
      res.status(400).json({ success: false, error: `Daily limit exceeded. Remaining: ${dailyRemaining} FLOW` });
      return;
    }
    const txHash = makeTxHash();
    const explorerUrl = `${EXPLORER_BASE}/${txHash}`;
    await prisma.$transaction([
      prisma.vault.update({
        where: { id: availableVault.id },
        data: { balance: { decrement: amountNum } },
      }),
      prisma.user.update({
        where: { id: req.userId! },
        data: { dailySpent: { increment: amountNum } },
      }),
    ]);
    const tx = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        txHash,
        type: 'send',
        fromAddress: user?.flowAddress || '',
        toAddress: recipient,
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        explorerUrl,
        metadata: note ? { note } : undefined,
        confirmedAt: new Date(),
      },
    });
    logger.info('Send transaction', { userId: req.userId, txHash, amount: amountNum });
    res.json({ success: true, data: { transaction: tx, explorerUrl } });
  } catch (err) {
    logger.error('Send failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Transaction failed' });
  }
});

// POST /api/v1/transactions/save
router.post('/save', auth, async (req: AuthRequest, res: Response) => {
  const { amount, toVault = 'savings' } = req.body;
  if (!amount || parseFloat(amount) <= 0) {
    res.status(400).json({ success: false, error: 'positive amount required' });
    return;
  }
  const validVaults = ['savings', 'emergency', 'staking'];
  if (!validVaults.includes(toVault)) {
    res.status(400).json({ success: false, error: `toVault must be one of: ${validVaults.join(', ')}` });
    return;
  }
  const amountNum = parseFloat(amount);
  try {
    const [user, availableVault, destVault] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, select: { flowAddress: true } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: 'available' } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: toVault } }),
    ]);
    if (!availableVault || !destVault) {
      res.status(404).json({ success: false, error: 'Vault not found' });
      return;
    }
    if (availableVault.balance < amountNum) {
      res.status(400).json({ success: false, error: `Insufficient balance. Available: ${availableVault.balance} FLOW` });
      return;
    }
    const txHash = makeTxHash();
    const explorerUrl = `${EXPLORER_BASE}/${txHash}`;
    await prisma.$transaction([
      prisma.vault.update({ where: { id: availableVault.id }, data: { balance: { decrement: amountNum } } }),
      prisma.vault.update({ where: { id: destVault.id }, data: { balance: { increment: amountNum } } }),
    ]);
    const tx = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        txHash,
        type: 'save',
        fromAddress: user?.flowAddress || '',
        toAddress: `vault:${toVault}`,
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        explorerUrl,
        metadata: { fromVault: 'available', toVault },
        confirmedAt: new Date(),
      },
    });
    logger.info('Save transaction', { userId: req.userId, toVault, amount: amountNum });
    res.json({ success: true, data: { transaction: tx, explorerUrl } });
  } catch (err) {
    logger.error('Save failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Save failed' });
  }
});

// POST /api/v1/transactions/swap
router.post('/swap', auth, async (req: AuthRequest, res: Response) => {
  const { fromVault, toVault, amount } = req.body;
  if (!fromVault || !toVault || !amount || parseFloat(amount) <= 0) {
    res.status(400).json({ success: false, error: 'fromVault, toVault and positive amount required' });
    return;
  }
  if (fromVault === toVault) {
    res.status(400).json({ success: false, error: 'fromVault and toVault must be different' });
    return;
  }
  const amountNum = parseFloat(amount);
  try {
    const [user, from, to] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, select: { flowAddress: true } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: fromVault } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: toVault } }),
    ]);
    if (!from || !to) {
      res.status(404).json({ success: false, error: 'Vault not found' });
      return;
    }
    if (from.balance < amountNum) {
      res.status(400).json({ success: false, error: `Insufficient balance in ${fromVault} vault: ${from.balance} FLOW` });
      return;
    }
    const txHash = makeTxHash();
    const explorerUrl = `${EXPLORER_BASE}/${txHash}`;
    await prisma.$transaction([
      prisma.vault.update({ where: { id: from.id }, data: { balance: { decrement: amountNum } } }),
      prisma.vault.update({ where: { id: to.id }, data: { balance: { increment: amountNum } } }),
    ]);
    const tx = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        txHash,
        type: 'swap',
        fromAddress: `vault:${fromVault}`,
        toAddress: `vault:${toVault}`,
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        explorerUrl,
        metadata: { fromVault, toVault },
        confirmedAt: new Date(),
      },
    });
    logger.info('Swap transaction', { userId: req.userId, fromVault, toVault, amount: amountNum });
    res.json({ success: true, data: { transaction: tx, explorerUrl } });
  } catch (err) {
    logger.error('Swap failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Swap failed' });
  }
});

// POST /api/v1/transactions/stake
router.post('/stake', auth, async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  if (!amount || parseFloat(amount) <= 0) {
    res.status(400).json({ success: false, error: 'positive amount required' });
    return;
  }
  const amountNum = parseFloat(amount);
  try {
    const [user, availableVault, stakingVault] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, select: { flowAddress: true } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: 'available' } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: 'staking' } }),
    ]);
    if (!availableVault || !stakingVault) {
      res.status(404).json({ success: false, error: 'Vault not found' });
      return;
    }
    if (availableVault.balance < amountNum) {
      res.status(400).json({ success: false, error: `Insufficient balance. Available: ${availableVault.balance} FLOW` });
      return;
    }
    const txHash = makeTxHash();
    const explorerUrl = `${EXPLORER_BASE}/${txHash}`;
    await prisma.$transaction([
      prisma.vault.update({ where: { id: availableVault.id }, data: { balance: { decrement: amountNum } } }),
      prisma.vault.update({ where: { id: stakingVault.id }, data: { balance: { increment: amountNum } } }),
    ]);
    const tx = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        txHash,
        type: 'stake',
        fromAddress: user?.flowAddress || '',
        toAddress: 'flow-staking-contract',
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        explorerUrl,
        metadata: { validator: 'FlowMate Staking Pool', apy: '8.5%' },
        confirmedAt: new Date(),
      },
    });
    logger.info('Stake transaction', { userId: req.userId, amount: amountNum });
    res.json({ success: true, data: { transaction: tx, explorerUrl } });
  } catch (err) {
    logger.error('Stake failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Staking failed' });
  }
});

export default router;
