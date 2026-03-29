import { Router, Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const auth = authenticateToken as unknown as RequestHandler;

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password required' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // Generate a unique Flow address and user ID using cryptographically secure random bytes
    const flowAddress = `0x${randomBytes(8).toString('hex')}`;
    const magicUserId = `user_${randomBytes(4).toString('hex')}`;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        flowAddress,
        magicUserId,
        autonomyMode: 'manual',
        dailyLimit: 10000,
      },
    });

    // Seed default vaults
    await prisma.vault.createMany({
      data: [
        { userId: user.id, type: 'available', balance: 0 },
        { userId: user.id, type: 'savings', balance: 0 },
        { userId: user.id, type: 'emergency', balance: 0 },
        { userId: user.id, type: 'staking', balance: 0 },
      ],
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, {
      expiresIn: env.jwtExpiry as any,
    });

    logger.info('User registered', { userId: user.id, email });
    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, flowAddress: user.flowAddress, autonomyMode: user.autonomyMode },
      },
    });
  } catch (err) {
    logger.error('Registration error', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, {
      expiresIn: env.jwtExpiry as any,
    });

    logger.info('User logged in', { userId: user.id });
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, flowAddress: user.flowAddress, autonomyMode: user.autonomyMode },
      },
    });
  } catch (err) {
    logger.error('Login error', { err: (err as Error).message });
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// GET /api/v1/auth/me
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, flowAddress: true, autonomyMode: true, dailyLimit: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

export default router;
