import { Sign, ChartType } from "../types";

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Wrap any integer into Sign (1–12)
function toSign(n: number): Sign {
  return (((n - 1) % 12) + 12) % 12 + 1 as Sign;
}

function isOdd(sign: Sign): boolean  { return sign % 2 === 1; }
function isMovable(s: Sign): boolean { return [1, 4, 7, 10].includes(s); }
function isFixed(s: Sign): boolean   { return [2, 5, 8, 11].includes(s); }
function isFire(s: Sign): boolean    { return [1, 5, 9].includes(s); }
function isEarth(s: Sign): boolean   { return [2, 6, 10].includes(s); }
function isAir(s: Sign): boolean     { return [3, 7, 11].includes(s); }
function isWater(s: Sign): boolean   { return [4, 8, 12].includes(s); }

// Core formula: pada (0-indexed division) + starting sign → divisional sign
function pada(degInSign: number, divisor: number): number {
  return Math.floor(degInSign / (30 / divisor));
}

export function computeDivisionalSign(longitude: number, chartType: ChartType): Sign {
  const sign = Math.floor(longitude / 30) + 1 as Sign;
  const deg  = longitude % 30;

  switch (chartType) {
    case "D1":
      return sign;

    case "D2": {
      // Hora: odd signs → first 15°=Leo, second 15°=Cancer; even signs → reversed
      const half = Math.floor(deg / 15);
      return isOdd(sign)
        ? (half === 0 ? 5 : 4)   // Leo, Cancer
        : (half === 0 ? 4 : 5);  // Cancer, Leo
    }

    case "D3": {
      // Drekkana: 0–10°=same, 10–20°=5th, 20–30°=9th (element triplicity)
      const offsets = [0, 4, 8];
      return toSign(sign + offsets[pada(deg, 3)]);
    }

    case "D4": {
      // Chaturthamsha: each 7.5° adds 3 signs from same sign
      return toSign(sign + pada(deg, 4) * 3);
    }

    case "D6": {
      // Shashthamsha: odd starts Aries, even starts Libra
      const start: Sign = isOdd(sign) ? 1 : 7;
      return toSign(start + pada(deg, 6));
    }

    case "D7": {
      // Saptamsha: odd starts from same sign, even from 7th
      const start: Sign = isOdd(sign) ? sign : toSign(sign + 6);
      return toSign(start + pada(deg, 7));
    }

    case "D9": {
      // Navamsha: fire→Aries, earth→Capricorn, air→Libra, water→Cancer
      const starts: [boolean, Sign][] = [
        [isFire(sign),  1],
        [isEarth(sign), 10],
        [isAir(sign),   7],
        [isWater(sign), 4],
      ];
      const start = starts.find(([cond]) => cond)![1];
      return toSign(start + pada(deg, 9));
    }

    case "D10": {
      // Dasamsha: odd starts from same sign, even from 9th
      const start: Sign = isOdd(sign) ? sign : toSign(sign + 8);
      return toSign(start + pada(deg, 10));
    }

    case "D12": {
      // Dwadashamsha: all signs count from same sign
      return toSign(sign + pada(deg, 12));
    }

    case "D16": {
      // Shodashamsha: movable→Aries, fixed→Leo, dual→Sagittarius
      const start: Sign = isMovable(sign) ? 1 : isFixed(sign) ? 5 : 9;
      return toSign(start + pada(deg, 16));
    }

    case "D20": {
      // Vimshamsha: same rule as D16
      const start: Sign = isMovable(sign) ? 1 : isFixed(sign) ? 5 : 9;
      return toSign(start + pada(deg, 20));
    }

    case "D24": {
      // Siddhamsha: odd→Leo, even→Cancer
      const start: Sign = isOdd(sign) ? 5 : 4;
      return toSign(start + pada(deg, 24));
    }

    case "D27": {
      // Bhamsha: fire→Aries, earth→Cancer, air→Libra, water→Capricorn
      const starts: [boolean, Sign][] = [
        [isFire(sign),  1],
        [isEarth(sign), 4],
        [isAir(sign),   7],
        [isWater(sign), 10],
      ];
      const start = starts.find(([cond]) => cond)![1];
      return toSign(start + pada(deg, 27));
    }

    case "D30":
      // Trimshamsha: traditional unequal divisions (planetary rulers)
      return computeD30(sign, deg);

    case "D40": {
      // Khavedamsha: odd→Aries, even→Libra
      const start: Sign = isOdd(sign) ? 1 : 7;
      return toSign(start + pada(deg, 40));
    }

    case "D45": {
      // Akshavedamsha: fire→Aries, earth→Cancer, air→Libra, water→Capricorn
      const starts: [boolean, Sign][] = [
        [isFire(sign),  1],
        [isEarth(sign), 4],
        [isAir(sign),   7],
        [isWater(sign), 10],
      ];
      const start = starts.find(([cond]) => cond)![1];
      return toSign(start + pada(deg, 45));
    }

    case "D60": {
      // Shastiamsha: odd→Aries, even→Libra
      const start: Sign = isOdd(sign) ? 1 : 7;
      return toSign(start + pada(deg, 60));
    }
  }
}

// Traditional Trimshamsha uses unequal planetary divisions
function computeD30(sign: Sign, deg: number): Sign {
  if (isOdd(sign)) {
    // Mars 0–5°, Saturn 5–10°, Jupiter 10–18°, Mercury 18–25°, Venus 25–30°
    if (deg < 5)  return 1;   // Aries  (Mars)
    if (deg < 10) return 11;  // Aquarius (Saturn)
    if (deg < 18) return 9;   // Sagittarius (Jupiter)
    if (deg < 25) return 3;   // Gemini (Mercury)
    return 2;                  // Taurus (Venus)
  } else {
    // Venus 0–5°, Mercury 5–12°, Jupiter 12–20°, Saturn 20–25°, Mars 25–30°
    if (deg < 5)  return 2;   // Taurus (Venus)
    if (deg < 12) return 6;   // Virgo (Mercury)
    if (deg < 20) return 12;  // Pisces (Jupiter)
    if (deg < 25) return 10;  // Capricorn (Saturn)
    return 8;                  // Scorpio (Mars)
  }
}

export function getSignName(sign: Sign): string {
  return SIGN_NAMES[sign - 1];
}
