import { Router, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import logger from '../config/logger.js';
import { sendFlowFromAdmin } from '../services/flow-transfer.service.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

function makeTxHash(): string {
  return `internal:${randomBytes(16).toString('hex')}`;
}

function getExplorerUrl(txHash: string): string {
  if (txHash.startsWith('internal:') || txHash.startsWith('failed:')) return '';
  return `https://testnet.flowscan.io/tx/${txHash}`;
}

/** Validate and parse amount — rejects NaN, Infinity, negative, and values over 1M */
function validateAmount(raw: any): number | null {
  const num = typeof raw === 'number' ? raw : parseFloat(raw);
  if (!Number.isFinite(num) || num <= 0 || num > 1_000_000) return null;
  return num;
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
  if (!recipient) {
    res.status(400).json({ success: false, error: 'Recipient address required' });
    return;
  }
  const amountNum = validateAmount(amount);
  if (!amountNum) {
    res.status(400).json({ success: false, error: 'Amount must be a positive number (max 1,000,000)' });
    return;
  }
  try {
    const [user, availableVault] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, select: { flowAddress: true, dailyLimit: true, dailySpent: true } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: 'available' } }),
    ]);
    if (!availableVault) {
      res.status(404).json({ success: false, error: 'Available vault not found' });
      return;
    }
    const dailyRemaining = Number(user?.dailyLimit ?? 10000) - Number(user?.dailySpent ?? 0);
    if (amountNum > dailyRemaining) {
      res.status(400).json({ success: false, error: 'Daily limit exceeded' });
      return;
    }

    // Atomic balance deduction — prevents double-spend race condition
    const deducted = await prisma.vault.updateMany({
      where: { id: availableVault.id, balance: { gte: amountNum } },
      data: { balance: { decrement: amountNum } },
    });
    if (deducted.count === 0) {
      res.status(400).json({ success: false, error: 'Insufficient balance' });
      return;
    }

    // Submit to Flow blockchain
    let realTxId: string | null = null;
    try {
      realTxId = await sendFlowFromAdmin(recipient, amountNum);
    } catch (e) {
      // Blockchain error — restore balance
      await prisma.vault.update({ where: { id: availableVault.id }, data: { balance: { increment: amountNum } } });
      throw e;
    }

    if (realTxId) {
      await prisma.user.update({ where: { id: req.userId! }, data: { dailySpent: { increment: amountNum } } });
      logger.info('Send confirmed on-chain', { userId: req.userId, txHash: realTxId, recipient, amount: amountNum });
    } else {
      // On-chain failed — restore balance
      await prisma.vault.update({ where: { id: availableVault.id }, data: { balance: { increment: amountNum } } });
      logger.warn('On-chain send failed, balance restored', { userId: req.userId, recipient, amount: amountNum });
    }

    const txHash = realTxId || `failed:${randomBytes(16).toString('hex')}`;
    const explorerUrl = getExplorerUrl(txHash);
    const tx = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        txHash,
        type: 'send',
        fromAddress: user?.flowAddress || '',
        toAddress: recipient,
        amount: amountNum,
        token: 'FLOW',
        status: realTxId ? 'confirmed' : 'failed',
        explorerUrl: explorerUrl || undefined,
        metadata: note ? { note, explorerUrl } : { explorerUrl },
        confirmedAt: realTxId ? new Date() : undefined,
      },
    });
    await prisma.notification.create({
      data: {
        userId: req.userId!,
        type: 'payment_sent',
        title: `Sent ${amountNum} FLOW`,
        body: `You sent ${amountNum} FLOW to ${recipient}.${realTxId ? ' Transaction confirmed on-chain.' : ''}`,
        metadata: { amount: amountNum, recipient } as any,
      },
    });
    res.json({ success: true, data: { transaction: { ...tx, explorerUrl } } });
  } catch (err) {
    logger.error('Send failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Transaction failed' });
  }
});

// POST /api/v1/transactions/save
// Vault-to-vault transfers are tracked in DB (custodial model — vaults are off-chain)
router.post('/save', auth, async (req: AuthRequest, res: Response) => {
  const { amount, toVault = 'savings' } = req.body;
  const amountNum = validateAmount(amount);
  if (!amountNum) {
    res.status(400).json({ success: false, error: 'Amount must be a positive number (max 1,000,000)' });
    return;
  }
  const validVaults = ['savings', 'emergency', 'staking'];
  if (!validVaults.includes(toVault)) {
    res.status(400).json({ success: false, error: `toVault must be one of: ${validVaults.join(', ')}` });
    return;
  }
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

    const txHash = makeTxHash();

    // Atomic balance transfer — prevents double-spend race condition
    let transferred = false;
    await prisma.$transaction(async (tx) => {
      const d = await tx.vault.updateMany({
        where: { id: availableVault.id, balance: { gte: amountNum } },
        data: { balance: { decrement: amountNum } },
      });
      if (d.count === 0) return;
      await tx.vault.update({ where: { id: destVault.id }, data: { balance: { increment: amountNum } } });
      transferred = true;
    });
    if (!transferred) {
      res.status(400).json({ success: false, error: 'Insufficient balance' });
      return;
    }
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
        metadata: { fromVault: 'available', toVault },
        confirmedAt: new Date(),
      },
    });
    logger.info('Save transaction', { userId: req.userId, toVault, amount: amountNum });
    await prisma.notification.create({
      data: {
        userId: req.userId!,
        type: 'action_executed',
        title: `Saved ${amountNum} FLOW`,
        body: `${amountNum} FLOW moved from available to ${toVault} vault.`,
        metadata: { amount: amountNum, toVault } as any,
      },
    });
    res.json({ success: true, data: { transaction: tx } });
  } catch (err) {
    logger.error('Save failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Save failed' });
  }
});

// POST /api/v1/transactions/swap
router.post('/swap', auth, async (req: AuthRequest, res: Response) => {
  const { fromVault, toVault, amount } = req.body;
  const amountNum = validateAmount(amount);
  if (!fromVault || !toVault || !amountNum) {
    res.status(400).json({ success: false, error: 'fromVault, toVault and positive amount (max 1,000,000) required' });
    return;
  }
  if (fromVault === toVault) {
    res.status(400).json({ success: false, error: 'fromVault and toVault must be different' });
    return;
  }
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

    const txHash = makeTxHash();

    // Atomic balance transfer — prevents double-spend race condition
    let transferred = false;
    await prisma.$transaction(async (tx) => {
      const d = await tx.vault.updateMany({
        where: { id: from.id, balance: { gte: amountNum } },
        data: { balance: { decrement: amountNum } },
      });
      if (d.count === 0) return;
      await tx.vault.update({ where: { id: to.id }, data: { balance: { increment: amountNum } } });
      transferred = true;
    });
    if (!transferred) {
      res.status(400).json({ success: false, error: 'Insufficient balance' });
      return;
    }
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
        metadata: { fromVault, toVault },
        confirmedAt: new Date(),
      },
    });
    logger.info('Swap transaction', { userId: req.userId, fromVault, toVault, amount: amountNum });
    await prisma.notification.create({
      data: {
        userId: req.userId!,
        type: 'action_executed',
        title: `Swapped ${amountNum} FLOW`,
        body: `${amountNum} FLOW moved from ${fromVault} to ${toVault} vault.`,
        metadata: { amount: amountNum, fromVault, toVault } as any,
      },
    });
    res.json({ success: true, data: { transaction: tx } });
  } catch (err) {
    logger.error('Swap failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Swap failed' });
  }
});

// POST /api/v1/transactions/stake
router.post('/stake', auth, async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  const amountNum = validateAmount(amount);
  if (!amountNum) {
    res.status(400).json({ success: false, error: 'Amount must be a positive number (max 1,000,000)' });
    return;
  }
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

    const txHash = makeTxHash();

    // Atomic balance transfer — prevents double-spend race condition
    let staked = false;
    await prisma.$transaction(async (tx) => {
      const d = await tx.vault.updateMany({
        where: { id: availableVault.id, balance: { gte: amountNum } },
        data: { balance: { decrement: amountNum } },
      });
      if (d.count === 0) return;
      await tx.vault.update({ where: { id: stakingVault.id }, data: { balance: { increment: amountNum } } });
      staked = true;
    });
    if (!staked) {
      res.status(400).json({ success: false, error: 'Insufficient balance' });
      return;
    }
    const tx = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        txHash,
        type: 'stake',
        fromAddress: user?.flowAddress || '',
        toAddress: 'vault:staking',
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        metadata: { apy: '8.5%' },
        confirmedAt: new Date(),
      },
    });
    logger.info('Stake transaction', { userId: req.userId, amount: amountNum });
    await prisma.notification.create({
      data: {
        userId: req.userId!,
        type: 'action_executed',
        title: `Staked ${amountNum} FLOW`,
        body: `${amountNum} FLOW staked at 8.5% APY. Keep building your portfolio!`,
        metadata: { amount: amountNum, apy: '8.5%' } as any,
      },
    });
    res.json({ success: true, data: { transaction: tx } });
  } catch (err) {
    logger.error('Stake failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Staking failed' });
  }
});

export default router;
