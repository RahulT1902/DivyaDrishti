import { AstroEvidence, StructuralTension } from "../types";

export function solveTensions(evidence: AstroEvidence[]): StructuralTension[] {
  const supportive = evidence.filter(e => e.impact === "supportive");
  const restrictive = evidence.filter(e => e.impact === "restrictive");
  
  if (supportive.length > 0 && restrictive.length > 0) {
    // Generate synthesis based on top conflicting factors
    const topSupport = supportive.sort((a, b) => b.strength - a.strength)[0];
    const topRestrict = restrictive.sort((a, b) => b.strength - a.strength)[0];
    
    let synthesis = "Growth occurs through sustained pressure rather than sudden advancement.";
    
    if (topSupport.factor.includes("Jupiter") && topRestrict.factor.includes("Saturn")) {
      synthesis = "Long-term opportunities are expanding, but short-term delays demand patience.";
    } else if (topSupport.factor.includes("Venus") || topRestrict.factor.includes("Mars")) {
      synthesis = "Passionate momentum must be balanced with structural discipline.";
    }
    
    return [{
      support: topSupport.explanation,
      friction: topRestrict.explanation,
      synthesis
    }];
  }
  
  if (restrictive.length > 0) {
    return [{
      support: "Internal resilience",
      friction: restrictive[0].explanation,
      synthesis: "A phase of structural consolidation where caution is required."
    }];
  }

  return [{
    support: supportive[0]?.explanation || "Stable cosmic alignment",
    friction: "Minor routine disruptions",
    synthesis: "A harmonious phase favoring steady progress."
  }];
}
