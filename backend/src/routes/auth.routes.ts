import { Router, Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Magic } from '@magic-sdk/admin';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sendWelcomeFlow, WELCOME_AMOUNT } from '../services/flow-transfer.service.js';
import { createFlowAccount, isValidFlowAddress } from '../services/flow-account.service.js';

const auth = authenticateToken as unknown as RequestHandler;
const router = Router();
const prisma = new PrismaClient();

// Magic Admin SDK — validates DID tokens issued by Magic on the frontend
if (!env.magicSecretKey) {
  logger.error('MAGIC_SECRET_KEY is not set — Magic token validation will fail');
}
const magic = new Magic(env.magicSecretKey);

// ─── POST /api/v1/auth/login ─────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const rawAuth = req.headers['authorization'] || '';
  const didToken = (rawAuth.replace(/^Bearer\s+/i, '').trim()) || req.body.didToken;

  if (!didToken) {
    res.status(400).json({ success: false, error: 'DID token required' });
    return;
  }

  logger.info('Magic login attempt', { tokenLen: didToken.length, tokenPrefix: didToken.slice(0, 20) });

  try {
    magic.token.validate(didToken);

    const issuer = magic.token.getIssuer(didToken);
    const userMetadata = await magic.users.getMetadataByIssuer(issuer);
    const email = userMetadata.email ?? `${issuer.slice(-8)}@magic.flow`;

    // Check if user already exists — we don't want to overwrite their Flow address
    const existingUser = await prisma.user.findUnique({ where: { magicUserId: issuer } });
    const isNewUser = !existingUser;

    // Determine Flow address for new users
    let flowAddress = (userMetadata as any).wallets?.[0]?.public_address
      || userMetadata.publicAddress
      || '';

    if (isNewUser) {
      if (!isValidFlowAddress(flowAddress)) {
        // Magic didn't provide a real Cadence address — create one on-chain
        logger.info('Creating new Flow Cadence account for user', { email });
        const newAccount = await createFlowAccount();
        if (newAccount) {
          flowAddress = newAccount.address;
          logger.info('Flow account created', { email, flowAddress });
        } else {
          // Fallback: derive a deterministic address from the issuer DID
          // (not a real account, but unique per user — better than nothing)
          flowAddress = `0x${issuer.replace(/[^a-f0-9]/gi, '').slice(0, 16).padEnd(16, '0')}`;
          logger.warn('Using derived fallback Flow address', { email, flowAddress });
        }
      }
    }

    // Upsert — create on first login, update only email on subsequent logins
    // We never overwrite flowAddress for existing users
    const user = await prisma.user.upsert({
      where: { magicUserId: issuer },
      update: { email },
      create: {
        email,
        passwordHash: '',
        flowAddress,
        magicUserId: issuer,
        autonomyMode: 'manual',
        dailyLimit: 10000,
      },
    });

    // Seed default vaults + welcome bonus — serializable transaction prevents duplicate vaults
    const vaultsCreated = await prisma.$transaction(async (tx) => {
      const count = await tx.vault.count({ where: { userId: user.id } });
      if (count > 0) return false;
      await tx.vault.createMany({
        data: [
          { userId: user.id, type: 'available', balance: WELCOME_AMOUNT },
          { userId: user.id, type: 'savings', balance: 0 },
          { userId: user.id, type: 'emergency', balance: 0 },
          { userId: user.id, type: 'staking', balance: 0 },
        ],
      });
      return true;
    }, { isolationLevel: 'Serializable' });

    if (vaultsCreated) {

      const pendingHash = `pending:${randomBytes(16).toString('hex')}`;

      await prisma.transaction.create({
        data: {
          userId: user.id,
          txHash: pendingHash,
          type: 'receive',
          fromAddress: env.flowAccountAddress || '0xc26f3fa2883a46db',
          toAddress: user.flowAddress,
          amount: WELCOME_AMOUNT,
          token: 'FLOW',
          status: 'pending',
          metadata: {
            note: 'Welcome bonus from FlowMate treasury',
            source: 'welcome_bonus',
          } as Prisma.InputJsonValue,
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'payment_sent',
          title: 'Welcome bonus received!',
          body: `${WELCOME_AMOUNT} FLOW has been sent to your wallet. Start saving, sending, and investing autonomously!`,
          metadata: { amount: WELCOME_AMOUNT } as Prisma.InputJsonValue,
        },
      });

      logger.info('New user seeded', { userId: user.id, email, amount: WELCOME_AMOUNT });

      // Fire-and-forget: send real FLOW on-chain, update DB record when confirmed
      sendWelcomeFlow(user.flowAddress).then(async (realTxId) => {
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
            logger.info('Welcome bonus confirmed on-chain', { userId: user.id, realTxId });
          } catch (e) {
            logger.warn('Failed to update welcome tx record', { err: (e as Error).message });
          }
        } else {
          // On-chain transfer failed — mark as failed
          await prisma.transaction.updateMany({
            where: { userId: user.id, txHash: pendingHash },
            data: { status: 'failed' },
          }).catch(() => {});
          logger.warn('Welcome bonus on-chain transfer failed', { userId: user.id });
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
