import { Router, Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Magic } from '@magic-sdk/admin';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sendWelcomeFlow, WELCOME_AMOUNT } from '../services/flow-transfer.service.js';

const auth = authenticateToken as unknown as RequestHandler;
const router = Router();
const prisma = new PrismaClient();

// Magic Admin SDK — validates DID tokens issued by Magic on the frontend
const magic = new Magic(env.magicSecretKey);

// ─── POST /api/v1/auth/login ─────────────────────────────────────────────────
// Frontend sends the Magic DID token in Authorization header or body.
// We verify it, upsert the user, and return a signed JWT.
router.post('/login', async (req: Request, res: Response) => {
  const didToken =
    req.headers['authorization']?.replace('Bearer ', '') ||
    req.body.didToken;

  if (!didToken) {
    res.status(400).json({ success: false, error: 'DID token required' });
    return;
  }

  try {
    // Throws if the token is invalid or expired
    magic.token.validate(didToken);

    // Issuer is the unique Magic user identifier (did:ethr:0x...)
    const issuer = magic.token.getIssuer(didToken);

    // Get user metadata from Magic — includes email and publicAddress
    const userMetadata = await magic.users.getMetadataByIssuer(issuer);

    const email = userMetadata.email ?? `${issuer.slice(-8)}@magic.flow`;
    // Magic's publicAddress is the user's linked wallet (Flow address via @magic-ext/flow)
    const flowAddress = (userMetadata as any).wallets?.[0]?.public_address
      || userMetadata.publicAddress
      || `0x${issuer.replace(/[^a-f0-9]/gi, '').slice(0, 16).padEnd(16, '0')}`;

    // Upsert — create on first login, update metadata on subsequent logins
    const user = await prisma.user.upsert({
      where: { magicUserId: issuer },
      update: { email, flowAddress },
      create: {
        email,
        passwordHash: '',   // Magic handles auth — no password needed
        flowAddress,
        magicUserId: issuer,
        autonomyMode: 'manual',
        dailyLimit: 10000,
      },
    });

    // Seed default vaults + welcome bonus for brand-new users
    const vaultCount = await prisma.vault.count({ where: { userId: user.id } });
    const isNewUser = vaultCount === 0;

    if (isNewUser) {
      await prisma.vault.createMany({
        data: [
          { userId: user.id, type: 'available', balance: WELCOME_AMOUNT },
          { userId: user.id, type: 'savings', balance: 0 },
          { userId: user.id, type: 'emergency', balance: 0 },
          { userId: user.id, type: 'staking', balance: 0 },
        ],
      });

      // Create a pending transaction record — explorerUrl will be set when on-chain tx confirms
      const pendingHash = `pending:${randomBytes(16).toString('hex')}`;

      await prisma.transaction.create({
        data: {
          userId: user.id,
          txHash: pendingHash,
          type: 'receive',
          fromAddress: env.flowAccountAddress || '0xc26f3fa2883a46db',
          toAddress: flowAddress,
          amount: WELCOME_AMOUNT,
          token: 'FLOW',
          status: 'pending',
          metadata: {
            note: 'Welcome bonus from FlowMate treasury',
            source: 'welcome_bonus',
          } as Prisma.InputJsonValue,
        },
      });

      // Create welcome notification (persists in notification bell)
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'payment_sent',
          title: '🎉 Welcome bonus received!',
          body: `${WELCOME_AMOUNT} FLOW has been sent to your wallet from the FlowMate treasury. Start saving, sending, and investing autonomously!`,
          metadata: {
            amount: WELCOME_AMOUNT,
          } as Prisma.InputJsonValue,
        },
      });

      logger.info('New user seeded with welcome bonus', { userId: user.id, email, amount: WELCOME_AMOUNT });

      // Fire-and-forget: try real on-chain transfer; update record with real txId if successful
      sendWelcomeFlow(flowAddress).then(async (realTxId) => {
        if (realTxId) {
          const realExplorerUrl = `https://testnet.flowscan.io/tx/${realTxId}`;
          try {
            await prisma.transaction.updateMany({
              where: { userId: user.id, txHash: pendingHash },
              data: {
                txHash: realTxId,
                explorerUrl: realExplorerUrl,
                status: 'confirmed',
                confirmedAt: new Date(),
                metadata: {
                  note: 'Welcome bonus from FlowMate treasury',
                  source: 'welcome_bonus',
                  onChain: true,
                } as Prisma.InputJsonValue,
              },
            });
            await prisma.notification.updateMany({
              where: { userId: user.id, type: 'payment_sent', metadata: { path: ['amount'], equals: WELCOME_AMOUNT } },
              data: {
                metadata: {
                  amount: WELCOME_AMOUNT,
                  explorerUrl: realExplorerUrl,
                  txHash: realTxId,
                  onChain: true,
                } as Prisma.InputJsonValue,
              },
            });
            logger.info('Welcome bonus confirmed on-chain', { userId: user.id, realTxId });
          } catch (e) {
            logger.warn('Failed to update welcome tx with real txId', { err: (e as Error).message });
          }
        }
      }).catch(() => { /* already logged in sendWelcomeFlow */ });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, {
      expiresIn: env.jwtExpiry as any,
    });

    logger.info('Magic login success', { userId: user.id, email });
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          flowAddress: user.flowAddress,
          autonomyMode: user.autonomyMode,
        },
      },
    });
  } catch (err) {
    logger.error('Magic login failed', { err: (err as Error).message });
    res.status(401).json({ success: false, error: 'Invalid or expired magic token' });
  }
});

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────────────
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, email: true, flowAddress: true,
        autonomyMode: true, dailyLimit: true, createdAt: true,
      },
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
