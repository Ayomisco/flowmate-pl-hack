import cors from 'cors';
import { env } from '../config/env.js';

const allowedOrigins = [
  env.frontendUrl,
  env.frontendProductionUrl,
  'https://flowmate-two.vercel.app',
  'https://flowmate.vercel.app',
  /\.vercel\.app$/,   // any vercel preview URL
  'http://localhost:5173',
  'http://localhost:8080',
];

export const corsMiddleware = cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    cb(null, ok ? origin : false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
