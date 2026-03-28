import dotenv from "dotenv";
import path from "path";

dotenv.config();

interface EnvConfig {
  // Server
  port: number;
  nodeEnv: "development" | "production" | "test";
  apiBaseUrl: string;

  // Database
  databaseUrl: string;

  // JWT
  jwtSecret: string;
  jwtExpiry: string;

  // Flow Blockchain
  flowNetwork: "emulator" | "testnet" | "mainnet";
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

  // AI Provider
  aiProvider: "claude" | "gemini" | "openai" | "ollama" | "groq" | "llama";
  claudeApiKey: string;
  claudeModel: string;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  groqApiKey: string;
  groqModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  llamaUrl: string;
  llamaModel: string;

  // Redis
  redisUrl: string;

  // Frontend
  frontendUrl: string;
  frontendProductionUrl: string;

  // Logging
  logLevel: string;
  logFile: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value || defaultValue || "";
};

const config: EnvConfig = {
  // Server
  port: parseInt(getEnv("PORT", "3000"), 10),
  nodeEnv: (getEnv("NODE_ENV", "development") as "development" | "production" | "test"),
  apiBaseUrl: getEnv("API_BASE_URL", "http://localhost:3000"),

  // Database
  databaseUrl: getEnv("DATABASE_URL"),

  // JWT
  jwtSecret: getEnv("JWT_SECRET"),
  jwtExpiry: getEnv("JWT_EXPIRY", "7d"),

  // Flow Blockchain
  flowNetwork: (getEnv("FLOW_NETWORK", "testnet") as "emulator" | "testnet" | "mainnet"),
  flowAccessNode: getEnv("FLOW_ACCESS_NODE", "https://rest-testnet.onflow.org"),
  flowAccountAddress: getEnv("FLOW_ACCOUNT_ADDRESS"),
  flowAccountPrivateKey: getEnv("FLOW_ACCOUNT_PRIVATE_KEY"),

  // Smart Contracts
  flowmateAgentContract: getEnv("FLOWMATE_AGENT_CONTRACT", ""),
  vaultManagerContract: getEnv("VAULT_MANAGER_CONTRACT", ""),
  scheduledTransactionsContract: getEnv("SCHEDULED_TRANSACTIONS_CONTRACT", ""),

  // Magic Link
  magicApiKey: getEnv("MAGIC_API_KEY"),
  magicSecretKey: getEnv("MAGIC_SECRET_KEY"),

  // AI Provider
  aiProvider: (getEnv("AI_PROVIDER", "claude") as "claude" | "gemini" | "openai" | "ollama" | "groq" | "llama"),
  claudeApiKey: getEnv("CLAUDE_API_KEY", ""),
  claudeModel: getEnv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
  geminiApiKey: getEnv("GEMINI_API_KEY", ""),
  geminiModel: getEnv("GEMINI_MODEL", "gemini-1.5-pro"),
  openaiApiKey: getEnv("OPENAI_API_KEY", ""),
  openaiModel: getEnv("OPENAI_MODEL", "gpt-4o-mini"),
  groqApiKey: getEnv("GROQ_API_KEY", ""),
  groqModel: getEnv("GROQ_MODEL", "mixtral-8x7b-32768"),
  ollamaUrl: getEnv("OLLAMA_URL", "http://localhost:11434"),
  ollamaModel: getEnv("OLLAMA_MODEL", "llama2"),
  llamaUrl: getEnv("LLAMA_URL", "http://localhost:8080"),
  llamaModel: getEnv("LLAMA_MODEL", "llama"),

  // Redis
  redisUrl: getEnv("REDIS_URL", "redis://localhost:6379"),

  // Frontend
  frontendUrl: getEnv("FRONTEND_URL", "http://localhost:5173"),
  frontendProductionUrl: getEnv("FRONTEND_PRODUCTION_URL", "https://flowmate.app"),

  // Logging
  logLevel: getEnv("LOG_LEVEL", "info"),
  logFile: getEnv("LOG_FILE", "logs/app.log"),
};

export default config;
