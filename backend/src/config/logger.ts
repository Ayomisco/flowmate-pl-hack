import winston from 'winston';
import { env } from './env.js';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Only write to file in development — Vercel serverless has a read-only filesystem
if (env.nodeEnv === 'development') {
  transports.push(new winston.transports.File({ filename: env.logFile }));
}

const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flowmate-backend' },
  transports,
});

export default logger;
