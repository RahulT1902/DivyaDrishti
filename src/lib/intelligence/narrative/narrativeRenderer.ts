import { NarrativePrompt } from "./narrativePromptAssembler";
import { validateNarrative, GuardrailValidation } from "./narrativeGuardrails";
import { EXECUTION_MODE_NARRATIVE } from "./narrativeStyleGuide";

export interface NarrativeResult {
  text: string;
  type: string;
  validated: boolean;
  violations: string[];
  source: "llm" | "template_fallback";
}

/**
 * NarrativeRenderer: The Final Communication Layer.
 * 
 * Responsibility:
 * 1. Execute the LLM call via Vercel AI SDK
 * 2. Run guardrail validation on LLM output
 * 3. If validation fails, fall back to deterministic template
 * 
 * The system NEVER allows unvalidated output to reach the user.
 */
export class NarrativeRenderer {
  private maxRetries = 1; // One retry before fallback

  async render(
    prompt: NarrativePrompt,
    narrativeType: string,
    fallbackContext?: { executionMode?: string }
  ): Promise<NarrativeResult> {
    let attempts = 0;

    while (attempts <= this.maxRetries) {
      try {
        const rawOutput = await this.callLLM(prompt);
        const validation = validateNarrative(rawOutput);

        if (validation.passed) {
          return {
            text: rawOutput.trim(),
            type: narrativeType,
            validated: true,
            violations: [],
            source: "llm",
          };
        }

        // If validation fails on retry, fall through to template
        if (attempts === this.maxRetries) {
          console.warn(`[NarrativeRenderer] Guardrail violations after retry: ${validation.violations.join(", ")}`);
          break;
        }
      } catch (error) {
        console.error("[NarrativeRenderer] LLM call failed:", error);
        break;
      }

      attempts++;
    }

    // ── DETERMINISTIC FALLBACK ─────────────────────────────────────────────────
    // When LLM fails or violates guardrails, we ALWAYS have a trusted output.
    return this.buildTemplateFallback(narrativeType, fallbackContext);
  }

  private async callLLM(prompt: NarrativePrompt): Promise<string> {
    // Calls the internal API route to keep API keys server-side
    const res = await fetch("/api/narrative/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: prompt.systemPrompt,
        user: prompt.userPayload,
        maxTokens: prompt.maxTokens,
        temperature: prompt.temperature,
      }),
    });

    if (!res.ok) throw new Error(`LLM API call failed: ${res.statusText}`);
    const data = await res.json();
    return data.narrative || "";
  }

  private buildTemplateFallback(
    narrativeType: string,
    context?: { executionMode?: string }
  ): NarrativeResult {
    const execMode = context?.executionMode || "ARCHITECT";
    const guide = EXECUTION_MODE_NARRATIVE[execMode] || EXECUTION_MODE_NARRATIVE.ARCHITECT;

    const fallbacks: Record<string, string> = {
      STRATEGIC_SUMMARY: `The current phase tends to favor ${guide.summary.toLowerCase()} Measured, consistent action now builds long-term advantage.`,
      DAILY_BRIEFING: `${guide.title} — prioritize structure and deliberate execution today.`,
      TRANSITION_NARRATIVE: "An energetic shift is approaching. Begin consolidating current efforts to prepare for new conditions.",
      GOAL_GUIDANCE: "Current conditions moderately support your goal. A disciplined, structured approach tends to yield the best outcomes now.",
      EXECUTION_COACHING: guide.summary,
    };

    return {
      text: fallbacks[narrativeType] || fallbacks.STRATEGIC_SUMMARY,
      type: narrativeType,
      validated: true,  // Templates are always compliant
      violations: [],
      source: "template_fallback",
    };
  }
}
