import { Router, Response, RequestHandler } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getAIService } from '../services/ai.service.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';
import logger from '../config/logger.js';
import { sendFlowFromAdmin } from '../services/flow-transfer.service.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

async function executeActionInternal(
  userId: string,
  payload: { endpoint: string; body: Record<string, any> }
): Promise<{ ruleId?: string }> {
  const { endpoint, body } = payload;

  if (endpoint.includes('/send')) {
    const { recipient, amount, note } = body;
    const amountNum = parseFloat(amount);
    const [user, vault] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { flowAddress: true, dailyLimit: true, dailySpent: true } }),
      prisma.vault.findFirst({ where: { userId, type: 'available' } }),
    ]);
    if (!vault) throw new Error('Available vault not found');

    // Atomic balance deduction — prevents double-spend
    const deducted = await prisma.vault.updateMany({
      where: { id: vault.id, balance: { gte: amountNum } },
      data: { balance: { decrement: amountNum } },
    });
    if (deducted.count === 0) throw new Error('Insufficient balance');

    // Submit to Flow blockchain using admin account (custodial)
    let realTxId: string | null = null;
    try {
      realTxId = await sendFlowFromAdmin(recipient, amountNum);
    } catch (e) {
      await prisma.vault.update({ where: { id: vault.id }, data: { balance: { increment: amountNum } } });
      throw e;
    }

    if (!realTxId) {
      // On-chain transfer failed — restore balance
      await prisma.vault.update({ where: { id: vault.id }, data: { balance: { increment: amountNum } } });
      await prisma.transaction.create({
        data: {
          userId,
          txHash: `failed:${randomBytes(16).toString('hex')}`,
          type: 'send',
          fromAddress: user?.flowAddress || '',
          toAddress: recipient,
          amount: amountNum,
          token: 'FLOW',
          status: 'failed',
          metadata: note ? { note, source: 'chat', error: 'on-chain transfer failed' } : { source: 'chat', error: 'on-chain transfer failed' } as Prisma.InputJsonValue,
        },
      });
      throw new Error('On-chain transfer failed. Your balance was not affected.');
    }

    const explorerUrl = `https://testnet.flowscan.io/tx/${realTxId}`;

    await prisma.user.update({ where: { id: userId }, data: { dailySpent: { increment: amountNum } } });
    await prisma.transaction.create({
      data: {
        userId,
        txHash: realTxId,
        type: 'send',
        fromAddress: user?.flowAddress || '',
        toAddress: recipient,
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        explorerUrl,
        metadata: note ? { note, source: 'chat' } : Prisma.JsonNull,
        confirmedAt: new Date(),
      },
    });
    await prisma.notification.create({
      data: {
        userId,
        type: 'payment_sent',
        title: `Sent ${amountNum} FLOW`,
        body: `You sent ${amountNum} FLOW to ${recipient}. Transaction confirmed on-chain.`,
        metadata: { amount: amountNum, recipient, txId: realTxId } as Prisma.InputJsonValue,
      },
    });
    return {};
  }

  if (endpoint.includes('/save')) {
    const { amount, toVault = 'savings' } = body;
    const amountNum = parseFloat(amount);
    const [user, avail, dest] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { flowAddress: true } }),
      prisma.vault.findFirst({ where: { userId, type: 'available' } }),
      prisma.vault.findFirst({ where: { userId, type: toVault } }),
    ]);
    if (!avail) throw new Error('Available vault not found');
    if (!dest) throw new Error(`Vault ${toVault} not found`);

    const txHash = `internal:${randomBytes(16).toString('hex')}`;

    // Atomic balance transfer — prevents double-spend
    let transferred = false;
    await prisma.$transaction(async (tx) => {
      const d = await tx.vault.updateMany({
        where: { id: avail.id, balance: { gte: amountNum } },
        data: { balance: { decrement: amountNum } },
      });
      if (d.count === 0) return;
      await tx.vault.update({ where: { id: dest.id }, data: { balance: { increment: amountNum } } });
      transferred = true;
    });
    if (!transferred) throw new Error('Insufficient balance');
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
        metadata: { fromVault: 'available', toVault, source: 'chat' } as Prisma.InputJsonValue,
        confirmedAt: new Date(),
      },
    });
    await prisma.notification.create({
      data: {
        userId,
        type: 'action_executed',
        title: `Saved ${amountNum} FLOW`,
        body: `${amountNum} FLOW moved from available to ${toVault} vault.`,
        metadata: { amount: amountNum, toVault } as Prisma.InputJsonValue,
      },
    });
    return {};
  }

  if (endpoint.includes('/stake')) {
    const { amount } = body;
    const amountNum = parseFloat(amount);
    const [user, avail, staking] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { flowAddress: true } }),
      prisma.vault.findFirst({ where: { userId, type: 'available' } }),
      prisma.vault.findFirst({ where: { userId, type: 'staking' } }),
    ]);
    if (!avail) throw new Error('Available vault not found');
    if (!staking) throw new Error('Staking vault not found');

    const txHash = `internal:${randomBytes(16).toString('hex')}`;

    // Atomic balance transfer — prevents double-spend
    let staked = false;
    await prisma.$transaction(async (tx) => {
      const d = await tx.vault.updateMany({
        where: { id: avail.id, balance: { gte: amountNum } },
        data: { balance: { decrement: amountNum } },
      });
      if (d.count === 0) return;
      await tx.vault.update({ where: { id: staking.id }, data: { balance: { increment: amountNum } } });
      staked = true;
    });
    if (!staked) throw new Error('Insufficient balance');
    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'stake',
        fromAddress: user?.flowAddress || '',
        toAddress: 'vault:staking',
        amount: amountNum,
        token: 'FLOW',
        status: 'confirmed',
        metadata: { apy: '8.5%', source: 'chat' } as Prisma.InputJsonValue,
        confirmedAt: new Date(),
      },
    });
    await prisma.notification.create({
      data: {
        userId,
        type: 'action_executed',
        title: `Staked ${amountNum} FLOW`,
        body: `${amountNum} FLOW staked at 8.5% APY. Keep building your portfolio!`,
        metadata: { amount: amountNum, apy: '8.5%' } as Prisma.InputJsonValue,
      },
    });
    return {};
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
      vaults: vaults.reduce((acc: Record<string, number>, v) => ({ ...acc, [v.type]: Number(v.balance) }), {}),
    };
    await prisma.chatMessage.create({
      data: { userId: req.userId!, role: 'user', content: message, parsedIntent: Prisma.JsonNull, confidenceScore: null },
    });

    // Fetch recent conversation history for AI context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true, parsedIntent: true },
    });

    const aiService = getAIService();
    const aiResponse = await aiService.process(message, context, recentMessages);
    const executionPayload = buildExecutionPayload(aiResponse.intent);

    // Autopilot mode: always show confirmation payload to user
    // Prevents unintended transactions from AI misinterpretation

    const agentMsg = await prisma.chatMessage.create({
      data: {
        userId: req.userId!,
        role: 'agent',
        content: aiResponse.message,
        parsedIntent: aiResponse.intent as unknown as Prisma.InputJsonValue,
        confidenceScore: aiResponse.intent?.confidence ?? null,
      },
    });
    await cacheDel(`chat:history:${req.userId}`);
    res.json({
      success: true,
      data: {
        reply: aiResponse.message,
        intent: aiResponse.intent,
        actionRequired: aiResponse.actionRequired,
        executionPayload,
        messageId: agentMsg.id,
      },
    });
  } catch (err) {
    logger.error('Chat error', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'AI service unavailable' });
  }
});

// GET /api/v1/chat/history — Redis-cached
router.get('/history', auth, async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = `chat:history:${req.userId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, role: true, content: true, parsedIntent: true, confidenceScore: true, createdAt: true },
    });
    await cacheSet(cacheKey, JSON.stringify(messages), 120);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

// POST /api/v1/chat/stream — word-by-word SSE streaming
// Uses one Groq call then streams the reply token-by-token so the frontend
// sees a live typing effect. Works on Vercel (X-Accel-Buffering disables proxy buffering).
router.post('/stream', auth, async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ success: false, error: 'Message required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders(); // send headers immediately so client knows stream started

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

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
      vaults: vaults.reduce((acc: Record<string, number>, v) => ({ ...acc, [v.type]: Number(v.balance) }), {}),
    };

    await prisma.chatMessage.create({
      data: { userId: req.userId!, role: 'user', content: message, parsedIntent: Prisma.JsonNull, confidenceScore: null },
    });

    // Fetch recent conversation history for AI context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true, parsedIntent: true },
    });

    const aiService = getAIService();
    const aiResponse = await aiService.process(message, context, recentMessages);
    const executionPayload = buildExecutionPayload(aiResponse.intent);

    // Autopilot
    let autopilotResult: { ruleId?: string } | null = null;
    if (user?.autonomyMode === 'autopilot' && executionPayload) {
      try {
        autopilotResult = await executeActionInternal(req.userId!, executionPayload);
      } catch (e) {
        logger.warn('Autopilot execution failed (stream)', { err: (e as Error).message });
      }
    }

    // Stream reply word-by-word for a live typing effect
    const words = aiResponse.message.split(' ');
    for (const word of words) {
      send({ token: word + ' ' });
      await new Promise(resolve => setTimeout(resolve, 28));
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

    await cacheDel(`chat:history:${req.userId}`);

    send({
      done: true,
      intent: aiResponse.intent,
      executionPayload: autopilotResult ? null : executionPayload,
      autopilotResult,
      messageId: agentMsg.id,
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    logger.error('Stream chat error', { err: (err as Error).message });
    send({ error: 'AI service unavailable' });
    res.end();
  }
});

export default router;
