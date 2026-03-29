import Anthropic from "@anthropic-ai/sdk";
import { Groq } from "groq-sdk";
import axios from "axios";
import { env as config } from "../config/env.js";
import { ParsedIntent, AIResponse } from "../types/index.js";
import logger from "../config/logger.js";

const INTENT_PROMPT = `You are FlowMate's AI financial agent running on Flow blockchain. Parse user messages into structured financial intents.

IMPORTANT: You ONLY handle financial topics. If the user asks about anything unrelated to personal finance, payments, savings, investments, blockchain, or FlowMate features, set action to "off_topic".

Return ONLY valid JSON with this exact structure:
{
  "action": "send|receive|save|swap|stake|dca|bill|query|off_topic|unknown",
  "intent": "short description of what the user wants",
  "parameters": {
    "recipient": "0x address or name",
    "amount": 100,
    "vault": "savings|emergency|staking",
    "fromVault": "available",
    "toVault": "savings",
    "frequency": "weekly|daily|monthly",
    "note": "optional memo"
  },
  "confidence": 0.95,
  "requiresConfirmation": true
}

Examples:
- "send 50 FLOW to 0xabc123" → action: "send", parameters: { recipient: "0xabc123", amount: 50 }
- "save $100 to my savings" → action: "save", parameters: { amount: 100, vault: "savings" }
- "stake 200 FLOW" → action: "stake", parameters: { amount: 200 }
- "move 500 from available to emergency fund" → action: "swap", parameters: { fromVault: "available", toVault: "emergency", amount: 500 }
- "tell me a joke" → action: "off_topic"`;

const RESPONSE_PROMPT = `You are FlowMate, an autonomous financial AI agent on Flow blockchain. You help users manage their money intelligently.

Your capabilities:
- Send FLOW tokens to any address
- Save funds into vaults: savings, emergency, staking
- Swap between vaults (available, savings, emergency, staking)
- Stake FLOW for ~8.5% APY in the staking vault
- Set up recurring DCA (dollar-cost averaging) schedules
- Answer questions about the user's balances and transactions

IMPORTANT RULES:
1. ONLY respond to financial topics. If asked about anything else (coding, recipes, general knowledge, etc.), politely say: "I'm FlowMate, your financial agent. I can help you send money, save, stake, or manage your FLOW assets. What would you like to do with your finances today?"
2. Be concise — 2-3 sentences max.
3. When you recognize an action (send/save/stake/swap), confirm the details clearly.
4. Always mention current vault balances when relevant.`;

abstract class AIService {
  abstract parseIntent(userMessage: string): Promise<ParsedIntent>;
  abstract generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string>;

  async process(userMessage: string, context?: Record<string, any>): Promise<AIResponse> {
    try {
      const intent = await this.parseIntent(userMessage);
      const message = await this.generateResponse(intent, context || {});
      return { message, intent, actionRequired: intent.requiresConfirmation };
    } catch (error) {
      logger.error("AI processing error", { error: (error as Error).message });
      throw error;
    }
  }
}

// ── Claude ───────────────────────────────────────────────────────────────────

class ClaudeAIService extends AIService {
  private client: Anthropic;

  constructor() {
    super();
    this.client = new Anthropic({ apiKey: config.claudeApiKey });
  }

  async parseIntent(userMessage: string): Promise<ParsedIntent> {
    const response = await this.client.messages.create({
      model: config.claudeModel,
      max_tokens: 500,
      system: INTENT_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const content = response.content[0];
    if (content.type !== "text") throw new Error("Invalid response type");
    try {
      return JSON.parse(content.text);
    } catch {
      return { action: "unknown", intent: userMessage, parameters: {}, confidence: 0.5, requiresConfirmation: true };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const response = await this.client.messages.create({
      model: config.claudeModel,
      max_tokens: 300,
      system: RESPONSE_PROMPT,
      messages: [{ role: "user", content: `User intent: ${intent.action} — ${intent.intent}\nContext: ${JSON.stringify(context)}` }],
    });
    const content = response.content[0];
    if (content.type !== "text") throw new Error("Invalid response type");
    return content.text;
  }
}

// ── Groq ─────────────────────────────────────────────────────────────────────

class GroqService extends AIService {
  private client: Groq;

  constructor() {
    super();
    this.client = new Groq({ apiKey: config.groqApiKey });
  }

  async parseIntent(userMessage: string): Promise<ParsedIntent> {
    const response = await this.client.chat.completions.create({
      model: config.groqModel,
      max_tokens: 500,
      temperature: 0.2,
      messages: [
        { role: "system", content: INTENT_PROMPT },
        { role: "user", content: userMessage },
      ],
    });
    const text = response.choices[0].message.content || "";
    // Extract JSON even if model adds surrounding text
    const match = text.match(/\{[\s\S]*\}/);
    try {
      return JSON.parse(match ? match[0] : text);
    } catch {
      return { action: "unknown", intent: userMessage, parameters: {}, confidence: 0.5, requiresConfirmation: true };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const vaultSummary = context.vaults
      ? Object.entries(context.vaults).map(([k, v]) => `${k}: ${v} FLOW`).join(", ")
      : "no vault data";
    const response = await this.client.chat.completions.create({
      model: config.groqModel,
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        { role: "system", content: RESPONSE_PROMPT },
        {
          role: "user",
          content: `User said: "${intent.intent}"\nAction: ${intent.action}\nVaults: ${vaultSummary}\nAutonomy: ${context.autonomyMode || "manual"}`,
        },
      ],
    });
    return response.choices[0].message.content || "I'm on it. Let me process that for you.";
  }
}

// ── Ollama (local) ────────────────────────────────────────────────────────────

class OllamaService extends AIService {
  async parseIntent(userMessage: string): Promise<ParsedIntent> {
    const response = await axios.post(`${config.ollamaUrl}/api/generate`, {
      model: config.ollamaModel,
      prompt: `${INTENT_PROMPT}\n\nMessage: ${userMessage}`,
      stream: false,
    });
    try {
      return JSON.parse(response.data.response || "{}");
    } catch {
      return { action: "unknown", intent: userMessage, parameters: {}, confidence: 0.5, requiresConfirmation: true };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const response = await axios.post(`${config.ollamaUrl}/api/generate`, {
      model: config.ollamaModel,
      prompt: `${RESPONSE_PROMPT}\n\nIntent: ${intent.action}\nContext: ${JSON.stringify(context)}`,
      stream: false,
    });
    return response.data.response || "Unable to generate response";
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export const getAIService = (): AIService => {
  switch (config.aiProvider) {
    case "claude":
      return new ClaudeAIService();
    case "groq":
      return new GroqService();
    case "ollama":
    case "llama":
      return new OllamaService();
    default:
      // Default to Groq since it's configured
      return new GroqService();
  }
};

export { AIService, ClaudeAIService, GroqService, OllamaService };
