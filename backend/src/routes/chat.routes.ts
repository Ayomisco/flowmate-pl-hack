import { Router, Response, RequestHandler } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getAIService } from '../services/ai.service.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

function buildExecutionPayload(intent: any): { endpoint: string; body: Record<string, any> } | null {
  const { action, parameters } = intent;
  if (!parameters) return null;
  switch (action) {
    case 'send':
      if (parameters.recipient && parameters.amount) {
        return { endpoint: '/api/v1/transactions/send', body: { recipient: parameters.recipient, amount: parameters.amount, note: parameters.note } };
      }
      return null;
    case 'save':
      if (parameters.amount) {
        return { endpoint: '/api/v1/transactions/save', body: { amount: parameters.amount, toVault: parameters.vault || 'savings' } };
      }
      return null;
    case 'swap':
      if (parameters.fromVault && parameters.toVault && parameters.amount) {
        return { endpoint: '/api/v1/transactions/swap', body: { fromVault: parameters.fromVault, toVault: parameters.toVault, amount: parameters.amount } };
      }
      return null;
    case 'stake':
      if (parameters.amount) {
        return { endpoint: '/api/v1/transactions/stake', body: { amount: parameters.amount } };
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
        executionPayload,
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
