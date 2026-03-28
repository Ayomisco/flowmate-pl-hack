import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { env, validateEnv } from './config/env.js';
import logger from './config/logger.js';

const app = express();

// Validate environment
validateEnv();

// Security middleware
app.use(helmet());
app.use(corsMiddleware);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    version: '1.0.0',
    name: 'FlowMate API',
    environment: env.nodeEnv,
  });
});

app.get('/api/v1/status', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    fluxNetwork: env.flowNetwork,
    database: env.databaseUrl ? 'configured' : 'not configured',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = env.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.nodeEnv} mode`);
});

export default app;
