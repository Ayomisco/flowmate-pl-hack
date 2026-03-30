import { Groq } from "groq-sdk";
import { env as config } from "../config/env.js";
import { ParsedIntent, AIResponse } from "../types/index.js";
import logger from "../config/logger.js";

/**
 * Single-call prompt: returns intent JSON + reply in one Groq request.
 * Halves latency vs the old two-call approach (important for Vercel 10s timeout).
 */
const COMBINED_PROMPT = `You are FlowMate, an autonomous financial AI agent on Flow blockchain.

Given a user message and their wallet context, return ONLY valid JSON in this exact shape:
{
  "action": "send|receive|save|swap|stake|dca|query|off_topic|unknown",
  "intent": "short description",
  "parameters": {
    "recipient": "0x address",
    "amount": 100,
    "vault": "savings|emergency|staking",
    "fromVault": "available",
    "toVault": "savings",
    "frequency": "daily|weekly|biweekly|monthly",
    "note": "optional memo"
  },
  "confidence": 0.95,
  "requiresConfirmation": true,
  "reply": "Your conversational response to the user (2-3 sentences max)"
}

Rules:
- Only handle: send, save, stake, swap, DCA, balance queries, FlowMate features
- Off-topic (jokes, coding, recipes etc): set action "off_topic", reply "I'm FlowMate, your financial agent. I can help you send, save, stake or invest FLOW. What would you like to do?"
- reply must confirm the action details when a financial action is detected
- reply must mention vault balances when relevant
- reply is 2-3 sentences max, conversational tone

Examples:
- "send 50 FLOW to 0xabc" → action:"send", parameters:{recipient:"0xabc",amount:50}, reply:"Got it! I'll send 50 FLOW to 0xabc. Tap Execute Now to confirm."
- "save 100 to savings weekly" → action:"save", parameters:{amount:100,vault:"savings",frequency:"weekly"}, reply:"I'll set up a weekly auto-save of 100 FLOW to your savings vault."
- "what's my balance" → action:"query", reply:"Here's your current vault summary: [balances]. Your total wealth is [X] FLOW."
- "tell me a joke" → action:"off_topic", reply:"I'm FlowMate, your financial agent. I can help you send, save, stake or invest FLOW. What would you like to do?"`;

class GroqService {
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: config.groqApiKey });
  }

  async process(userMessage: string, context?: Record<string, any>): Promise<AIResponse> {
    const ctx = context || {};
    const vaultSummary = ctx.vaults
      ? Object.entries(ctx.vaults).map(([k, v]) => `${k}: ${v} FLOW`).join(", ")
      : "no vault data";

    const userContent = [
      `User: "${userMessage}"`,
      `Vaults: ${vaultSummary}`,
      `Autonomy mode: ${ctx.autonomyMode || "manual"}`,
      ctx.flowAddress ? `User wallet: ${ctx.flowAddress}` : "",
    ].filter(Boolean).join("\n");

    try {
      const response = await this.client.chat.completions.create({
        model: config.groqModel,
        max_tokens: 600,
        temperature: 0.3,
        messages: [
          { role: "system", content: COMBINED_PROMPT },
          { role: "user", content: userContent },
        ],
      });

      const text = response.choices[0].message.content || "";
      const match = text.match(/\{[\s\S]*\}/);

      let parsed: any;
      try {
        parsed = JSON.parse(match ? match[0] : text);
      } catch {
        // Model returned non-JSON — treat as a plain reply
        return {
          message: text.trim() || "I'm on it! Let me process that for you.",
          intent: { action: "unknown", intent: userMessage, parameters: {}, confidence: 0.5, requiresConfirmation: false },
          actionRequired: false,
        };
      }

      const intent: ParsedIntent = {
        action: parsed.action || "unknown",
        intent: parsed.intent || userMessage,
        parameters: parsed.parameters || {},
        confidence: parsed.confidence ?? 0.8,
        requiresConfirmation: parsed.requiresConfirmation ?? true,
      };

      const message = parsed.reply || "Got it! How else can I help you?";

      return { message, intent, actionRequired: intent.requiresConfirmation };
    } catch (error) {
      logger.error("Groq API error", { error: (error as Error).message, model: config.groqModel });
      throw error;
    }
  }

  async parseIntent(userMessage: string): Promise<ParsedIntent | null> {
    const result = await this.process(userMessage);
    return result.intent;
  }
}

export const getAIService = (): GroqService => new GroqService();
export { GroqService };
