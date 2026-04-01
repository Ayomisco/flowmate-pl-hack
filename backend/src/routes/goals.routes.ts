import { Router, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

// GET /api/v1/goals
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      orderBy: { deadline: 'asc' },
    });
    res.json({ success: true, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch goals' });
  }
});

// POST /api/v1/goals
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const { name, targetAmount, deadline } = req.body;
  if (!name || !targetAmount || !deadline) {
    res.status(400).json({ success: false, error: 'name, targetAmount, deadline required' });
    return;
  }
  if (parseFloat(targetAmount) <= 0) {
    res.status(400).json({ success: false, error: 'targetAmount must be positive' });
    return;
  }
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
    res.status(400).json({ success: false, error: 'deadline must be a future date' });
    return;
  }
  try {
    const goal = await prisma.goal.create({
      data: {
        userId: req.userId!,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        deadline: deadlineDate,
        status: 'active',
      },
    });
    logger.info('Goal created', { userId: req.userId, goalId: goal.id, name });
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    logger.error('Create goal failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create goal' });
  }
});

// PATCH /api/v1/goals/:id/contribute — add amount to goal progress
router.patch('/:id/contribute', auth, async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  if (!amount || parseFloat(amount) <= 0) {
    res.status(400).json({ success: false, error: 'positive amount required' });
    return;
  }
  const amountNum = parseFloat(amount);
  try {
    const [goal, availableVault] = await Promise.all([
      prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } }),
      prisma.vault.findFirst({ where: { userId: req.userId, type: 'available' } }),
    ]);
    if (!goal) { res.status(404).json({ success: false, error: 'Goal not found' }); return; }
    if (!availableVault || Number(availableVault.balance) < amountNum) {
      res.status(400).json({ success: false, error: 'Insufficient available balance' }); return;
    }

    const newAmount = Number(goal.currentAmount) + amountNum;
    const newStatus = newAmount >= Number(goal.targetAmount) ? 'achieved' : 'active';

    await prisma.$transaction([
      prisma.vault.update({ where: { id: availableVault.id }, data: { balance: { decrement: amountNum } } }),
      prisma.vault.updateMany({
        where: { userId: req.userId!, type: 'savings' },
        data: { balance: { increment: amountNum } },
      }),
    ]);

    const updated = await prisma.goal.update({
      where: { id: req.params.id },
      data: { currentAmount: newAmount, status: newStatus },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('Goal contribution failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Contribution failed' });
  }
});

export default router;
