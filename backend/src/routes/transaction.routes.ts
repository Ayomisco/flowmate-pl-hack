import { Router, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

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

export default router;
