import { createClient } from 'redis';
import { env } from './env.js';
import logger from './logger.js';

const client = createClient({ url: env.redisUrl });

client.on('error', (err) => logger.warn('Redis connection error (non-fatal)', { err: err.message }));
client.on('connect', () => logger.info('Redis connected', { url: env.redisUrl.split('@').pop() }));

// Connect eagerly — if it fails, the rest of the app still works
client.connect().catch((err) => {
  logger.warn('Redis initial connect failed — running without cache', { err: err.message });
});

export const redis = client;

export async function cacheGet(key: string): Promise<string | null> {
  try { return await client.get(key); } catch { return null; }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  try { await client.set(key, value, { EX: ttlSeconds }); } catch { /* non-fatal */ }
}

export async function cacheDel(key: string): Promise<void> {
  try { await client.del(key); } catch { /* non-fatal */ }
}
