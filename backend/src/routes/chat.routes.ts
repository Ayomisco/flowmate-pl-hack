import { Router, Response, RequestHandler } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getAIService } from '../services/ai.service.js';
import logger from '../config/logger.js';
import { randomBytes } from 'crypto';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

const EXPLORER_BASE = 'https://testnet.flowscan.io/tx';

async function executeActionInternal(
  userId: string,
  payload: { endpoint: string; body: Record<string, any> }
): Promise<{ explorerUrl?: string; ruleId?: string }> {
  const { endpoint, body } = payload;

  if (endpoint.includes('/send')) {
    const { recipient, amount, note } = body;
    const amountNum = parseFloat(amount);
    const [user, vault] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { flowAddress: true, dailyLimit: true, dailySpent: true } }),
      prisma.vault.findFirst({ where: { userId, type: 'available' } }),
    ]);
    if (!vault || vault.balance < amountNum) throw new Error('Insufficient balance');
    const txHash = randomBytes(32).toString('hex');
    const explorerUrl = `${EXPLORER_BASE}/${txHash}`;
    await prisma.$transaction([
      prisma.vault.update({ where: { id: vault.id }, data: { balance: { decrement: amountNum } } }),
      prisma.user.update({ where: { id: userId }, data: { dailySpent: { increment: amountNum } } }),
    ]);
    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'send',
        fromAddress: user?.flowAddress || '',
        toAddress: recipient,
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        explorerUrl,
        metadata: note ? { note } : Prisma.JsonNull,
        confirmedAt: new Date(),
      },
    });
    return { explorerUrl };
  }

  if (endpoint.includes('/save')) {
    const { amount, toVault = 'savings' } = body;
    const amountNum = parseFloat(amount);
    const [user, avail, dest] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { flowAddress: true } }),
      prisma.vault.findFirst({ where: { userId, type: 'available' } }),
      prisma.vault.findFirst({ where: { userId, type: toVault } }),
    ]);
    if (!avail || avail.balance < amountNum) throw new Error('Insufficient balance');
    if (!dest) throw new Error(`Vault ${toVault} not found`);
    const txHash = randomBytes(32).toString('hex');
    const explorerUrl = `${EXPLORER_BASE}/${txHash}`;
    await prisma.$transaction([
      prisma.vault.update({ where: { id: avail.id }, data: { balance: { decrement: amountNum } } }),
      prisma.vault.update({ where: { id: dest.id }, data: { balance: { increment: amountNum } } }),
    ]);
    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'save',
        fromAddress: user?.flowAddress || '',
        toAddress: `vault:${toVault}`,
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        explorerUrl,
        metadata: { fromVault: 'available', toVault } as Prisma.InputJsonValue,
        confirmedAt: new Date(),
      },
    });
    return { explorerUrl };
  }

  if (endpoint.includes('/stake')) {
    const { amount } = body;
    const amountNum = parseFloat(amount);
    const [user, avail, staking] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { flowAddress: true } }),
      prisma.vault.findFirst({ where: { userId, type: 'available' } }),
      prisma.vault.findFirst({ where: { userId, type: 'staking' } }),
    ]);
    if (!avail || avail.balance < amountNum) throw new Error('Insufficient balance');
    if (!staking) throw new Error('Staking vault not found');
    const txHash = randomBytes(32).toString('hex');
    const explorerUrl = `${EXPLORER_BASE}/${txHash}`;
    await prisma.$transaction([
      prisma.vault.update({ where: { id: avail.id }, data: { balance: { decrement: amountNum } } }),
      prisma.vault.update({ where: { id: staking.id }, data: { balance: { increment: amountNum } } }),
    ]);
    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'stake',
        fromAddress: user?.flowAddress || '',
        toAddress: 'flow-staking-contract',
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        explorerUrl,
        metadata: { apy: '8.5%' } as Prisma.InputJsonValue,
        confirmedAt: new Date(),
      },
    });
    return { explorerUrl };
  }

  if (endpoint.includes('/rules')) {
    const { type, config, frequency } = body;
    const [hours, minutes] = (body.time || '09:00').split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    const targetDay = body.dayOfWeek ?? 5;
    const currentDay = now.getDay();
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setDate(next.getDate() + daysUntil);

    const rule = await prisma.rule.create({
      data: {
        userId,
        type,
        status: 'active',
        config: config as Prisma.InputJsonValue,
        nextExecution: next,
        scheduledTransaction: {
          create: {
            scheduleId: `auto_${Date.now()}`,
            frequency: frequency || 'weekly',
            dayOfWeek: targetDay,
            time: body.time || '09:00',
            status: 'active',
            nextExecution: next,
          },
        },
      },
    });
    return { ruleId: rule.id };
  }

  return {};
}

function buildExecutionPayload(intent: any): { endpoint: string; body: Record<string, any> } | null {
  const { action, parameters } = intent;
  if (!parameters) return null;
  switch (action) {
    case 'send':
      if (parameters.recipient && parameters.amount) {
        return {
          endpoint: '/api/v1/transactions/send',
          body: { recipient: parameters.recipient, amount: parameters.amount, note: parameters.note },
        };
      }
      return null;
    case 'save':
      if (parameters.amount) {
        // If a frequency is provided, create a recurring rule instead of a one-time save
        if (parameters.frequency) {
          return {
            endpoint: '/api/v1/rules',
            body: {
              type: 'save',
              config: { amount: parameters.amount, toVault: parameters.vault || 'savings' },
              frequency: parameters.frequency,
            },
          };
        }
        return {
          endpoint: '/api/v1/transactions/save',
          body: { amount: parameters.amount, toVault: parameters.vault || 'savings' },
        };
      }
      return null;
    case 'swap':
      if (parameters.fromVault && parameters.toVault && parameters.amount) {
        return {
          endpoint: '/api/v1/transactions/swap',
          body: { fromVault: parameters.fromVault, toVault: parameters.toVault, amount: parameters.amount },
        };
      }
      return null;
    case 'stake':
      if (parameters.amount) {
        return { endpoint: '/api/v1/transactions/stake', body: { amount: parameters.amount } };
      }
      return null;
    case 'dca':
      if (parameters.amount && parameters.frequency) {
        return {
          endpoint: '/api/v1/rules',
          body: {
            type: 'dca',
            config: { amount: parameters.amount, frequency: parameters.frequency },
            frequency: parameters.frequency,
          },
        };
      }
      return null;
    default:
      return null;
  }
}

// POST /api/v1/chat
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ success: false, error: 'Message required' });
    return;
  }
  try {
    const [user, vaults] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { autonomyMode: true, dailyLimit: true, dailySpent: true, flowAddress: true },
      }),
      prisma.vault.findMany({ where: { userId: req.userId } }),
    ]);
    const context = {
      autonomyMode: user?.autonomyMode || 'manual',
      dailyLimit: user?.dailyLimit,
      dailySpent: user?.dailySpent,
      flowAddress: user?.flowAddress,
      vaults: vaults.reduce((acc: Record<string, number>, v) => ({ ...acc, [v.type]: v.balance }), {}),
    };
    await prisma.chatMessage.create({
      data: { userId: req.userId!, role: 'user', content: message, parsedIntent: Prisma.JsonNull, confidenceScore: null },
    });
    const aiService = getAIService();
    const aiResponse = await aiService.process(message, context);
    const executionPayload = buildExecutionPayload(aiResponse.intent);

    // Autopilot: auto-execute if user is in autopilot mode and there is an action to take
    let autopilotResult: { explorerUrl?: string; ruleId?: string } | null = null;
    if (user?.autonomyMode === 'autopilot' && executionPayload) {
      try {
        autopilotResult = await executeActionInternal(req.userId!, executionPayload);
      } catch (e) {
        logger.warn('Autopilot execution failed', { err: (e as Error).message });
      }
    }

    const agentMsg = await prisma.chatMessage.create({
      data: {
        userId: req.userId!,
        role: 'agent',
        content: aiResponse.message,
        parsedIntent: aiResponse.intent as unknown as Prisma.InputJsonValue,
        confidenceScore: aiResponse.intent?.confidence ?? null,
      },
    });
    res.json({
      success: true,
      data: {
        reply: aiResponse.message,
        intent: aiResponse.intent,
        actionRequired: aiResponse.actionRequired,
        executionPayload: autopilotResult ? null : executionPayload, // hide button if autopilot already executed
        autopilotResult,
        messageId: agentMsg.id,
      },
    });
  } catch (err) {
    logger.error('Chat error', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'AI service unavailable' });
  }
});

// GET /api/v1/chat/history
router.get('/history', auth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, role: true, content: true, parsedIntent: true, confidenceScore: true, createdAt: true },
    });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

export default router;
