import type { PlanetName, Sign } from "../../core/types";

export interface AspectProbability {
  name: string;
  direction: "supporting" | "challenging" | "neutral";
  probability: number;
}

export interface CareerBrief {
  type: "career";
  primaryAspect: string;
  aspects: AspectProbability[];
  opportunityNote: string;
  frictionNote?: string;
  timing?: string;
  overallProbability: number;
}

export interface FinanceAreaStatus {
  name: string;
  status: "supporting" | "challenging" | "neutral";
}

export interface FinanceBrief {
  type: "finance";
  areas: FinanceAreaStatus[];
  primaryFlow: string;
  primarySource: string;
  opportunity?: string;
  risk?: string;
}

export interface RelationshipBrief {
  type: "relationship";
  strongAreas: string[];
  attentionAreas: string[];
  guidance: string;
}

export type ConsultationBrief = CareerBrief | FinanceBrief | RelationshipBrief;

export interface ChartData {
  bodyRiskProfile?: any;
  healthFindings?: any;
  natalPromise?: any;
  domainActivation?: any;
  manifestations?: any;
}

export function renderConsultationBrief(db: ConsultationBrief): string {
  const lines: string[] = [];

  if (db.type === "career") {
    lines.push(`PRIMARY FOCUS: ${db.primaryAspect}`);
    lines.push(`CAREER BREAKDOWN (reference for direction — narrate naturally, don't list percentages mechanically):`);
    db.aspects.forEach(a => {
      const pad = " ".repeat(Math.max(1, 18 - a.name.length));
      lines.push(`  ${a.name}:${pad}${a.direction} (Signal: ${a.probability}/100)`);
    });
    lines.push(`OPPORTUNITY: ${db.opportunityNote}`);
    if (db.frictionNote) lines.push(`FRICTION: ${db.frictionNote}`);
    lines.push(`TIMING: ${db.timing ?? "No specific window yet"}  ← anchor your timeline to this, do not invent a different one`);
    lines.push(`OVERALL SIGNAL STRENGTH: ${db.overallProbability}/100`);
  }

  if (db.type === "finance") {
    lines.push(`FINANCIAL AREAS (use these status labels — do not invent percentages):`);
    db.areas.forEach(a => {
      const pad = " ".repeat(Math.max(1, 22 - a.name.length));
      lines.push(`  ${a.name}:${pad}${a.status}`);
    });
    lines.push(`FLOW: ${db.primaryFlow}`);
    lines.push(`PRIMARY SOURCE: ${db.primarySource}`);
    if (db.opportunity) lines.push(`OPPORTUNITY: ${db.opportunity}`);
    if (db.risk) lines.push(`RISK: ${db.risk}`);
  }

  if (db.type === "relationship") {
    if (db.strongAreas.length > 0) {
      lines.push(`STRONG AREAS:`);
      db.strongAreas.forEach(a => lines.push(`  • ${a}`));
    }
    if (db.attentionAreas.length > 0) {
      lines.push(`AREAS REQUIRING CARE:`);
      db.attentionAreas.forEach(a => lines.push(`  • ${a}`));
    }
    lines.push(`GUIDANCE: ${db.guidance}`);
  }

  return lines.join("\n");
}
