/**
 * DivyaDrishti AI Provider
 *
 * Provider Resolution Order:
 *  1. Gemini (PRIMARY)  — uses GEMINI_API_KEY + @ai-sdk/google
 *  2. DeepSeek (FALLBACK) — uses DEEPSEEK_API_KEY + @ai-sdk/openai (OpenAI-compat endpoint)
 *
 * Usage:
 *   import { getAIModel, callAI } from "@/lib/ai/provider";
 *
 *   // Simple one-shot call with automatic fallback
 *   const text = await callAI({ prompt: "...", temperature: 0.7 });
 *
 *   // Or grab the model reference for use with generateText / streamText directly
 *   const { model, provider } = getAIModel();
 */

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// Minimal message type compatible with Vercel AI SDK's message format
type AIMessage = { role: "system" | "user" | "assistant"; content: string };

// ─── Provider Detection ────────────────────────────────────────────────────

const hasGemini =
  !!process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== "your-gemini-key-here";

const hasDeepSeek =
  !!process.env.DEEPSEEK_API_KEY &&
  process.env.DEEPSEEK_API_KEY !== "sk-...";

export type AIProvider = "gemini" | "deepseek" | "none";

/**
 * Returns which provider is currently active (in priority order).
 */
export function getActiveProvider(): AIProvider {
  if (hasGemini) return "gemini";
  if (hasDeepSeek) return "deepseek";
  return "none";
}

// ─── Model References ──────────────────────────────────────────────────────

/**
 * Returns the Vercel AI SDK LanguageModel for the active provider.
 * Gemini is tried first; DeepSeek is used as fallback.
 */
export function getAIModel() {
  const provider = getActiveProvider();

  if (provider === "gemini") {
    return {
      model: google("gemini-2.0-flash"),
      provider: "gemini" as const,
    };
  }

  if (provider === "deepseek") {
    const deepseekClient = createOpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
    return {
      model: deepseekClient.chat("deepseek-chat"),
      provider: "deepseek" as const,
    };
  }

  // No provider configured
  return { model: null, provider: "none" as const };
}

// ─── callAI: One-shot with Automatic Fallback ──────────────────────────────

interface CallAIOptions {
  prompt: string;
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

/**
 * Primary entry point for all LLM calls.
 *
 * - Tries Gemini first (if GEMINI_API_KEY is set).
 * - Falls back to DeepSeek if Gemini fails or is unavailable.
 * - Throws if no provider is configured.
 */
export async function callAI(options: CallAIOptions): Promise<CallAIResult> {
  const { prompt, system, temperature = 0.7, maxTokens, messages } = options;

  // ── Attempt primary (Gemini) ───────────────────────────────────────────
  if (hasGemini) {
    try {
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system,
        prompt,
        messages,
        temperature,
        ...(maxTokens ? { maxTokens } : {}),
      } as any);

      console.log("[AI Provider] Gemini: OK");
      return { text, provider: "gemini", usedFallback: false };
    } catch (geminiError: any) {
      console.warn(
        "[AI Provider] Gemini failed, falling back to DeepSeek:",
        geminiError?.message
      );
      // Fall through to DeepSeek fallback below
    }
  }

  // ── Attempt fallback (DeepSeek) ────────────────────────────────────────
  if (hasDeepSeek) {
    try {
      const deepseekClient = createOpenAI({
        baseURL: "https://api.deepseek.com/v1",
        apiKey: process.env.DEEPSEEK_API_KEY,
      });

      const { text } = await generateText({
        model: deepseekClient.chat("deepseek-chat"),
        system,
        prompt,
        messages,
        temperature,
        ...(maxTokens ? { maxTokens } : {}),
      } as any);

      console.log("[AI Provider] DeepSeek (fallback): OK");
      return { text, provider: "deepseek", usedFallback: true };
    } catch (deepseekError: any) {
      console.error("[AI Provider] DeepSeek fallback also failed:", deepseekError?.message);
      throw new Error(
        `All AI providers failed. Last error: ${deepseekError?.message}`
      );
    }
  }

  throw new Error(
    "No AI provider configured. Set GEMINI_API_KEY (primary) or DEEPSEEK_API_KEY (fallback) in your .env file."
  );
}

/**
 * Returns true if at least one AI provider is available.
 */
export function hasAnyProvider(): boolean {
  return hasGemini || hasDeepSeek;
}
