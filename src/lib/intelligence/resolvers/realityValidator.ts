import { AgentResult, RealityValidationResult, AgentSignal } from "../agents/types";

/**
 * RealityValidatorAgent: Prevents fear-based or irrational predictions.
 * Responsibility: Strips out deterministic "doom" and ensures "Life OS" tone.
 */
export class RealityValidatorAgent {
  name = "RealityValidatorAgent";

  async validate(rawInsight: string, triggers: string[]): Promise<RealityValidationResult> {
    let filteredInsight = rawInsight;
    const warnings: string[] = [];
    let suggestedTone = "grounded and empowering";

    // Detect deterministic or fear-based language
    const doomWords = ["disaster", "ruin", "failure", "accident", "death", "terrible", "worst"];
    const containsDoom = doomWords.some(word => rawInsight.toLowerCase().includes(word));

    if (containsDoom) {
      warnings.push("Detected deterministic fear-based language. Re-aligning to growth mindset.");
      filteredInsight = rawInsight.replace(new RegExp(doomWords.join("|"), "gi"), (match) => {
        return `structural challenge (formerly ${match})`;
      });
      suggestedTone = "resilient and cautious";
    }

    // Ensure non-deterministic framing
    if (!filteredInsight.includes("potential") && !filteredInsight.includes("tendency")) {
      filteredInsight = `Based on current cycles, there is a tendency towards: ${filteredInsight}`;
    }

    return {
      isGrounded: !containsDoom,
      warnings,
      filteredInsight,
      suggestedTone
    };
  }

  async process(signals: AgentSignal[]): Promise<AgentResult<RealityValidationResult>> {
    // Check for extreme signal clusters (e.g. triple restrictive)
    const restrictCount = signals.filter(s => s.impact === "restrictive").length;
    const supportCount = signals.filter(s => s.impact === "supportive").length;

    let baselineInsight = "The current environment is balanced.";
    if (restrictCount > supportCount + 2) {
      baselineInsight = "The environment is highly restrictive, requiring significant patience.";
    } else if (supportCount > restrictCount + 2) {
      baselineInsight = "The environment is highly supportive of new initiatives.";
    }

    const validation = await this.validate(baselineInsight, signals.map(s => s.factor));

    return {
      data: validation,
      signals: [], // Validator doesn't add new signals, it filters them
      confidence: 1.0,
      reasoning: [
        `Analyzed ${signals.length} signals for groundedness.`,
        `Restriction/Support ratio: ${restrictCount}/${supportCount}`
      ]
    };
  }
}
