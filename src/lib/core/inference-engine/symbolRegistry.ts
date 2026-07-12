import {
  PlanetName, AstrologyContext, FunctionalNature,
} from "../types";

// ── Ashtakavarga lookup tables (Parashara Hora Shastra) ─────────────────────
// Favorable position offsets FROM each reference point for each target planet.
// Key: target planet → { reference point → favorable offset array (1-based) }

const ASHTAKAVARGA_TABLES: Record<string, Record<string, number[]>> = {
  Sun: {
    Sun:     [1, 2, 4, 7, 8, 9, 10, 11],
    Moon:    [3, 6, 10, 11],
    Mars:    [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus:   [6, 7, 12],
    Saturn:  [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna:   [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun:     [3, 6, 7, 8, 10, 11],
    Moon:    [1, 3, 6, 7, 10, 11],
    Mars:    [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus:   [3, 4, 5, 7, 9, 10, 11],
    Saturn:  [3, 5, 6, 11],
    Lagna:   [3, 6, 10, 11],
  },
  Mars: {
    Sun:     [3, 5, 6, 10, 11],
    Moon:    [3, 6, 11],
    Mars:    [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus:   [6, 8, 11, 12],
    Saturn:  [1, 4, 7, 8, 9, 10, 11],
    Lagna:   [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun:     [5, 6, 9, 11, 12],
    Moon:    [2, 4, 6, 8, 10, 11],
    Mars:    [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus:   [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn:  [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna:   [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun:     [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon:    [2, 5, 7, 9, 11],
    Mars:    [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus:   [2, 5, 6, 9, 10, 11],
    Saturn:  [3, 5, 6, 12],
    Lagna:   [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun:     [8, 11, 12],
    Moon:    [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars:    [3, 4, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus:   [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn:  [3, 4, 5, 8, 9, 10, 11],
    Lagna:   [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun:     [1, 2, 4, 7, 8, 10, 11],
    Moon:    [3, 6, 11],
    Mars:    [3, 5, 6, 10, 11, 12],
    Mercury: [6, 9, 10, 12],
    Jupiter: [5, 6, 11, 12],
    Venus:   [6, 11, 12],
    Saturn:  [3, 5, 6, 11],
    Lagna:   [1, 3, 4, 6, 10, 11],
  },
};

// SymbolRegistry resolves symbolic astrological concepts at runtime.
//
// Inference rules should query this registry rather than hardcoding planet
// names, so that the same rule works correctly for every lagna.
//
// Example:
//   registry.yogakarakas()      → ["Mars"]           (for Cancer lagna)
//   registry.yogakarakas()      → ["Saturn"]         (for Libra lagna)
//   registry.functionalBenefics() → lagna-specific list

export class SymbolRegistry {
  constructor(private readonly ctx: AstrologyContext) {}

  // Lazy Ashtakavarga cache — populated on first query, never recomputed
  private _ashtakaBinna?: Map<string, number[]>;  // planet name → scores[0..12] (index = sign)
  private _ashtakaSarva?: number[];               // sarva scores[0..12] (index = sign)

  // ── Planet sets by natural nature ────────────────────────────────────────────

  naturalBenefics(): PlanetName[] {
    return ["Jupiter", "Venus", "Moon", "Mercury"];
  }

  naturalMalefics(): PlanetName[] {
    return ["Saturn", "Mars", "Sun", "Rahu", "Ketu"];
  }

  // ── Planet sets by functional nature (lagna-dependent) ────────────────────

  functionalBenefics(): PlanetName[] {
    return this.byNature("Yogakaraka", "FunctionalBenefic");
  }

  functionalMalefics(): PlanetName[] {
    return this.byNature("FunctionalMalefic", "Badhaka", "Maraka");
  }

  yogakarakas(): PlanetName[] {
    return this.ctx.planetRoles
      .filter(r => r.isYogakaraka)
      .map(r => r.planet);
  }

  marakas(): PlanetName[] {
    return this.ctx.planetRoles
      .filter(r => r.isMaraka)
      .map(r => r.planet);
  }

  // ── Planet sets by strength ────────────────────────────────────────────────

  strongPlanets(threshold = 65): PlanetName[] {
    return this.ctx.planetStrengths
      .filter(s => s.overallStrength >= threshold)
      .map(s => s.planet);
  }

  weakPlanets(threshold = 40): PlanetName[] {
    return this.ctx.planetStrengths
      .filter(s => s.overallStrength < threshold)
      .map(s => s.planet);
  }

  strengthOf(planet: PlanetName): number {
    return this.ctx.planetStrengths.find(s => s.planet === planet)?.overallStrength ?? 50;
  }

  // Returns the planet with the highest overall strength
  strongestPlanet(): PlanetName {
    const sorted = [...this.ctx.planetStrengths]
      .sort((a, b) => b.overallStrength - a.overallStrength);
    return sorted[0]?.planet ?? "Sun";
  }

  // ── House lords ───────────────────────────────────────────────────────────

  lordOf(house: number): PlanetName | undefined {
    return this.ctx.chartSuite.D1.lords.find(l => l.house === house)?.lord;
  }

  strengthOfHouseLord(house: number): number {
    const lord = this.lordOf(house);
    if (!lord) return 50;
    return this.strengthOf(lord);
  }

  // ── Dasha symbols ────────────────────────────────────────────────────────

  currentDashaLord(): PlanetName | undefined {
    return this.ctx.dasha?.mahadasha;
  }

  currentAntardashaLord(): PlanetName | undefined {
    return this.ctx.dasha?.antardasha;
  }

  // ── Yoga queries ──────────────────────────────────────────────────────────

  activeYogaIds(): string[] {
    return this.ctx.yogaAnalysis.activations
      .filter(a => a.status === "Active" || a.status === "Peak")
      .map(a => a.yogaId);
  }

  yogaActivationStatus(yogaId: string): string {
    return this.ctx.yogaAnalysis.activations.find(a => a.yogaId === yogaId)?.status ?? "Dormant";
  }

  birthStrengthOf(yogaId: string): number {
    return this.ctx.yogaAnalysis.birthPromises.find(y => y.id === yogaId)?.birthStrength ?? 0;
  }

  // ── D10 (Dashamsa) — Career divisional chart queries ─────────────────────
  // D10 is the primary varga for career, profession, and status.
  // D10 must be treated as an equal citizen alongside D1 in career assessment.
  //
  // When D10.strengths is empty (not yet computed), methods fall back to
  // D1 strength as a graceful approximation — callers should check
  // hasD10Strengths() and flag it as missing data in UncertaintyProfile.

  hasD10(): boolean {
    const d10 = this.ctx.chartSuite.D10;
    return !!d10 && d10.metadata.source !== "Placeholder";
  }

  hasD10Strengths(): boolean {
    return (this.ctx.chartSuite.D10?.strengths?.length ?? 0) > 0;
  }

  // House a planet occupies in D10 (1–12)
  d10PlanetHouse(planet: PlanetName): number | undefined {
    return this.ctx.chartSuite.D10?.planets.find(p => p.planet === planet)?.house;
  }

  // Lord of a D10 house
  d10LordOf(house: number): PlanetName | undefined {
    return this.ctx.chartSuite.D10?.lords.find(l => l.house === house)?.lord;
  }

  // Placement house of a D10 lord (where is the lord placed in D10?)
  d10LordPlacedInHouse(house: number): number | undefined {
    return this.ctx.chartSuite.D10?.lords.find(l => l.house === house)?.lordPlacedInHouse;
  }

  // Strength of a planet in D10.  Falls back to D1 strength if D10 strengths not computed.
  d10StrengthOf(planet: PlanetName): number {
    const d10Strength = this.ctx.chartSuite.D10?.strengths.find(s => s.planet === planet)?.overallStrength;
    if (d10Strength !== undefined) return d10Strength;
    // Graceful fallback: D1 strength (with 10% reduction to signal lower certainty)
    return Math.round(this.strengthOf(planet) * 0.90);
  }

  // Is the planet in a Kendra (1/4/7/10) or Trikona (1/5/9) in D10?
  d10PlanetInKendraTrikona(planet: PlanetName): boolean {
    const house = this.d10PlanetHouse(planet);
    return house !== undefined && [1, 4, 5, 7, 9, 10].includes(house);
  }

  // Strength of the D10 house lord (composite: D10 if available, D1 fallback)
  d10StrengthOfHouseLord(house: number): number {
    const lord = this.d10LordOf(house);
    if (!lord) return 50;
    return this.d10StrengthOf(lord);
  }

  // ── Ashtakavarga ──────────────────────────────────────────────────────────
  // Binna = per-planet bindhu scores per sign (0–8).
  // Sarva = sum of all 7 Binna scores per sign (0–56).
  // Computation is lazy: triggered on first query and cached thereafter.

  private computeAshtakavarga(): void {
    if (this._ashtakaBinna) return;

    const d1 = this.ctx.chartSuite.D1;
    const tables = ASHTAKAVARGA_TABLES;
    const PLANETS_7: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    const REFS_8: (PlanetName | "Lagna")[] = [...PLANETS_7, "Lagna"];

    // Returns the sign (1–12) where a reference point is located in D1
    const getSign = (ref: PlanetName | "Lagna"): number => {
      if (ref === "Lagna") return d1.ascendant.sign;
      const p = d1.planets.find(x => x.planet === ref);
      return p?.sign ?? 1;
    };

    const binna = new Map<string, number[]>();
    const sarva = new Array<number>(13).fill(0);

    for (const target of PLANETS_7) {
      const scores = new Array<number>(13).fill(0);
      const tableForTarget = tables[target] ?? {};

      for (const ref of REFS_8) {
        const refSign = getSign(ref);
        const offsets: number[] = tableForTarget[ref] ?? [];
        for (const offset of offsets) {
          // Convert to 0-based, apply offset, wrap around 12 signs, convert back to 1-based
          const targetSign = ((refSign - 1 + offset - 1) % 12) + 1;
          scores[targetSign]++;
        }
      }

      binna.set(target, scores);
      for (let s = 1; s <= 12; s++) sarva[s] += scores[s];
    }

    this._ashtakaBinna = binna;
    this._ashtakaSarva = sarva;
  }

  // Binna Ashtakavarga: bindhu score for `planet` in `sign` (0–8).
  // Returns neutral 4 for planets not in the 7-planet system (Rahu, Ketu).
  binnaAshtakavarga(planet: string, sign: number): number {
    this.computeAshtakavarga();
    return this._ashtakaBinna?.get(planet)?.[sign] ?? 4;
  }

  // Sarva Ashtakavarga: sum of all 7 Binna scores for `sign` (0–56).
  // Returns midpoint 28 as fallback if computation failed.
  sarvaAshtakavarga(sign: number): number {
    this.computeAshtakavarga();
    return this._ashtakaSarva?.[sign] ?? 28;
  }

  // Sarva bindhu score at the sign where `planet` is placed in D1.
  sarvaAtPlanet(planet: string): number {
    const d1 = this.ctx.chartSuite.D1;
    const p = d1.planets.find(x => (x.planet as string) === planet);
    const sign: number = p?.sign ?? 1;
    return this.sarvaAshtakavarga(sign);
  }

  // Binna bindhu score for `planet` at the sign where it is placed in D1.
  // Returns neutral 4 for Rahu/Ketu (no Binna table in classical system).
  binnaAtPlanet(planet: string): number {
    const d1 = this.ctx.chartSuite.D1;
    const p = d1.planets.find(x => (x.planet as string) === planet);
    const sign: number = p?.sign ?? 1;
    return this.binnaAshtakavarga(planet, sign);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private byNature(...natures: FunctionalNature[]): PlanetName[] {
    return this.ctx.planetRoles
      .filter(r => natures.includes(r.functionalNature))
      .map(r => r.planet);
  }
}
