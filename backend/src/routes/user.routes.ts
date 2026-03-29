import { Router, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticateToken as unknown as RequestHandler;

// GET /api/v1/users/me
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        flowAddress: true,
        autonomyMode: true,
        dailyLimit: true,
        dailySpent: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PUT /api/v1/users/me
router.put('/me', auth, async (req: AuthRequest, res: Response) => {
  const { email, dailyLimit } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(email && { email }),
        ...(dailyLimit !== undefined && { dailyLimit: parseFloat(dailyLimit) }),
      },
      select: { id: true, email: true, flowAddress: true, autonomyMode: true, dailyLimit: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('Update user failed', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// PUT /api/v1/users/me/autonomy
router.put('/me/autonomy', auth, async (req: AuthRequest, res: Response) => {
  const { mode } = req.body;
  if (!['manual', 'assist', 'autopilot'].includes(mode)) {
    res.status(400).json({ success: false, error: 'Invalid autonomy mode' });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { autonomyMode: mode },
      select: { id: true, autonomyMode: true },
    });
    logger.info('Autonomy mode updated', { userId: req.userId, mode });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update autonomy mode' });
  }
});

export default router;
