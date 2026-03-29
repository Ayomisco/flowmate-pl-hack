import { Router, Response, RequestHandler } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getAIService } from '../services/ai.service.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

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
        select: { autonomyMode: true, dailyLimit: true, dailySpent: true },
      }),
      prisma.vault.findMany({ where: { userId: req.userId } }),
    ]);

    const context = {
      autonomyMode: user?.autonomyMode,
      dailyLimit: user?.dailyLimit,
      dailySpent: user?.dailySpent,
      vaults: vaults.reduce((acc, v) => ({ ...acc, [v.type]: v.balance }), {}),
    };

    await prisma.chatMessage.create({
      data: {
        userId: req.userId!,
        role: 'user',
        content: message,
        confidenceScore: null,
        parsedIntent: Prisma.JsonNull,
      },
    });

    const aiService = getAIService();
    const aiResponse = await aiService.process(message, context);

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
      select: {
        id: true,
        role: true,
        content: true,
        parsedIntent: true,
        confidenceScore: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

export default router;
