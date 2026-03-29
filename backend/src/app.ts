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

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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
