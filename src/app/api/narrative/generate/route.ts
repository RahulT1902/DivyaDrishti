import { NextRequest, NextResponse } from "next/server";
import { callAI, hasAnyProvider } from "@/lib/ai/provider";

/**
 * POST /api/narrative/generate
 * 
 * Accepts a pre-assembled prompt from the NarrativePromptAssembler.
 * Executes the LLM call server-side to keep API keys secure.
 * Returns the raw narrative string for the NarrativeRenderer to validate.
 * 
 * IMPORTANT: This route does NOT accept raw astrological data.
 * Only structured, pre-sanitized prompt payloads are accepted.
 */
export async function POST(req: NextRequest) {
  try {
    const { system, user, maxTokens, temperature } = await req.json();

    if (!system || !user) {
      return NextResponse.json(
        { success: false, error: "Missing system or user prompt." },
        { status: 400 }
      );
    }

    // Guard: Max token limit to prevent expensive runaway calls
    const safeMaxTokens = Math.min(maxTokens || 200, 400);

    if (!hasAnyProvider()) {
      return NextResponse.json(
        { success: false, narrative: null, error: "No LLM provider configured." },
        { status: 503 }
      );
    }

    const { text } = await callAI({
      system,
      prompt: user,
      maxTokens: safeMaxTokens,
      temperature: temperature ?? 0.4,
    });

    return NextResponse.json({ success: true, narrative: text });
  } catch (error: any) {
    console.error("[Narrative API] LLM call failed:", error?.message);
    // Return null so the NarrativeRenderer falls back to template
    return NextResponse.json(
      { success: false, narrative: null, error: "LLM generation failed." },
      { status: 500 }
    );
  }
}
