import { getCareerTranslation } from "./careerInterpreter";
import { getFinanceTranslation } from "./financeInterpreter";
import { getRelationshipTranslation } from "./relationshipInterpreter";
import { getHealthTranslation } from "./healthInterpreter";

export function getDomainTranslation(domain: string, evidence: any[]): string {
  switch (domain) {
    case "career": return getCareerTranslation(evidence);
    case "finance": return getFinanceTranslation(evidence);
    case "relationship": return getRelationshipTranslation(evidence);
    case "health": return getHealthTranslation(evidence);
    default: return "Stability and structural focus is key.";
  }
}
