import app from './app.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import { initializeRules } from './services/rule-executor.service.js';

const PORT = env.port;

async function startServer() {
  // Initialize automation rules
  try {
    await initializeRules();
  } catch (err) {
    logger.error('Failed to initialize rules', { error: (err as Error).message });
  }

  app.listen(PORT, () => {
    logger.info(`FlowMate API running on port ${PORT} in ${env.nodeEnv} mode`);
  });
}

startServer().catch((err) => {
  logger.error('Server startup failed', { error: (err as Error).message });
  process.exit(1);
});
