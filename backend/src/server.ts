import app from './app.js';
import { env } from './config/env.js';
import logger from './config/logger.js';

const PORT = env.port;
app.listen(PORT, () => {
  logger.info(`FlowMate API running on port ${PORT} in ${env.nodeEnv} mode`);
});
