import { Router, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

// GET /api/v1/rules — list all rules for user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const rules = await prisma.rule.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { scheduledTransaction: true },
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch rules' });
  }
});

// POST /api/v1/rules — create a new automation rule
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const { type, config, frequency, dayOfWeek, time: execTime } = req.body;

  const validTypes = ['save', 'send', 'dca', 'stake', 'bill'];
  if (!type || !validTypes.includes(type)) {
    res.status(400).json({ success: false, error: `type must be one of: ${validTypes.join(', ')}` });
    return;
  }
  if (!config?.amount || parseFloat(config.amount) <= 0) {
    res.status(400).json({ success: false, error: 'config.amount required and must be positive' });
    return;
  }

  try {
    // Calculate next execution time
    const nextExecution = calcNextExecution(frequency || 'weekly', dayOfWeek ?? 5, execTime || '09:00');

    const rule = await prisma.rule.create({
      data: {
        userId: req.userId!,
        type,
        status: 'active',
        config,
        nextExecution,
        scheduledTransaction: frequency ? {
          create: {
            scheduleId: `sched_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            frequency: frequency || 'weekly',
            dayOfWeek: dayOfWeek ?? 5,
            time: execTime || '09:00',
            status: 'active',
            nextExecution,
          },
        } : undefined,
      },
      include: { scheduledTransaction: true },
    });

    logger.info('Rule created', { userId: req.userId, type, ruleId: rule.id });
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    logger.error('Create rule failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

// PATCH /api/v1/rules/:id/pause
router.patch('/:id/pause', auth, async (req: AuthRequest, res: Response) => {
  try {
    const rule = await prisma.rule.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!rule) { res.status(404).json({ success: false, error: 'Rule not found' }); return; }

    const updated = await prisma.rule.update({
      where: { id: req.params.id },
      data: { status: 'paused', scheduledTransaction: { update: { status: 'paused' } } },
      include: { scheduledTransaction: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to pause rule' });
  }
});

// PATCH /api/v1/rules/:id/resume
router.patch('/:id/resume', auth, async (req: AuthRequest, res: Response) => {
  try {
    const rule = await prisma.rule.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { scheduledTransaction: true },
    });
    if (!rule) { res.status(404).json({ success: false, error: 'Rule not found' }); return; }

    const nextExecution = rule.scheduledTransaction
      ? calcNextExecution(
          (rule.scheduledTransaction as any).frequency,
          (rule.scheduledTransaction as any).dayOfWeek ?? 5,
          (rule.scheduledTransaction as any).time || '09:00'
        )
      : new Date();

    const updated = await prisma.rule.update({
      where: { id: req.params.id },
      data: {
        status: 'active',
        nextExecution,
        scheduledTransaction: { update: { status: 'active', nextExecution } },
      },
      include: { scheduledTransaction: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to resume rule' });
  }
});

// DELETE /api/v1/rules/:id
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const rule = await prisma.rule.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!rule) { res.status(404).json({ success: false, error: 'Rule not found' }); return; }

    await prisma.rule.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete rule' });
  }
});

// Helper: calculate next execution datetime
function calcNextExecution(frequency: string, dayOfWeek: number, time: string): Date {
  const [hours, minutes] = (time || '09:00').split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (frequency === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === 'weekly') {
    const currentDay = now.getDay();
    const targetDay = dayOfWeek ?? 5; // Friday default
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setDate(next.getDate() + daysUntil);
  } else if (frequency === 'monthly') {
    next.setDate(1);
    if (next <= now) { next.setMonth(next.getMonth() + 1); next.setDate(1); }
  } else if (frequency === 'biweekly') {
    const currentDay = now.getDay();
    const targetDay = dayOfWeek ?? 5;
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 14;
    next.setDate(next.getDate() + daysUntil);
  }

  return next;
}

export default router;
