import {
  AstrologyContext,
  InferenceNode, AstrologicalEvidence,
} from "../types";

// InferenceGraphBuilder constructs a bidirectional inference graph.
//
// Node hierarchy:
//   Fact         — raw astrological observation (planet position, yoga birth, strength)
//   Inference    — derived conclusion from an InferenceConclusion (rule fired)
//   Hypothesis   — abstract concept (Leadership, Wealth) bridging facts and decisions
//   Decision     — domain-level output synthesised from hypotheses
//
// Parent/child links allow "Why?" traversal:
//   Decision → asks why? → Hypothesis → why? → Inference → why? → Fact

export class InferenceGraphBuilder {
  build(ctx: AstrologyContext): InferenceNode[] {
    const nodes: InferenceNode[] = [];

    // ── Layer 0: Fact nodes ────────────────────────────────────────────────────

    // Planet strength facts
    for (const ps of ctx.planetStrengths) {
      if (ps.overallStrength >= 60 || ps.overallStrength < 40) {
        const id = `fact:strength:${ps.planet}`;
        nodes.push({
          id,
          type: "Fact",
          label: `${ps.planet} strength: ${ps.overallStrength.toFixed(0)}%`,
          confidence: ps.overallStrength,
          parents: [],
          children: [],
              evidence: [{
            id:          `fact-strength-${ps.planet}`,
            category:    "Strength" as const,
            description: `Shadbala-derived strength: ${ps.overallStrength.toFixed(0)}`,
            strength:    ps.overallStrength,
            weight:      1.0,
            sourceChart: "D1" as const,
            planet:      ps.planet,
          }],
        });
      }
    }

    // Yoga birth promise facts
    for (const promise of ctx.yogaAnalysis.birthPromises) {
      const id = `fact:yoga:${promise.id}`;
      const activation = ctx.yogaAnalysis.activations.find(a => a.yogaId === promise.id);
      nodes.push({
        id,
        type: "Fact",
        label: `${promise.name} (birth: ${promise.birthStrength.toFixed(0)}%)`,
        confidence: promise.birthStrength,
        parents: [],
        children: [],
        evidence: promise.evidence,
      });
    }

    // ── Layer 1: Inference nodes ───────────────────────────────────────────────

    for (const conclusion of ctx.inferences) {
      const id = `inference:${conclusion.id}`;

      // Link to planet-strength fact nodes for any planet in this conclusion
      const parentIds = conclusion.planets
        .map(p => `fact:strength:${p}`)
        .filter(pid => nodes.some(n => n.id === pid));

      // Also link to yoga fact nodes if a yoga reason code is present
      const yogaFactIds = conclusion.supportingEvidence
        .flatMap(e => {
          const match = ctx.yogaAnalysis.birthPromises.find(p => e.includes(p.name));
          return match ? [`fact:yoga:${match.id}`] : [];
        });

      const allParents = [...new Set([...parentIds, ...yogaFactIds])];

      nodes.push({
        id,
        type: "Inference",
        label: conclusion.statement,
        confidence: conclusion.confidence,
        parents: allParents,
        children: [],
        evidence: conclusion.supportingEvidence.map((desc, i) => ({
          id:          `inf-${conclusion.id}-ev${i}`,
          category:    "Placement" as const,
          description: desc,
          strength:    conclusion.confidence,
          weight:      1.0,
          sourceChart: "D1" as const,
        })),
      });

      // Back-link: add this inference as a child of its parent fact nodes
      for (const pid of allParents) {
        const parentNode = nodes.find(n => n.id === pid);
        if (parentNode && !parentNode.children.includes(id)) {
          parentNode.children.push(id);
        }
      }
    }

    // ── Layer 2: Hypothesis nodes ─────────────────────────────────────────────

    for (const hypothesis of ctx.hypotheses) {
      const id = `hypothesis:${hypothesis.id}`;

      // Parent = inference nodes whose conclusions triggered this hypothesis
      const parentIds = hypothesis.sourceInferenceIds
        .map(srcId => `inference:${srcId}`)
        .filter(pid => nodes.some(n => n.id === pid));

      nodes.push({
        id,
        type: "Hypothesis",
        label: hypothesis.label,
        confidence: hypothesis.confidence,
        parents: parentIds,
        children: [],
        evidence: hypothesis.evidence,
      });

      for (const pid of parentIds) {
        const parentNode = nodes.find(n => n.id === pid);
        if (parentNode && !parentNode.children.includes(id)) {
          parentNode.children.push(id);
        }
      }
    }

    // ── Layer 3: Decision nodes ───────────────────────────────────────────────
    // One Decision node per domain that has at least one active hypothesis.

    const domainHypothesisMap = new Map<string, string[]>();
    for (const hypothesis of ctx.hypotheses) {
      for (const domain of Object.keys(hypothesis.domains)) {
        const weight = hypothesis.domains[domain];
        if (weight >= 0.4) {
          const existing = domainHypothesisMap.get(domain) ?? [];
          existing.push(`hypothesis:${hypothesis.id}`);
          domainHypothesisMap.set(domain, existing);
        }
      }
    }

    for (const [domain, hypIds] of domainHypothesisMap) {
      const id = `decision:${domain.toLowerCase()}`;

      // Weighted average confidence for this domain
      const relevantHyps = ctx.hypotheses.filter(h =>
        hypIds.includes(`hypothesis:${h.id}`),
      );
      const domainConfidence = relevantHyps.length === 0 ? 50 :
        Math.round(
          relevantHyps.reduce((sum, h) => sum + h.confidence * (h.domains[domain] ?? 0), 0) /
          relevantHyps.reduce((sum, h) => sum + (h.domains[domain] ?? 0), 0),
        );

      nodes.push({
        id,
        type: "Decision",
        label: `${domain} Domain Assessment`,
        confidence: domainConfidence,
        parents: hypIds,
        children: [],
        evidence: [{
          id:          `decision-${domain.toLowerCase()}-synthesis`,
          category:    "Strength" as const,
          description: `Synthesised from ${relevantHyps.length} hypothesis node(s)`,
          strength:    domainConfidence,
          weight:      1.0,
          sourceChart: "D1" as const,
        }],
      });

      for (const pid of hypIds) {
        const parentNode = nodes.find(n => n.id === pid);
        if (parentNode && !parentNode.children.includes(id)) {
          parentNode.children.push(id);
        }
      }
    }

    return nodes;
  }

  // Returns the "Why?" chain for a given node id — walks up the parent links
  // to produce an ordered list from root fact to the requested node.
  explainNode(nodes: InferenceNode[], nodeId: string): InferenceNode[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const result: InferenceNode[] = [];
    const visited = new Set<string>();

    const walk = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = nodeMap.get(id);
      if (!node) return;
      for (const pid of node.parents) walk(pid);
      result.push(node);
    };

    walk(nodeId);
    return result;
  }
}
