import dotenv from 'dotenv';

dotenv.config();

// Trim env vars — Vercel can inject trailing newlines
const e = (key: string, fallback = '') => (process.env[key] || fallback).trim();

export const env = {
  // Server
  port: parseInt(e('PORT', '3000')),
  nodeEnv: e('NODE_ENV', 'development'),
  apiBaseUrl: e('API_BASE_URL', 'http://localhost:3000'),

  // Database
  databaseUrl: e('DATABASE_URL'),

  // JWT
  jwtSecret: e('JWT_SECRET'),
  jwtExpiry: e('JWT_EXPIRY', '7d'),

  // Flow Blockchain
  flowNetwork: e('FLOW_NETWORK', 'testnet'),
  flowAccessNode: e('FLOW_ACCESS_NODE', 'https://rest-testnet.onflow.org'),
  flowAccountAddress: e('FLOW_ACCOUNT_ADDRESS'),
  flowAccountPrivateKey: e('FLOW_ACCOUNT_PRIVATE_KEY'),

  // Smart Contract Addresses
  flowmateAgentContract: e('FLOWMATE_AGENT_CONTRACT'),
  vaultManagerContract: e('VAULT_MANAGER_CONTRACT'),
  scheduledTransactionsContract: e('SCHEDULED_TRANSACTIONS_CONTRACT'),

  // Magic Link
  magicApiKey: e('MAGIC_API_KEY'),
  magicSecretKey: e('MAGIC_SECRET_KEY'),

  // AI Provider
  aiProvider: e('AI_PROVIDER', 'groq'),
  claudeApiKey: e('CLAUDE_API_KEY'),
  claudeModel: e('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
  groqApiKey: e('GROQ_API_KEY'),
  groqModel: e('GROQ_MODEL', 'llama3-8b-8192'), // mixtral-8x7b-32768 was discontinued
  ollamaUrl: e('OLLAMA_URL', 'http://localhost:11434'),
  ollamaModel: e('OLLAMA_MODEL', 'llama2'),

  // Logging
  logLevel: e('LOG_LEVEL', 'info'),
  logFile: e('LOG_FILE', 'logs/app.log'),

  // Redis
  redisUrl: e('REDIS_URL', 'redis://localhost:6379'),

  // Frontend
  frontendUrl: e('FRONTEND_URL', 'http://localhost:5173'),
  frontendProductionUrl: e('FRONTEND_PRODUCTION_URL', 'https://flowmate-two.vercel.app'),
};

export const validateEnv = () => {
  const required = ['databaseUrl', 'jwtSecret'] as const;
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
};
