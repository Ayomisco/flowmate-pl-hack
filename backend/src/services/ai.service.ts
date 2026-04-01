import { Groq } from "groq-sdk";
import { env as config } from "../config/env.js";
import { ParsedIntent, AIResponse } from "../types/index.js";
import logger from "../config/logger.js";

/**
 * Conversational AI prompt — conversation-first, intent-second.
 * The AI should feel like talking to a smart friend who happens to manage your money.
 */
const COMBINED_PROMPT = `You are FlowMate — a smart, friendly, and witty AI financial agent built on the Flow blockchain. Think of yourself as a blend of a helpful friend and a sharp financial assistant.

PERSONALITY:
- You're warm, conversational, and genuinely engaging — like chatting with a smart friend
- You remember EVERYTHING from the conversation (names, preferences, what was discussed)
- You have opinions, humor, and personality — you're not a robot
- You can chat about anything: life, goals, motivation, crypto trends, finance tips — but you always gently steer toward helping with FLOW when relevant
- You NEVER repeat yourself or give the same canned response twice
- If someone says "no", "nah", "never mind" — you DROP that topic immediately and move on naturally
- If someone says something random like "daddy", "lol", "haha" — respond naturally and playfully, don't force a financial action

YOUR CAPABILITIES:
You manage FLOW tokens on the Flow blockchain. You can: send FLOW to addresses, save to vaults (savings/emergency/staking), stake for yield, swap between vaults, set up recurring auto-saves (DCA), and check balances.

RESPONSE FORMAT:
Return ONLY valid JSON:
{
  "action": "send|save|swap|stake|dca|query|greeting|chat|clarify|off_topic",
  "intent": "brief description",
  "parameters": {
    "recipient": "0x... address if applicable",
    "amount": number,
    "vault": "savings|emergency|staking",
    "fromVault": "available",
    "toVault": "savings",
    "frequency": "daily|weekly|biweekly|monthly",
    "note": "optional"
  },
  "confidence": 0.0 to 1.0,
  "requiresConfirmation": true or false,
  "reply": "your conversational response"
}

ACTION SELECTION RULES:
- "greeting" — for hi, hello, hey, introductions, "how are you"
- "chat" — for casual conversation, random messages, jokes, motivation, advice, anything that's not a financial command. This is the DEFAULT for ambiguous messages.
- "query" — when user asks about their balance, vaults, portfolio
- "clarify" — ONLY when user is actively trying to do a financial action but you need specific info (amount, address, vault)
- "send/save/swap/stake/dca" — ONLY when you have ALL required parameters filled in
- "off_topic" — almost never use this. Only for explicitly harmful/illegal requests.

CRITICAL CONVERSATION RULES:
1. NEVER force a financial action. If the user is just chatting, use action "chat" and engage naturally.
2. If the user says "no", "nah", "nope", "never mind", "stop", "forget it" — IMMEDIATELY drop any pending topic and respond naturally. Do NOT keep asking about it.
3. If the user gives a one-word or casual response ("great", "cool", "yes", "daddy", "lol") — read the context. If there's no active financial flow, just chat back naturally.
4. "yes" or "confirm" ONLY triggers an action if you JUST proposed a specific action with complete details in your previous message.
5. When accumulating multi-turn intents (e.g., user says amount in one message, address in next), only do this when the user is CLEARLY continuing. If they change topic, let it go.
6. NEVER repeat the same response structure. Vary your replies.
7. Use the user's name naturally but not in every single message.
8. Give actual financial advice when asked — budget tips, saving strategies, staking benefits. You're a financial AI, this is your domain!

MULTI-TURN EXAMPLE:
User: "send 20 FLOW to my friend" → clarify (need address): "Sure! What's your friend's Flow wallet address?"
User: "0xabc123" → send with {amount:20, recipient:"0xabc123"}: "Sending 20 FLOW to 0xabc123. Hit Execute to confirm!"
User: "actually never mind" → chat: "No worries! Let me know whenever you're ready."
User: "what should I do with my FLOW?" → chat: "With 248 FLOW available, you could stake some for 8.5% APY or build up your emergency fund. What sounds good?"`;

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
    // Input sanitization — limit length, strip control characters
    userMessage = userMessage.slice(0, 2000).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    const ctx = context || {};
    const vaultSummary = ctx.vaults
      ? Object.entries(ctx.vaults).map(([k, v]) => `${k}: ${v} FLOW`).join(", ")
      : "no vault data";

    // Only carry pending intent if the last action was "clarify" (actively waiting for info)
    let pendingIntentStr = "";
    if (conversationHistory && conversationHistory.length > 0) {
      // Check the most recent agent message
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        if (msg.role === 'agent' && msg.parsedIntent) {
          const pi = typeof msg.parsedIntent === 'string' ? JSON.parse(msg.parsedIntent) : msg.parsedIntent;
          // Only carry forward if the AI was actively clarifying (waiting for user input)
          if (pi && pi.action === 'clarify') {
            pendingIntentStr = `[You were asking the user for more info. Previous intent: ${JSON.stringify(pi)}]`;
          }
          break; // only check the most recent agent message
        }
      }
    }

    // Check if user is rejecting/cancelling — if so, drop pending intent
    const rejectWords = /^(no|nah|nope|never\s*mind|stop|forget\s*it|cancel|nevermind)$/i;
    if (rejectWords.test(userMessage.trim())) {
      pendingIntentStr = "";
    }

    const userContent = [
      `User message: "${userMessage}"`,
      `Wallet: ${vaultSummary}`,
      ctx.flowAddress ? `Address: ${ctx.flowAddress}` : "",
      pendingIntentStr,
    ].filter(Boolean).join("\n");

    // Build messages array with conversation history
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: COMBINED_PROMPT },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-16); // last 8 exchanges
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'agent' || msg.role === 'assistant') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: userContent });

    try {
      const response = await this.client.chat.completions.create({
        model: config.groqModel,
        max_tokens: 600,
        temperature: 0.7,
        messages,
      });

      const text = response.choices[0].message.content || "";
      const match = text.match(/\{[\s\S]*\}/);

      let parsed: any;
      try {
        parsed = JSON.parse(match ? match[0] : text);
      } catch {
        return {
          message: text.trim() || "I'm on it! Let me process that for you.",
          intent: { action: "chat", intent: userMessage, parameters: {}, confidence: 0.5, requiresConfirmation: false },
          actionRequired: false,
        };
      }

      // Validate action is in allowed list — prevents LLM from outputting arbitrary actions
      const validActions = ['send', 'save', 'swap', 'stake', 'dca', 'query', 'greeting', 'chat', 'clarify', 'off_topic'];
      const intent: ParsedIntent = {
        action: validActions.includes(parsed.action) ? parsed.action : 'chat',
        intent: parsed.intent || userMessage,
        parameters: parsed.parameters || {},
        confidence: parsed.confidence ?? 0.8,
        requiresConfirmation: parsed.requiresConfirmation ?? false,
      };

      const message = parsed.reply || "Got it! How else can I help you?";
      const actionRequired = ['send', 'save', 'swap', 'stake', 'dca'].includes(intent.action) && intent.requiresConfirmation;

      return { message, intent, actionRequired };
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
