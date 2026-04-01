import { Groq } from "groq-sdk";
import { env as config } from "../config/env.js";
import { ParsedIntent, AIResponse } from "../types/index.js";
import logger from "../config/logger.js";

/**
 * Single-call prompt: returns intent JSON + reply in one Groq request.
 * Supports conversation history for contextual, interactive responses.
 */
const COMBINED_PROMPT = `You are FlowMate, a friendly and intelligent autonomous financial AI agent on the Flow blockchain. You help users manage their FLOW tokens — sending, saving, staking, swapping, setting up recurring rules (DCA), and checking balances.

You are conversational, warm, and helpful. You remember context from the ENTIRE conversation. If the user tells you their name, remember and use it throughout. If they greet you, greet them back naturally.

Given a user message, their wallet context, and optionally a pending intent from the previous turn, return ONLY valid JSON in this exact shape:
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

MULTI-TURN INTENT ACCUMULATION (CRITICAL):
- Look at the ENTIRE conversation history and any "Pending intent" in the context.
- If the user previously said "send 34 FLOW to someone" and you asked for the address, and they now reply with just an address like "0xabc123...", COMBINE the previous amount (34) with the new address into a COMPLETE "send" action. Do NOT treat the address as an isolated message.
- If the user said "send FLOW" and you asked "how much and to whom?", and they reply "34" — that's the amount. Ask for the address next (action: "clarify").  
- If they then reply with "0xabc..." — NOW you have everything: action: "send", amount: 34, recipient: "0xabc...". Confirm and set requiresConfirmation: true.
- Same logic applies to save, stake, swap: accumulate parameters across turns until the action is complete.
- When a user says "yes", "confirm", "do it", "go ahead" after you've proposed an action — use the parameters from your last proposal.

BEHAVIORAL RULES:
- Be conversational and natural. Respond to greetings, small talk, and casual messages warmly.
- If the user says "hi", "hello", introduces themselves, or asks how you are — respond naturally. Use action "greeting".
- If a financial action is missing critical info, ASK for the specific missing piece. Use action "clarify".
- For "send X FLOW to my mum/friend" without an address, ask for the wallet address. NEVER use "0xunknown" or make up addresses.
- When you have ALL required info for a financial action, confirm the full details and set requiresConfirmation: true.
- For balance queries, use the actual vault numbers from context.
- Only use "off_topic" for truly unrelated requests — and be friendly about it.
- reply should be 1-4 sentences, conversational and specific (not generic).
- NEVER give a generic response like "What would you like to do?" if the user has provided specific context. Always respond specifically to what they said.
- Give brief financial tips and advice when asked — this is ON-topic for a financial agent.

Examples:
- "Hi, I'm Sarah" → action:"greeting", reply:"Hey Sarah! Welcome to FlowMate 🚀 I'm your personal financial agent on Flow. How can I help you today?"
- "send 50 FLOW to 0xabc" → action:"send", parameters:{recipient:"0xabc",amount:50}, reply:"Got it! I'll send 50 FLOW to 0xabc. Tap Execute Now to confirm."
- "send 20 FLOW to my sister" → action:"clarify", parameters:{amount:20}, reply:"I'd love to help! What's your sister's Flow wallet address (starts with 0x)?"
- [after above] "0xdef456..." → action:"send", parameters:{recipient:"0xdef456...",amount:20}, reply:"Perfect! Sending 20 FLOW to 0xdef456. Tap Execute Now to confirm."
- "save 100 to savings weekly" → action:"save", parameters:{amount:100,vault:"savings",frequency:"weekly"}, reply:"I'll set up a weekly auto-save of 100 FLOW. Sound good?"
- "what's my balance" → action:"query", reply:"Here's your vault summary: available: 248 FLOW, savings: 32 FLOW. Total: 280 FLOW."
- [after proposing action] "yes" → repeat the action with same parameters, reply:"Done! [action details]"`;

class GroqService {
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: config.groqApiKey });
  }

  async process(
    userMessage: string,
    context?: Record<string, any>,
    conversationHistory?: Array<{ role: string; content: string; parsedIntent?: any }>
  ): Promise<AIResponse> {
    const ctx = context || {};
    const vaultSummary = ctx.vaults
      ? Object.entries(ctx.vaults).map(([k, v]) => `${k}: ${v} FLOW`).join(", ")
      : "no vault data";

    // Find the last agent message with a parsed intent to carry forward
    let pendingIntentStr = "";
    if (conversationHistory && conversationHistory.length > 0) {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        if (msg.role === 'agent' && msg.parsedIntent) {
          const pi = typeof msg.parsedIntent === 'string' ? JSON.parse(msg.parsedIntent) : msg.parsedIntent;
          if (pi && pi.action && !['greeting', 'off_topic', 'unknown', 'query'].includes(pi.action)) {
            pendingIntentStr = `Pending intent from last turn: ${JSON.stringify(pi)}`;
            break;
          }
        }
      }
    }

    const userContent = [
      `User: "${userMessage}"`,
      `Vaults: ${vaultSummary}`,
      `Autonomy mode: ${ctx.autonomyMode || "manual"}`,
      ctx.flowAddress ? `User wallet: ${ctx.flowAddress}` : "",
      pendingIntentStr,
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
