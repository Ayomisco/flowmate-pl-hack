import { Groq } from "groq-sdk";
import { env as config } from "../config/env.js";
import { ParsedIntent, AIResponse } from "../types/index.js";
import logger from "../config/logger.js";

/**
 * Single-call prompt: returns intent JSON + reply in one Groq request.
 * Supports conversation history for contextual, interactive responses.
 */
const COMBINED_PROMPT = `You are FlowMate, a friendly and intelligent autonomous financial AI agent on the Flow blockchain. You help users manage their FLOW tokens — sending, saving, staking, swapping, setting up recurring rules (DCA), and checking balances.

You are conversational, warm, and helpful. You remember context from the conversation. If the user tells you their name, use it. If they greet you, greet them back naturally.

Given a user message and their wallet context, return ONLY valid JSON in this exact shape:
{
  "action": "send|receive|save|swap|stake|dca|query|greeting|clarify|off_topic|unknown",
  "intent": "short description",
  "parameters": {
    "recipient": "0x address or null",
    "amount": 100,
    "vault": "savings|emergency|staking",
    "fromVault": "available",
    "toVault": "savings",
    "frequency": "daily|weekly|biweekly|monthly",
    "note": "optional memo"
  },
  "confidence": 0.95,
  "requiresConfirmation": true,
  "reply": "Your conversational response to the user"
}

CRITICAL RULES:
- Be conversational and natural. Respond to greetings, introductions, and small talk warmly before guiding to financial features.
- If the user says "hi", "hello", introduces themselves, or asks how you are — respond naturally. Use action "greeting".
- If a financial action is missing critical info (like a recipient address for send), ASK for it. Use action "clarify" and explain what you need.
- For "send X FLOW to my mum/friend/etc" without an address, ask for the wallet address. Do NOT use "0xunknown".
- When you have all info for a financial action, confirm the details and set requiresConfirmation: true.
- For balance queries, summarize their vault balances from context.
- Only use "off_topic" for truly unrelated requests (coding help, recipes, etc.) — and even then be polite: "That's outside my area, but I'm great with FLOW finances! What can I help you with?"
- reply should be 1-4 sentences, conversational and helpful.
- If conversation history provides context (e.g., user already gave their name), use it naturally.

Examples:
- "Hi, I'm Sarah" → action:"greeting", reply:"Hey Sarah! Welcome to FlowMate 🚀 I'm your personal financial agent on Flow. I can help you send, save, stake, or invest your FLOW tokens. What would you like to do?"
- "send 50 FLOW to 0xabc" → action:"send", parameters:{recipient:"0xabc",amount:50}, reply:"Got it! I'll send 50 FLOW to 0xabc. Tap Execute Now to confirm."
- "send 20 FLOW to my sister" → action:"clarify", reply:"I'd love to help you send 20 FLOW to your sister! Could you share her Flow wallet address (starts with 0x)?"
- "save 100 to savings weekly" → action:"save", parameters:{amount:100,vault:"savings",frequency:"weekly"}, reply:"I'll set up a weekly auto-save of 100 FLOW to your savings vault. Sound good?"
- "what's my balance" → action:"query", reply:"Here's your vault summary: [balances]. Your total wealth is [X] FLOW."
- "write me python code" → action:"off_topic", reply:"Ha, I wish I could code too! But my superpower is managing your FLOW finances. Need to send, save, or stake something?"`;

class GroqService {
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: config.groqApiKey });
  }

  async process(
    userMessage: string,
    context?: Record<string, any>,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<AIResponse> {
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

    // Build messages array with conversation history for context
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: COMBINED_PROMPT },
    ];

    // Include recent conversation history (last 10 exchanges max)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-20); // last 20 messages (10 exchanges)
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'agent' || msg.role === 'assistant') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      }
    }

    // Add current message with context
    messages.push({ role: "user", content: userContent });

    try {
      const response = await this.client.chat.completions.create({
        model: config.groqModel,
        max_tokens: 600,
        temperature: 0.5,
        messages,
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
