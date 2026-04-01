import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env, validateEnv } from './config/env.js';
import logger from './config/logger.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import vaultRoutes from './routes/vault.routes.js';
import chatRoutes from './routes/chat.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import rulesRoutes from './routes/rules.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

const app = express();

validateEnv();

// Trust Vercel's proxy so rate-limiter sees real client IPs, not the load balancer
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.magic.link", "https://auth.magic.link"],
      frameSrc: ["'self'", "https://*.magic.link", "https://auth.magic.link"],
      frameAncestors: ["'self'", "https://*.magic.link"],
      connectSrc: ["'self'", "https://*.magic.link", "https://api.magic.link", "https://auth.magic.link", "https://*.neon.tech", "https://rest-testnet.onflow.org", "wss://*.magic.link"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://*.magic.link"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required so Magic iframe can load
  crossOriginOpenerPolicy: false,   // Required for Magic popup flow
}));
app.use(corsMiddleware);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Convert Prisma Decimal objects to numbers in JSON responses
app.set('json replacer', (_key: string, value: any) => {
  if (value !== null && typeof value === 'object' && typeof value.toNumber === 'function' && 'd' in value && 'e' in value && 's' in value) {
    return value.toNumber();
  }
  return value;
});
app.use('/api/', apiLimiter);

// Health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.nodeEnv });
});

// API info
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({ version: '1.0.0', name: 'FlowMate API', environment: env.nodeEnv });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vaults', vaultRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/rules', rulesRoutes);
app.use('/api/v1/goals', goalsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

app.use(errorHandler);

export default app;
