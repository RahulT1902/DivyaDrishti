/**
 * DivyaDrishti AI Provider
 *
 * Provider Resolution Order:
 *  1. DeepSeek (PRIMARY)  — uses DEEPSEEK_API_KEY + @ai-sdk/openai (OpenAI-compat)
 *  2. Groq     (FALLBACK) — uses GROQ_API_KEY     + @ai-sdk/openai (OpenAI-compat)
 *  3. Gemini   (RESERVE)  — uses GEMINI_API_KEY   + @ai-sdk/google
 *
 * Usage:
 *   import { callAI } from "@/lib/ai/provider";
 *   const { text, provider } = await callAI({ prompt: "...", temperature: 0.7 });
 */

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

type AIMessage = { role: "system" | "user" | "assistant"; content: string };

// ─── Provider Detection ────────────────────────────────────────────────────

const hasGemini =
  !!process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== "your-gemini-key-here";

const hasGroq =
  !!process.env.GROQ_API_KEY &&
  process.env.GROQ_API_KEY !== "gsk_...";

const hasDeepSeek =
  !!process.env.DEEPSEEK_API_KEY &&
  process.env.DEEPSEEK_API_KEY !== "sk-...";

export type AIProvider = "gemini" | "groq" | "deepseek" | "none";

export function getActiveProvider(): AIProvider {
  if (hasDeepSeek) return "deepseek";
  if (hasGroq)     return "groq";
  if (hasGemini)   return "gemini";
  return "none";
}

// ─── Model References ──────────────────────────────────────────────────────

export function getAIModel() {
  const provider = getActiveProvider();

  if (provider === "gemini") {
    const client = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    return { model: client("gemini-2.0-flash"), provider: "gemini" as const };
  }

  if (provider === "groq") {
    const client = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
    });
    return { model: client.chat("llama-3.3-70b-versatile"), provider: "groq" as const };
  }

  if (provider === "deepseek") {
    const client = createOpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
    return { model: client.chat("deepseek-chat"), provider: "deepseek" as const };
  }

  return { model: null, provider: "none" as const };
}

// ─── callAI: One-shot with Automatic Fallback ──────────────────────────────

interface CallAIOptions {
  prompt?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  messages?: AIMessage[];
}

interface CallAIResult {
  text: string;
  provider: AIProvider;
  usedFallback: boolean;
}

export async function callAI(options: CallAIOptions): Promise<CallAIResult> {
  const { prompt, system, temperature = 0.7, maxTokens, messages } = options;
  const errors: string[] = [];

  // Build the payload — SDK rejects requests that define both prompt and messages.
  // Prefer messages (multi-turn) when present; fall back to prompt (single-turn).
  const turnPayload = messages?.length
    ? { messages }
    : { prompt };

  // ── 1. DeepSeek (primary) ─────────────────────────────────────────────
  if (hasDeepSeek) {
    try {
      const client = createOpenAI({
        baseURL: "https://api.deepseek.com/v1",
        apiKey: process.env.DEEPSEEK_API_KEY,
      });
      const { text } = await generateText({
        model: client.chat("deepseek-chat"),
        system, ...turnPayload, temperature,
        ...(maxTokens ? { maxTokens } : {}),
      } as any);
      console.log("[AI] DeepSeek: OK");
      return { text, provider: "deepseek", usedFallback: false };
    } catch (e: any) {
      const msg = e?.message || "unknown";
      errors.push(`DeepSeek: ${msg}`);
      console.warn("[AI] DeepSeek failed:", msg);
    }
  }

  // ── 2. Groq (fallback) ────────────────────────────────────────────────
  if (hasGroq) {
    try {
      const client = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      });
      const { text } = await generateText({
        model: client.chat("llama-3.3-70b-versatile"),
        system, ...turnPayload, temperature,
        ...(maxTokens ? { maxTokens } : {}),
      } as any);
      console.log("[AI] Groq: OK");
      return { text, provider: "groq", usedFallback: true };
    } catch (e: any) {
      const msg = e?.message || "unknown";
      errors.push(`Groq: ${msg}`);
      console.warn("[AI] Groq failed:", msg);
    }
  }

  // ── 3. Gemini (reserve) ───────────────────────────────────────────────
  if (hasGemini) {
    try {
      const client = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
      const { text } = await generateText({
        model: client("gemini-2.0-flash"),
        system, ...turnPayload, temperature,
        ...(maxTokens ? { maxTokens } : {}),
      } as any);
      console.log("[AI] Gemini: OK");
      return { text, provider: "gemini", usedFallback: true };
    } catch (e: any) {
      const msg = e?.message || "unknown";
      errors.push(`Gemini: ${msg}`);
      console.error("[AI] Gemini failed:", msg);
      throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
    }
  }

  throw new Error(
    "No AI provider configured. Set GROQ_API_KEY (free), GEMINI_API_KEY, or DEEPSEEK_API_KEY in your .env file."
  );
}

export function hasAnyProvider(): boolean {
  return hasGemini || hasGroq || hasDeepSeek;
}
