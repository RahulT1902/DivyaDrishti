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

  // ── Internal helpers ──────────────────────────────────────────────────────

  private byNature(...natures: FunctionalNature[]): PlanetName[] {
    return this.ctx.planetRoles
      .filter(r => natures.includes(r.functionalNature))
      .map(r => r.planet);
  }
}
