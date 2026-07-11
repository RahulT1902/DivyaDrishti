import {
  PlanetName, AstrologyContext, FunctionalNature,
} from "../types";

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
    return !!this.ctx.chartSuite.D10;
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

  // ── Internal helpers ──────────────────────────────────────────────────────

  private byNature(...natures: FunctionalNature[]): PlanetName[] {
    return this.ctx.planetRoles
      .filter(r => natures.includes(r.functionalNature))
      .map(r => r.planet);
  }
}
