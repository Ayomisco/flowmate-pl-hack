import { Router, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

// GET /api/v1/notifications
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = `notif:${req.userId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: req.userId, read: false } }),
    ]);

    const data = { notifications, unreadCount };
    await cacheSet(cacheKey, JSON.stringify(data), 60);
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Get notifications failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/v1/notifications/read-all  (must be before /:id/read)
router.patch('/read-all', auth, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });
    await cacheDel(`notif:${req.userId}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', auth, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { read: true },
    });
    await cacheDel(`notif:${req.userId}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

export default router;
