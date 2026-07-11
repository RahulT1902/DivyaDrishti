import {
  RuleNode, PlanetName, HouseGroup, EvaluationContext, ConditionResult,
} from "../../types";
import { EXALTATION, DEBILITATION, OWN_SIGNS } from "../../chart-engine/lordEngine";

// ── Main entry point ─────────────────────────────────────────────────────────

export function evaluateRule(node: RuleNode, ctx: EvaluationContext): ConditionResult {
  const { chart, roles, strengths } = ctx;

  switch (node.type) {

    case "PlanetInSign": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      const ok = p.sign === node.sign;
      return ok
        ? hit([node.planet], [`${node.planet} is in ${p.signName}`])
        : none();
    }

    case "PlanetInHouse": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      const ok = p.house === node.house;
      return ok
        ? hit([node.planet], [`${node.planet} is in the ${node.house}th house`])
        : none();
    }

    case "PlanetInGroup": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      const ok = inGroup(p.house, node.group);
      return ok
        ? hit([node.planet], [`${node.planet} is in ${node.group} (house ${p.house})`])
        : none();
    }

    case "PlanetStrength": {
      const s = strengths.find(x => x.planet === node.planet);
      if (!s) return none();
      const ok = cmp(s.overallStrength, node.op, node.value);
      return ok
        ? hit([node.planet], [`${node.planet} strength ${s.overallStrength}/100 (${node.op}${node.value})`])
        : none();
    }

    case "PlanetFunctionalNature": {
      const r = roles.find(x => x.planet === node.planet);
      if (!r) return none();
      const ok = r.functionalNature === node.nature;
      return ok
        ? hit([node.planet], [`${node.planet} is ${node.nature}`])
        : none();
    }

    case "PlanetIsYogakaraka": {
      const r = roles.find(x => x.planet === node.planet);
      if (!r) return none();
      return r.isYogakaraka
        ? hit([node.planet], [`${node.planet} is Yogakaraka`])
        : none();
    }

    case "PlanetsConjunct": {
      const p1 = chart.planets.find(pl => pl.planet === node.planet1);
      const p2 = chart.planets.find(pl => pl.planet === node.planet2);
      if (!p1 || !p2) return none();
      const ok = p1.house === p2.house;
      return ok
        ? hit([node.planet1, node.planet2], [`${node.planet1} and ${node.planet2} conjunct in house ${p1.house}`])
        : none();
    }

    case "PlanetAspectsHouse": {
      const ok = chart.aspects.some(a => a.fromPlanet === node.planet && a.toHouse === node.house);
      return ok
        ? hit([node.planet], [`${node.planet} aspects the ${node.house}th house`])
        : none();
    }

    case "PlanetAspectsPlanet": {
      const target = chart.planets.find(pl => pl.planet === node.to);
      if (!target) return none();
      const ok = chart.aspects.some(a => a.fromPlanet === node.from && a.toHouse === target.house);
      return ok
        ? hit([node.from, node.to], [`${node.from} aspects ${node.to} in house ${target.house}`])
        : none();
    }

    case "LordOfHouseInHouse": {
      const ld = chart.lords.find(l => l.house === node.lordOf);
      if (!ld) return none();
      const ok = ld.lordPlacedInHouse === node.inHouse;
      return ok
        ? hit([ld.lord], [`Lord of ${node.lordOf}th (${ld.lord}) placed in ${node.inHouse}th house`])
        : none();
    }

    case "LordOfHouseInGroup": {
      const ld = chart.lords.find(l => l.house === node.lordOf);
      if (!ld) return none();
      const ok = inGroup(ld.lordPlacedInHouse, node.group);
      return ok
        ? hit([ld.lord], [`Lord of ${node.lordOf}th (${ld.lord}) is in ${node.group} (house ${ld.lordPlacedInHouse})`])
        : none();
    }

    case "HouseLordsConjunct": {
      const l1 = chart.lords.find(l => l.house === node.house1);
      const l2 = chart.lords.find(l => l.house === node.house2);
      if (!l1 || !l2) return none();
      if (l1.lord === l2.lord) {
        return hit([l1.lord], [`${l1.lord} rules both ${node.house1}th and ${node.house2}th houses`]);
      }
      const ok = l1.lordPlacedInHouse === l2.lordPlacedInHouse;
      return ok
        ? hit([l1.lord, l2.lord], [
            `Lord of ${node.house1}th (${l1.lord}) and lord of ${node.house2}th (${l2.lord}) ` +
            `conjunct in house ${l1.lordPlacedInHouse}`,
          ])
        : none();
    }

    case "HouseLordAspectsHouseLord": {
      const from = chart.lords.find(l => l.house === node.fromHouse);
      const to   = chart.lords.find(l => l.house === node.toHouse);
      if (!from || !to) return none();
      const ok = chart.aspects.some(a => a.fromPlanet === from.lord && a.toHouse === to.lordPlacedInHouse);
      return ok
        ? hit([from.lord, to.lord], [
            `Lord of ${node.fromHouse}th (${from.lord}) aspects lord of ${node.toHouse}th (${to.lord})`,
          ])
        : none();
    }

    case "PlanetIsExalted": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      const ok = EXALTATION[node.planet] === p.sign;
      return ok
        ? hit([node.planet], [`${node.planet} is exalted in ${p.signName}`])
        : none();
    }

    case "PlanetIsDebilitated": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      const ok = DEBILITATION[node.planet] === p.sign;
      return ok
        ? hit([node.planet], [`${node.planet} is debilitated in ${p.signName}`])
        : none();
    }

    case "PlanetInOwnSign": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      const ownSigns = (OWN_SIGNS[node.planet] ?? []) as number[];
      const ok = ownSigns.includes(p.sign);
      return ok
        ? hit([node.planet], [`${node.planet} is in own sign ${p.signName}`])
        : none();
    }

    case "PlanetIsRetrograde": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      return p.isRetrograde
        ? hit([node.planet], [`${node.planet} is retrograde (Vakri)`])
        : none();
    }

    case "PlanetIsCombust": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      return p.isCombust
        ? hit([node.planet], [`${node.planet} is combust`])
        : none();
    }

    case "PlanetIsVargottama": {
      const p = chart.planets.find(pl => pl.planet === node.planet);
      if (!p) return none();
      return p.isVargottama
        ? hit([node.planet], [`${node.planet} is Vargottama (same sign D1 + D9)`])
        : none();
    }

    case "PlanetInKendraFromPlanet": {
      const p   = chart.planets.find(pl => pl.planet === node.planet);
      const ref = chart.planets.find(pl => pl.planet === node.reference);
      if (!p || !ref) return none();
      const diff = ((p.house - ref.house + 12) % 12);
      const ok = [0, 3, 6, 9].includes(diff);
      return ok
        ? hit([node.planet, node.reference], [`${node.planet} is in Kendra from ${node.reference}`])
        : none();
    }

    case "HouseHasMinPlanets": {
      const h = chart.houses.find(x => x.number === node.house);
      if (!h) return none();
      const ok = h.planets.length >= node.minCount;
      return ok
        ? hit(h.planets, [`House ${node.house} has ${h.planets.length} planets (min ${node.minCount})`])
        : none();
    }

    case "AND": {
      const results = node.rules.map(r => evaluateRule(r, ctx));
      const ok = results.every(r => r.matches);
      return ok
        ? hit(
            [...new Set(results.flatMap(r => r.supportingPlanets))],
            results.flatMap(r => r.descriptions),
          )
        : none();
    }

    case "OR": {
      for (const r of node.rules) {
        const result = evaluateRule(r, ctx);
        if (result.matches) return result;
      }
      return none();
    }

    case "NOT": {
      const inner = evaluateRule(node.rule, ctx);
      return inner.matches ? none() : hit([], []);
    }
  }
}

// ── House group membership ────────────────────────────────────────────────────

export function inGroup(house: number, group: HouseGroup): boolean {
  switch (group) {
    case "Kendra":   return [1, 4, 7, 10].includes(house);
    case "Trikona":  return [1, 5, 9].includes(house);
    case "Dusthana": return [6, 8, 12].includes(house);
    case "Upachaya": return [3, 6, 10, 11].includes(house);
    case "Maraka":   return [2, 7].includes(house);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hit(planets: PlanetName[], descriptions: string[]): ConditionResult {
  return { matches: true, supportingPlanets: planets, descriptions };
}

function none(): ConditionResult {
  return { matches: false, supportingPlanets: [], descriptions: [] };
}

function cmp(actual: number, op: ">" | ">=" | "<" | "<=", value: number): boolean {
  if (op === ">")  return actual > value;
  if (op === ">=") return actual >= value;
  if (op === "<")  return actual < value;
  return actual <= value;
}
