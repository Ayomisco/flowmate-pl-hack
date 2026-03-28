import { HfInference } from "@huggingface/inference";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "google-generative-ai";
import { Groq } from "groq-sdk";
import OpenAI from "openai";
import axios from "axios";
import config from "../config/env";
import { ParsedIntent, AIResponse } from "../types";
import logger from "../config/logger";

/**
 * Abstract AI Service for provider-agnostic integration
 */
abstract class AIService {
  abstract parseIntent(userMessage: string): Promise<ParsedIntent>;
  abstract generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string>;

  async process(userMessage: string, context?: Record<string, any>): Promise<AIResponse> {
    try {
      const intent = await this.parseIntent(userMessage);
      const message = await this.generateResponse(intent, context || {});

      return {
        message,
        intent,
        actionRequired: intent.requiresConfirmation,
      };
    } catch (error) {
      logger.error("AI processing error", { error: (error as Error).message });
      throw error;
    }
  }
}

/**
 * Claude AI Service
 */
class ClaudeAIService extends AIService {
  private client: Anthropic;

  constructor() {
    super();
    this.client = new Anthropic({ apiKey: config.claudeApiKey });
  }

  async parseIntent(userMessage: string): Promise<ParsedIntent> {
    const systemPrompt = `You are FlowMate's AI financial agent. Parse user messages into structured intents.

Return only valid JSON with this structure:
{
  "action": "send|receive|save|swap|stake|dca|bill",
  "intent": "description of what user wants",
  "parameters": { "recipient": "address", "amount": 100, ... },
  "confidence": 0.95,
  "requiresConfirmation": true
}`;

    const response = await this.client.messages.create({
      model: config.claudeModel,
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Invalid response type");

    try {
      return JSON.parse(content.text);
    } catch {
      return {
        action: "unknown",
        intent: userMessage,
        parameters: {},
        confidence: 0.5,
        requiresConfirmation: true,
      };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const response = await this.client.messages.create({
      model: config.claudeModel,
      max_tokens: 300,
      system: "You are a helpful financial AI assistant. Respond naturally and concisely.",
      messages: [
        {
          role: "user",
          content: `Intent: ${intent.action}\nContext: ${JSON.stringify(context)}\n\nRespond naturally about this financial action.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Invalid response type");
    return content.text;
  }
}

/**
 * Gemini AI Service
 */
class GeminiAIService extends AIService {
  private client: GoogleGenerativeAI;

  constructor() {
    super();
    this.client = new GoogleGenerativeAI(config.geminiApiKey);
  }

  async parseIntent(userMessage: string): Promise<ParsedIntent> {
    const model = this.client.getGenerativeModel({ model: config.geminiModel });

    const systemPrompt = `Parse user messages into financial intents. Return only JSON: {"action":"send|receive|save|swap|stake|dca|bill", "intent":"...", "parameters":{...}, "confidence":0.9, "requiresConfirmation":true}`;

    const result = await model.generateContent(`${systemPrompt}\n\nMessage: ${userMessage}`);
    const text = result.response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        action: "unknown",
        intent: userMessage,
        parameters: {},
        confidence: 0.5,
        requiresConfirmation: true,
      };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const model = this.client.getGenerativeModel({ model: config.geminiModel });

    const result = await model.generateContent(
      `Intent: ${intent.action}\nContext: ${JSON.stringify(context)}\n\nRespond naturally about this financial action.`
    );

    return result.response.text();
  }
}

/**
 * OpenAI Service
 */
class OpenAIService extends AIService {
  private client: OpenAI;

  constructor() {
    super();
    this.client = new OpenAI({ apiKey: config.openaiApiKey });
  }

  async parseIntent(userMessage: string): Promise<ParsedIntent> {
    const response = await this.client.chat.completions.create({
      model: config.openaiModel,
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `Parse user messages into financial intents. Return only JSON: {"action":"send|receive|save|swap|stake|dca|bill", "intent":"...", "parameters":{...}, "confidence":0.9, "requiresConfirmation":true}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const text = response.choices[0].message.content || "";

    try {
      return JSON.parse(text);
    } catch {
      return {
        action: "unknown",
        intent: userMessage,
        parameters: {},
        confidence: 0.5,
        requiresConfirmation: true,
      };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: config.openaiModel,
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a helpful financial AI assistant. Respond naturally and concisely.",
        },
        {
          role: "user",
          content: `Intent: ${intent.action}\nContext: ${JSON.stringify(context)}\n\nRespond naturally about this financial action.`,
        },
      ],
    });

    return response.choices[0].message.content || "";
  }
}

/**
 * Groq Service
 */
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
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `Parse user messages into financial intents. Return only JSON: {"action":"send|receive|save|swap|stake|dca|bill", "intent":"...", "parameters":{...}, "confidence":0.9, "requiresConfirmation":true}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const text = response.choices[0].message.content || "";

    try {
      return JSON.parse(text);
    } catch {
      return {
        action: "unknown",
        intent: userMessage,
        parameters: {},
        confidence: 0.5,
        requiresConfirmation: true,
      };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: config.groqModel,
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a helpful financial AI assistant. Respond naturally and concisely.",
        },
        {
          role: "user",
          content: `Intent: ${intent.action}\nContext: ${JSON.stringify(context)}\n\nRespond naturally about this financial action.`,
        },
      ],
    });

    return response.choices[0].message.content || "";
  }
}

/**
 * Ollama Service (Local)
 */
class OllamaService extends AIService {
  async parseIntent(userMessage: string): Promise<ParsedIntent> {
    const systemPrompt = `Parse user messages into financial intents. Return only JSON: {"action":"send|receive|save|swap|stake|dca|bill", "intent":"...", "parameters":{...}, "confidence":0.9, "requiresConfirmation":true}`;

    const response = await axios.post(`${config.ollamaUrl}/api/generate`, {
      model: config.ollamaModel,
      prompt: `${systemPrompt}\n\nMessage: ${userMessage}`,
      stream: false,
    });

    const text = response.data.response || "";

    try {
      return JSON.parse(text);
    } catch {
      return {
        action: "unknown",
        intent: userMessage,
        parameters: {},
        confidence: 0.5,
        requiresConfirmation: true,
      };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const response = await axios.post(`${config.ollamaUrl}/api/generate`, {
      model: config.ollamaModel,
      prompt: `Intent: ${intent.action}\nContext: ${JSON.stringify(context)}\n\nRespond naturally about this financial action.`,
      stream: false,
    });

    return response.data.response || "Unable to generate response";
  }
}

/**
 * Llama Service (Alternative local)
 */
class LlamaService extends AIService {
  async parseIntent(userMessage: string): Promise<ParsedIntent> {
    const systemPrompt = `Parse user messages into financial intents. Return only JSON: {"action":"send|receive|save|swap|stake|dca|bill", "intent":"...", "parameters":{...}, "confidence":0.9, "requiresConfirmation":true}`;

    const response = await axios.post(`${config.llamaUrl}/completion`, {
      prompt: `${systemPrompt}\n\nMessage: ${userMessage}`,
      temperature: 0.7,
      max_tokens: 500,
    });

    const text = response.data.content || "";

    try {
      return JSON.parse(text);
    } catch {
      return {
        action: "unknown",
        intent: userMessage,
        parameters: {},
        confidence: 0.5,
        requiresConfirmation: true,
      };
    }
  }

  async generateResponse(intent: ParsedIntent, context: Record<string, any>): Promise<string> {
    const response = await axios.post(`${config.llamaUrl}/completion`, {
      prompt: `Intent: ${intent.action}\nContext: ${JSON.stringify(context)}\n\nRespond naturally about this financial action.`,
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.data.content || "Unable to generate response";
  }
}

/**
 * Factory function to get appropriate AI service
 */
export const getAIService = (): AIService => {
  switch (config.aiProvider) {
    case "claude":
      return new ClaudeAIService();
    case "gemini":
      return new GeminiAIService();
    case "openai":
      return new OpenAIService();
    case "groq":
      return new GroqService();
    case "ollama":
      return new OllamaService();
    case "llama":
      return new LlamaService();
    default:
      throw new Error(`Unknown AI provider: ${config.aiProvider}`);
  }
};

export { AIService, ClaudeAIService, GeminiAIService, OpenAIService, GroqService, OllamaService, LlamaService };
