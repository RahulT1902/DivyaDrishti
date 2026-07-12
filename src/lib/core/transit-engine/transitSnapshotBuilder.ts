import { Constants } from "@fusionstrings/swisseph-wasi";
import { getEngine }  from "../../astrology/engine";
import { PlanetName, Sign } from "../types";
import { TransitSnapshot, TransitPlanetPosition } from "./types";

// Combustion orbs (degrees from the Sun) — standard Parashara values
const COMBUSTION_ORBS: Partial<Record<PlanetName, number>> = {
  Mercury: 14, Venus: 10, Mars: 17, Jupiter: 11, Saturn: 15, Moon: 12,
};

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const PLANET_IDS: Array<{ id: number; name: PlanetName }> = [
  { id: Constants.SE_SUN,       name: "Sun"     },
  { id: Constants.SE_MOON,      name: "Moon"    },
  { id: Constants.SE_MARS,      name: "Mars"    },
  { id: Constants.SE_MERCURY,   name: "Mercury" },
  { id: Constants.SE_JUPITER,   name: "Jupiter" },
  { id: Constants.SE_VENUS,     name: "Venus"   },
  { id: Constants.SE_SATURN,    name: "Saturn"  },
  { id: Constants.SE_MEAN_NODE, name: "Rahu"    },
];

// Computes planet positions for any calendar date (UTC noon).
// Uses Lahiri (Chitra-Paksha) ayanamsha — same as the natal chart engine.
// Returns a fully typed TransitSnapshot suitable for TransitAnalyzer.

export class TransitSnapshotBuilder {
  async build(date: Date): Promise<TransitSnapshot> {
    const eph = await getEngine();

    const year     = date.getUTCFullYear();
    const month    = date.getUTCMonth() + 1;
    const day      = date.getUTCDate();
    const utNoon   = 12.0;   // noon UTC — avoids date-boundary edge cases for daily transits

    const julDay = eph.swe_julday(year, month, day, utNoon, Constants.SE_GREG_CAL);
    eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);

    const flags    = Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;
    const rawData: Array<{ name: PlanetName; longitude: number; speed: number }> = [];

    for (const p of PLANET_IDS) {
      const { xx } = eph.swe_calc_ut(julDay, p.id, flags);
      rawData.push({ name: p.name, longitude: xx[0], speed: xx[3] });
    }

    // Ketu = Rahu + 180°
    const rahu = rawData.find(r => r.name === "Rahu")!;
    rawData.push({ name: "Ketu", longitude: (rahu.longitude + 180) % 360, speed: rahu.speed });

    // Resolve combustion against Sun longitude
    const sunLong = rawData.find(r => r.name === "Sun")!.longitude;

    const positions: TransitPlanetPosition[] = rawData.map(p => {
      const sign         = (Math.floor(p.longitude / 30) + 1) as Sign;
      const degreeInSign = p.longitude % 30;
      const isRetrograde = p.name !== "Sun" && p.name !== "Moon" && p.speed < 0;

      let isCombust = false;
      const orb = COMBUSTION_ORBS[p.name];
      if (orb !== undefined && p.name !== "Sun") {
        let diff = Math.abs(p.longitude - sunLong);
        if (diff > 180) diff = 360 - diff;
        isCombust = diff < orb;
      }

      return {
        planet:      p.name,
        longitude:   p.longitude,
        sign,
        signName:    SIGN_NAMES[sign - 1],
        degreeInSign,
        speed:       p.speed,
        isRetrograde,
        isCombust,
      };
    });

    const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return { date: iso, julDay, positions };
  }
}
