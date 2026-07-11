import { PlanetName, Sign, FunctionalNature, AstrologicalEvidence, PlanetRole } from "../types";
import { OWN_SIGNS, SIGN_LORDS } from "../chart-engine/lordEngine";
import { isTrikona, isKendra, isDusthana, isMaraka, getBadhakaHouse } from "./houseClassifier";
import { NATURAL_NATURE, isNaturalBenefic } from "./naturalNature";

// Rahu/Ketu don't own signs in standard Parashari — exclude from ownership
const SHADOW_PLANETS: PlanetName[] = ["Rahu", "Ketu"];

// All 9 planets
const ALL_PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

// Compute which houses each planet owns for a given lagna
function computeOwnedHouses(lagnaSign: Sign): Map<PlanetName, number[]> {
  const map = new Map<PlanetName, number[]>();
  for (const planet of ALL_PLANETS) {
    map.set(planet, []);
  }

  for (let h = 1; h <= 12; h++) {
    const sign = (((lagnaSign - 1 + h - 1) % 12) + 12) % 12 + 1 as Sign;
    const lord = SIGN_LORDS[sign];
    map.get(lord)!.push(h);
  }

  // Rahu/Ketu own no houses
  map.set("Rahu", []);
  map.set("Ketu", []);

  return map;
}

function ownedSigns(planet: PlanetName): Sign[] {
  return (OWN_SIGNS[planet] ?? []) as Sign[];
}

function evidence(
  id: string,
  category: AstrologicalEvidence["category"],
  description: string,
  strength: number,
  weight: number,
  planet: PlanetName,
  house?: number,
): AstrologicalEvidence {
  return { id, category, description, strength, weight, sourceChart: "D1", planet, house };
}

export function computePlanetRoles(lagnaSign: Sign): PlanetRole[] {
  const ownedHouses = computeOwnedHouses(lagnaSign);
  const badhakaHouse = getBadhakaHouse(lagnaSign);

  return ALL_PLANETS.map(planet => {
    const houses    = ownedHouses.get(planet)!;
    const signs     = ownedSigns(planet);
    const natural   = NATURAL_NATURE[planet];
    const reasoning: AstrologicalEvidence[] = [];

    // ── Natural nature evidence ────────────────────────────────────────────
    reasoning.push(evidence(
      `${planet}-natural`,
      "NaturalNature",
      `${planet} is a ${natural} by nature (naisargika)`,
      natural === "GreatBenefic" ? 100 : natural === "Benefic" ? 80
        : natural === "Neutral" ? 50 : natural === "MildMalefic" ? 35 : 20,
      0.3,
      planet,
    ));

    // Shadow planets get a short-circuit
    if (SHADOW_PLANETS.includes(planet)) {
      return {
        planet,
        naturalNature: natural,
        functionalNature: "Neutral",
        ownsHouses: [],
        ownsSigns: [],
        isYogakaraka: false,
        isMaraka: false,
        isBadhaka: false,
        isKendradhipati: false,
        isTrikonadhipati: false,
        isDusthanadhipati: false,
        isFunctionalBenefic: false,
        isFunctionalMalefic: false,
        priorityScore: 40,
        reasoning,
      };
    }

    // ── House ownership analysis ───────────────────────────────────────────
    const ownsTrikona  = houses.some(isTrikona);
    const ownsKendra   = houses.some(isKendra);
    const ownsDusthana = houses.some(isDusthana);
    const ownsMaraka   = houses.some(isMaraka);
    const ownsBadhaka  = houses.includes(badhakaHouse);

    for (const h of houses) {
      const cats = [];
      if (isTrikona(h))  cats.push("Trikona");
      if (isKendra(h))   cats.push("Kendra");
      if (isDusthana(h)) cats.push("Dusthana");
      if (isMaraka(h))   cats.push("Maraka");

      reasoning.push(evidence(
        `${planet}-owns-${h}`,
        "Ownership",
        `${planet} owns the ${h}${ordinal(h)} house (${cats.join(" + ") || "Neutral"})`,
        isTrikona(h) ? 90 : isKendra(h) ? 75 : isDusthana(h) ? 20 : 50,
        0.5,
        planet,
        h,
      ));
    }

    // ── Badhaka ───────────────────────────────────────────────────────────
    if (ownsBadhaka) {
      reasoning.push(evidence(
        `${planet}-badhaka`,
        "FunctionalNature",
        `${planet} owns the ${badhakaHouse}${ordinal(badhakaHouse)} house (Badhaka for this lagna)`,
        85, 0.8, planet, badhakaHouse,
      ));
    }

    // ── Maraka ────────────────────────────────────────────────────────────
    if (ownsMaraka && !ownsTrikona) {
      const marakaHouses = houses.filter(isMaraka);
      reasoning.push(evidence(
        `${planet}-maraka`,
        "FunctionalNature",
        `${planet} owns Maraka house(s) [${marakaHouses.join(", ")}]`,
        80, 0.7, planet,
      ));
    }

    // ── Functional nature decision ─────────────────────────────────────────

    // Yogakaraka: owns both Kendra AND Trikona (excluding 1st from Kendra to avoid double-count
    //             when planet owns only 1st — 1st lord is always benefic but not yogakaraka)
    const ownsTrikona59   = houses.some(h => [5, 9].includes(h));
    const ownsKendra4710  = houses.some(h => [4, 7, 10].includes(h));
    const isYogakaraka    = ownsTrikona59 && ownsKendra4710;

    let functionalNature: FunctionalNature;
    let priorityScore: number;
    let isFunctionalBenefic: boolean;
    let isFunctionalMalefic: boolean;

    if (isYogakaraka) {
      functionalNature = "Yogakaraka";
      priorityScore    = 95;
      isFunctionalBenefic = true;
      isFunctionalMalefic = false;
      reasoning.push(evidence(
        `${planet}-yogakaraka`,
        "FunctionalNature",
        `${planet} is Yogakaraka — owns both a Kendra and a Trikona, conferring highest benefic status`,
        100, 1.0, planet,
      ));
    } else if (ownsBadhaka && !ownsTrikona) {
      functionalNature = "Badhaka";
      priorityScore    = 20;
      isFunctionalBenefic = false;
      isFunctionalMalefic = true;
    } else if (ownsMaraka && !ownsTrikona && !ownsKendra) {
      functionalNature = "Maraka";
      priorityScore    = 30;
      isFunctionalBenefic = false;
      isFunctionalMalefic = true;
    } else if (ownsDusthana && !ownsTrikona && !ownsKendra) {
      // Pure Dusthana lord — functional malefic
      functionalNature = "FunctionalMalefic";
      priorityScore    = 20;
      isFunctionalBenefic = false;
      isFunctionalMalefic = true;
      reasoning.push(evidence(
        `${planet}-dusthana`,
        "FunctionalNature",
        `${planet} owns only Dusthana house(s) — functional malefic`,
        80, 0.8, planet,
      ));
    } else if (ownsDusthana && ownsTrikona) {
      // Dusthana + Trikona lord — Mixed (Viparita Raja Yoga potential)
      functionalNature = "Mixed";
      priorityScore    = 55;
      isFunctionalBenefic = true;
      isFunctionalMalefic = true;
      reasoning.push(evidence(
        `${planet}-mixed`,
        "FunctionalNature",
        `${planet} owns both a Trikona and a Dusthana — mixed results, potential Viparita Raja Yoga`,
        65, 0.6, planet,
      ));
    } else if (ownsTrikona) {
      // Pure Trikona lord (5th or 9th, not yogakaraka)
      functionalNature = "FunctionalBenefic";
      priorityScore    = 82;
      isFunctionalBenefic = true;
      isFunctionalMalefic = false;
      reasoning.push(evidence(
        `${planet}-trikona`,
        "FunctionalNature",
        `${planet} owns a Trikona house — functional benefic`,
        88, 0.9, planet,
      ));
    } else if (ownsKendra) {
      // Kendra-only lord: malefics → benefic, benefics → Kendradhipati Dosha
      if (isNaturalBenefic(planet)) {
        functionalNature = "FunctionalMalefic";
        priorityScore    = 38;
        isFunctionalBenefic = false;
        isFunctionalMalefic = true;
        reasoning.push(evidence(
          `${planet}-kendradhipati`,
          "FunctionalNature",
          `${planet} owns only Kendra(s) as a natural benefic — Kendradhipati Dosha weakens it`,
          70, 0.7, planet,
        ));
      } else {
        // Natural malefic owning Kendra → functional benefic
        functionalNature = "FunctionalBenefic";
        priorityScore    = 68;
        isFunctionalBenefic = true;
        isFunctionalMalefic = false;
        reasoning.push(evidence(
          `${planet}-kendra-malefic`,
          "FunctionalNature",
          `${planet} is a natural malefic owning a Kendra — gains functional benefic status`,
          72, 0.7, planet,
        ));
      }
    } else if (houses.length === 0) {
      // Rahu/Ketu / no ownership
      functionalNature = "Neutral";
      priorityScore    = 40;
      isFunctionalBenefic = false;
      isFunctionalMalefic = false;
    } else {
      functionalNature = "Neutral";
      priorityScore    = 50;
      isFunctionalBenefic = false;
      isFunctionalMalefic = false;
    }

    // Lagna lord bonus — always adds to functional benefic score
    if (houses.includes(1)) {
      priorityScore = Math.min(100, priorityScore + 10);
      reasoning.push(evidence(
        `${planet}-lagnaLord`,
        "FunctionalNature",
        `${planet} owns the Lagna (1st house) — always a functional benefic modifier`,
        90, 0.8, planet, 1,
      ));
    }

    return {
      planet,
      naturalNature:      natural,
      functionalNature,
      ownsHouses:         houses,
      ownsSigns:          signs,
      isYogakaraka,
      isMaraka:           ownsMaraka && !ownsTrikona,
      isBadhaka:          ownsBadhaka && !ownsTrikona,
      isKendradhipati:    ownsKendra && !ownsTrikona && isNaturalBenefic(planet),
      isTrikonadhipati:   ownsTrikona,
      isDusthanadhipati:  ownsDusthana,
      isFunctionalBenefic,
      isFunctionalMalefic,
      priorityScore:      Math.round(priorityScore),
      reasoning,
    };
  });
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
