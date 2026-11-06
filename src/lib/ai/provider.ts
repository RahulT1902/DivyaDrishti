/**
 * DivyaDrishti AI Provider
 *
 * Provider Resolution Order:
 *  1. Gemini   (PRIMARY)  — uses GEMINI_API_KEY   + @ai-sdk/google
 *  2. Groq     (FALLBACK) — uses GROQ_API_KEY     + @ai-sdk/openai (OpenAI-compat)
 *  3. DeepSeek (RESERVE)  — uses DEEPSEEK_API_KEY + @ai-sdk/openai (OpenAI-compat)
 *
 * Gemini is primary because, on the Pundit prompt, it met the target length
 * and followed the narrator rules more closely than Groq's gpt-oss-20b; it is
 * slower (~11–14s vs ~3–4s), which is why Groq stays as the fast fallback.
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
  if (hasGemini)   return "gemini";
  if (hasGroq)     return "groq";
  if (hasDeepSeek) return "deepseek";
  return "none";
}

// ─── Model References ──────────────────────────────────────────────────────

export function getAIModel() {
  const provider = getActiveProvider();

  if (provider === "gemini") {
    const client = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    return { model: client("gemini-3.6-flash"), provider: "gemini" as const };
  }

  if (provider === "groq") {
    const client = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
    });
    return { model: client.chat("openai/gpt-oss-20b"), provider: "groq" as const };
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

// gpt-oss and Gemini Flash "think" before answering, and that thinking is
// counted against the output budget. Without headroom the budget can run out
// mid-thought and return empty text (finishReason "length").
const REASONING_HEADROOM = 2000;

/**
 * AI SDK v6 calls the option `maxOutputTokens`; the old `maxTokens` was being
 * silently ignored (hidden by an `as any`), so no length budget ever applied.
 */
const outputBudget = (maxTokens: number | undefined, headroom = 0) =>
  maxTokens ? { maxOutputTokens: maxTokens + headroom } : {};

/** An empty reply is a failure, so the next provider gets a chance. */
function requireText(provider: string, text: string, finishReason: string): string {
  if (!text.trim()) throw new Error(`${provider} returned empty text (finish: ${finishReason})`);
  return text;
}

export async function callAI(options: CallAIOptions): Promise<CallAIResult> {
  const { prompt, system, temperature = 0.7, maxTokens, messages } = options;
  const errors: string[] = [];

  // Build the payload — SDK rejects requests that define both prompt and messages.
  // Prefer messages (multi-turn) when present; fall back to prompt (single-turn).
  const turnPayload = messages?.length
    ? { messages }
    : { prompt };

  // Ordered Gemini → Groq → DeepSeek. Each provider that has a key is tried
  // until one returns non-empty text.
  // headroom: null sends no output cap at all. Groq's free tier counts the
  // reserved output against an 8,000 tokens-per-minute limit, and the Pundit
  // prompt alone is ~7,700 tokens, so any explicit cap (plus thinking headroom)
  // pushes the request over and it is rejected. Without a cap, Groq applies its
  // own default; an empty reply still falls through via requireText().
  const attempts: Array<{ provider: Exclude<AIProvider, "none">; label: string; enabled: boolean; model: () => any; headroom: number | null }> = [
    {
      provider: "gemini", label: "Gemini", enabled: hasGemini, headroom: REASONING_HEADROOM,
      model: () => createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })("gemini-3.6-flash"),
    },
    {
      provider: "groq", label: "Groq", enabled: hasGroq, headroom: null,
      model: () => createOpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY }).chat("openai/gpt-oss-20b"),
    },
    {
      provider: "deepseek", label: "DeepSeek", enabled: hasDeepSeek, headroom: 0,
      model: () => createOpenAI({ baseURL: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY }).chat("deepseek-chat"),
    },
  ];

  const enabled = attempts.filter(a => a.enabled);
  if (enabled.length === 0) {
    throw new Error(
      "No AI provider configured. Set GEMINI_API_KEY, GROQ_API_KEY (free), or DEEPSEEK_API_KEY in your .env file."
    );
  }

  for (const [i, a] of enabled.entries()) {
    try {
      const { text, finishReason } = await generateText({
        model: a.model(),
        system, ...turnPayload, temperature,
        ...(a.headroom === null ? {} : outputBudget(maxTokens, a.headroom)),
      } as any);
      const checked = requireText(a.label, text, finishReason);
      console.log(`[AI] ${a.label}: OK`);
      return { text: checked, provider: a.provider, usedFallback: i > 0 };
    } catch (e: any) {
      const msg = e?.message || "unknown";
      errors.push(`${a.label}: ${msg}`);
      console.warn(`[AI] ${a.label} failed:`, msg);
    }
  }

  throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
}

export function hasAnyProvider(): boolean {
  return hasGemini || hasGroq || hasDeepSeek;
}
