export function classifyTransitNature(planet: string, houseFromMoon: number, houseFromLagna: number): string {
  // A simplistic but robust contextual classification
  
  if (planet === "Saturn") {
    if ([3, 6, 11].includes(houseFromMoon)) return "structural expansion";
    if ([4, 8, 12].includes(houseFromMoon)) return "structural pressure";
    return "karmic restructuring";
  }
  
  if (planet === "Jupiter") {
    if ([2, 5, 7, 9, 11].includes(houseFromMoon)) return "optimistic expansion";
    if ([6, 8, 12].includes(houseFromMoon)) return "internal realignments";
    return "steady growth";
  }

  if (planet === "Rahu") {
    if ([3, 6, 10, 11].includes(houseFromLagna)) return "ambitious drive";
    if ([4, 8, 12].includes(houseFromLagna)) return "psychological turbulence";
    return "unconventional desires";
  }

  if (planet === "Ketu") {
    if ([3, 6, 10, 11].includes(houseFromLagna)) return "intuitive breakthroughs";
    if ([4, 8, 12].includes(houseFromLagna)) return "detachment phase";
    return "spiritual withdrawal";
  }

  if (planet === "Mars") {
    if ([3, 6, 11].includes(houseFromMoon)) return "dynamic action";
    return "energetic friction";
  }

  if (planet === "Sun") {
    if ([3, 6, 10, 11].includes(houseFromMoon)) return "authority illumination";
    return "ego calibration";
  }

  return "neutral flow";
}
