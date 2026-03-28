// Type definitions for FlowMate

export interface User {
  id: string;
  email: string;
  flowAddress: string;
  autonomyMode: "manual" | "assist" | "autopilot";
  dailyLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vault {
  id: string;
  userId: string;
  type: "available" | "savings" | "emergency" | "staking";
  balance: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rule {
  id: string;
  userId: string;
  type: "save" | "send" | "receive" | "swap" | "stake" | "dca" | "bill";
  status: "active" | "paused" | "completed";
  config: Record<string, any>;
  nextExecution: Date | null;
  lastExecution: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  ruleId: string | null;
  txHash: string;
  type: "send" | "receive" | "transfer" | "swap" | "stake";
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: string;
  status: "pending" | "confirmed" | "failed";
  estimatedCost: number;
  actualCost: number | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "agent";
  content: string;
  parsedIntent: Record<string, any> | null;
  confidenceScore: number | null;
  createdAt: Date;
}

export interface ParsedIntent {
  action: string;
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
  requiresConfirmation: boolean;
}

export interface AIResponse {
  message: string;
  intent: ParsedIntent | null;
  actionRequired: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
