import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  // Server
  port: number;
  nodeEnv: string;
  apiBaseUrl: string;

  // Database
  databaseUrl: string;

  // JWT
  jwtSecret: string;
  jwtExpiry: string;

  // Flow Blockchain
  flowNetwork: string;
  flowAccessNode: string;
  flowAccountAddress: string;
  flowAccountPrivateKey: string;

  // Smart Contracts
  flowmateAgentContract: string;
  vaultManagerContract: string;
  scheduledTransactionsContract: string;

  // Magic Link
  magicApiKey: string;
  magicSecretKey: string;

  // AI Configuration
  aiProvider: 'claude' | 'gemini' | 'openai' | 'ollama';
  claudeApiKey: string;
  claudeModel: string;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  ollamaUrl: string;
  ollamaModel: string;

  // Logging
  logLevel: string;
  logFile: string;

  // Redis
  redisUrl: string;

  // Frontend
  frontendUrl: string;
  frontendProductionUrl: string;
}

const config: EnvConfig = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',

  // Flow Blockchain
  flowNetwork: process.env.FLOW_NETWORK || 'testnet',
  flowAccessNode: process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
  flowAccountAddress: process.env.FLOW_ACCOUNT_ADDRESS || '',
  flowAccountPrivateKey: process.env.FLOW_ACCOUNT_PRIVATE_KEY || '',

  // Smart Contracts
  flowmateAgentContract: process.env.FLOWMATE_AGENT_CONTRACT || '0x01',
  vaultManagerContract: process.env.VAULT_MANAGER_CONTRACT || '0x02',
  scheduledTransactionsContract: process.env.SCHEDULED_TRANSACTIONS_CONTRACT || '0x03',

  // Magic Link
  magicApiKey: process.env.MAGIC_API_KEY || '',
  magicSecretKey: process.env.MAGIC_SECRET_KEY || '',

  // AI Configuration
  aiProvider: (process.env.AI_PROVIDER || 'claude') as 'claude' | 'gemini' | 'openai' | 'ollama',
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama2',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/app.log',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  frontendProductionUrl: process.env.FRONTEND_PRODUCTION_URL || 'https://flowmate.app',
};

export default config;
