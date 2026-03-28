import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/app.log' }),
  ],
});

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.FRONTEND_PRODUCTION_URL || 'https://flowmate.app',
  ],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date(),
  });
  next();
});

// ==================== ROUTES ====================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// API version
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    version: '1.0.0',
    name: 'FlowMate Autonomous Financial API',
    description: 'Autonomous financial operating system on Flow blockchain',
  });
});

// Placeholder routes (to be implemented)
app.get('/api/v1/status', (req: Request, res: Response) => {
  res.status(200).json({
    backend: 'ready',
    database: 'pending',
    blockchain: 'pending',
    ai: 'pending',
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  logger.info(`🚀 FlowMate Backend running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API: http://localhost:${PORT}/api/v1`);
});

export default app;
