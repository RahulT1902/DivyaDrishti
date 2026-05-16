import { Manifestations } from "./types";

export function generateManifestations(planet: string, house: number, nature: string): Manifestations {
  // Base themes based on planet and house
  const external: string[] = [];
  const internal: string[] = [];
  const themes: string[] = [];

  if (planet === "Saturn") {
    themes.push("discipline", "delay", "responsibility");
    if (house === 10) {
      external.push("heavier workload", "authority pressure", "long-term restructuring");
      internal.push("fear of failure", "need for control", "patience testing");
    } else if (house === 4) {
      external.push("domestic responsibilities", "property matters", "career foundation building");
      internal.push("emotional heaviness", "need for security", "inner restructuring");
    } else {
      external.push("slowed progress in projects", "reality checks");
      internal.push("mental fatigue", "demand for maturity");
    }
  } else if (planet === "Jupiter") {
    themes.push("growth", "wisdom", "expansion");
    if ([2, 5, 9, 11].includes(house)) {
      external.push("financial opportunities", "network expansion", "educational growth");
      internal.push("optimism", "broader perspective", "faith restoration");
    } else {
      external.push("gradual improvement", "protective influences");
      internal.push("seeking meaning", "philosophical shifts");
    }
  } else if (planet === "Rahu") {
    themes.push("ambition", "unorthodox approaches", "obsession");
    if ([1, 10].includes(house)) {
      external.push("sudden visibility", "unconventional career moves", "rule-breaking");
      internal.push("intense drive", "identity confusion", "restlessness");
    } else {
      external.push("disruptive changes", "foreign influences");
      internal.push("hyper-focus", "unsatisfied desires");
    }
  } else if (planet === "Ketu") {
    themes.push("detachment", "spirituality", "release");
    external.push("cutting ties", "sudden endings", "simplification");
    internal.push("apathy toward material goals", "intuitive surges", "desire for isolation");
  } else if (planet === "Mars") {
    themes.push("energy", "conflict", "action");
    external.push("increased activity", "frictions", "fast executions");
    internal.push("irritability", "courage", "impatience");
  } else {
    themes.push("daily shifts", "communication", "routine");
    external.push("minor schedule changes", "conversations");
    internal.push("mood fluctuations", "information processing");
  }

  return { external, internal };
}
