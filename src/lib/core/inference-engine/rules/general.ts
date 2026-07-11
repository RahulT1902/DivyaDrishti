import { AstrologyContext, InferenceConclusion, PlanetName } from "../../types";
import { SymbolRegistry } from "../symbolRegistry";

export interface InferenceRule {
  id: string;
  domain: string;    // "General" | "Career" | "Wealth" | "Marriage" | "Health"
  priority: number;  // lower = evaluated first
  test: (ctx: AstrologyContext, sym: SymbolRegistry) => boolean;
  conclude: (ctx: AstrologyContext, sym: SymbolRegistry) => InferenceConclusion;
}

// General rules apply across all domains.
// They capture high-level chart quality that domain engines can reference.

export const GENERAL_RULES: InferenceRule[] = [

  // ── Yogakaraka planet present and strong ─────────────────────────────────
  {
    id: "gen-yogakaraka-strong",
    domain: "General",
    priority: 1,
    test: (ctx, sym) => {
      const yk = sym.yogakarakas();
      return yk.some(p => sym.strengthOf(p) >= 65);
    },
    conclude: (ctx, sym): InferenceConclusion => {
      const yk = sym.yogakarakas().filter(p => sym.strengthOf(p) >= 65);
      const strength = Math.max(...yk.map(p => sym.strengthOf(p)));
      return {
        id: "gen-yogakaraka-strong",
        domain: "General",
        statement: `Yogakaraka planet(s) ${yk.join(", ")} are strong (${strength}/100)`,
        confidence: strength,
        probability: Math.round(strength * 0.85),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: yk.map(p =>
          `${p} is Yogakaraka with strength ${sym.strengthOf(p)}/100`,
        ),
        conflictingEvidence: [],
        reasonCodes: ["YOGAKARAKA_STRONG", "OVERALL_POSITIVE"],
        planets: yk,
      };
    },
  },

  // ── Multiple active yogas ─────────────────────────────────────────────────
  {
    id: "gen-multiple-active-yogas",
    domain: "General",
    priority: 2,
    test: (ctx) => {
      const active = ctx.yogaAnalysis.activations.filter(
        a => a.status === "Active" || a.status === "Peak",
      );
      return active.length >= 2;
    },
    conclude: (ctx): InferenceConclusion => {
      const active = ctx.yogaAnalysis.activations.filter(
        a => a.status === "Active" || a.status === "Peak",
      );
      const avg = Math.round(
        active.reduce((s, a) => s + a.activationScore, 0) / active.length,
      );
      const names = active.map(a =>
        ctx.yogaAnalysis.birthPromises.find(p => p.id === a.yogaId)?.name ?? a.yogaId,
      );
      return {
        id: "gen-multiple-active-yogas",
        domain: "General",
        statement: `${active.length} yogas are currently active — above-average life outcomes indicated`,
        confidence: avg,
        probability: Math.round(avg * 0.80),
        direction: "Positive",
        timing: "Current",
        supportingEvidence: names.map(n => `${n} is active`),
        conflictingEvidence: [],
        reasonCodes: ["MULTIPLE_YOGAS_ACTIVE", "OVERALL_POSITIVE"],
        planets: [...new Set(
          active.flatMap(a =>
            ctx.yogaAnalysis.birthPromises.find(p => p.id === a.yogaId)?.supportingPlanets ?? [],
          ),
        )] as PlanetName[],
      };
    },
  },

  // ── Lagna lord strong ─────────────────────────────────────────────────────
  {
    id: "gen-lagna-lord-strong",
    domain: "General",
    priority: 3,
    test: (ctx, sym) => {
      const lagnaLord = sym.lordOf(1);
      return !!lagnaLord && sym.strengthOf(lagnaLord) >= 60;
    },
    conclude: (ctx, sym): InferenceConclusion => {
      const lagnaLord = sym.lordOf(1)!;
      const strength  = sym.strengthOf(lagnaLord);
      return {
        id: "gen-lagna-lord-strong",
        domain: "General",
        statement: `Lagna lord ${lagnaLord} is strong (${strength}/100) — strong personal vitality and self-expression`,
        confidence: strength,
        probability: Math.round(strength * 0.90),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [`${lagnaLord} (lagna lord) strength ${strength}/100`],
        conflictingEvidence: [],
        reasonCodes: ["LAGNA_STRONG", "VITALITY_HIGH"],
        planets: [lagnaLord],
      };
    },
  },

  // ── Lagna lord weak ───────────────────────────────────────────────────────
  {
    id: "gen-lagna-lord-weak",
    domain: "General",
    priority: 4,
    test: (ctx, sym) => {
      const lagnaLord = sym.lordOf(1);
      return !!lagnaLord && sym.strengthOf(lagnaLord) < 35;
    },
    conclude: (ctx, sym): InferenceConclusion => {
      const lagnaLord = sym.lordOf(1)!;
      const strength  = sym.strengthOf(lagnaLord);
      return {
        id: "gen-lagna-lord-weak",
        domain: "General",
        statement: `Lagna lord ${lagnaLord} is weak (${strength}/100) — reduced personal efficacy; requires conscious effort`,
        confidence: 100 - strength,
        probability: Math.round((100 - strength) * 0.75),
        direction: "Negative",
        timing: "Natal",
        supportingEvidence: [`${lagnaLord} (lagna lord) strength ${strength}/100`],
        conflictingEvidence: [],
        reasonCodes: ["LAGNA_WEAK", "VITALITY_LOW"],
        planets: [lagnaLord],
      };
    },
  },

  // ── Overall yoga strength high ─────────────────────────────────────────────
  {
    id: "gen-high-yoga-strength",
    domain: "General",
    priority: 5,
    test: (ctx) => ctx.yogaAnalysis.overallBirthStrength >= 70,
    conclude: (ctx): InferenceConclusion => {
      const s = ctx.yogaAnalysis.overallBirthStrength;
      return {
        id: "gen-high-yoga-strength",
        domain: "General",
        statement: `Chart has high overall yoga strength (${s}/100) — exceptional life circumstances indicated`,
        confidence: s,
        probability: Math.round(s * 0.80),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [`Overall yoga birth strength: ${s}/100`],
        conflictingEvidence: [],
        reasonCodes: ["HIGH_CHART_QUALITY"],
        planets: [],
      };
    },
  },
];
