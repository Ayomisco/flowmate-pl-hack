import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',

  // Flow Blockchain
  flowNetwork: process.env.FLOW_NETWORK || 'testnet',
  flowAccessNode: process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
  flowAccountAddress: process.env.FLOW_ACCOUNT_ADDRESS || '',
  flowAccountPrivateKey: process.env.FLOW_ACCOUNT_PRIVATE_KEY || '',

  // Smart Contract Addresses
  flowmateAgentContract: process.env.FLOWMATE_AGENT_CONTRACT || '',
  vaultManagerContract: process.env.VAULT_MANAGER_CONTRACT || '',
  scheduledTransactionsContract: process.env.SCHEDULED_TRANSACTIONS_CONTRACT || '',

  // Magic Link
  magicApiKey: process.env.MAGIC_API_KEY || '',
  magicSecretKey: process.env.MAGIC_SECRET_KEY || '',

  // AI Provider
  aiProvider: process.env.AI_PROVIDER || 'groq',
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama2',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
  logFile: process.env.LOG_FILE || 'logs/app.log',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  frontendProductionUrl: process.env.FRONTEND_PRODUCTION_URL || 'https://flowmate.example.com',
};

export const validateEnv = () => {
  const required = [
    'databaseUrl',
    'jwtSecret',
    'flowAccountAddress',
    'flowAccountPrivateKey',
    'magicApiKey',
    'magicSecretKey',
    'aiProvider',
  ];

  for (const key of required) {
    if (!env[key as keyof typeof env]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
};
