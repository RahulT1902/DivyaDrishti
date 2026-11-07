// Shared astrology lookups for the mobile screens. Tables and helpers mirror the
// web components (KundliPage, PlanetsDetailsPage, TransitsPage).

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const PLANET_NAMES_HI: Record<string, string> = {
  Lagna: 'लग्न', Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

export const ZODIAC_SIGNS_HI: Record<string, string> = {
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह', Virgo: 'कन्या',
  Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};

const STATUS_HI: Record<string, string> = {
  Retrograde: 'वक्री', Combust: 'अस्त', Exalted: 'उच्च', Debilitated: 'नीच', Dominant: 'बलवान',
  Strong: 'सुदृढ़', Neutral: 'सामान्य', Stable: 'स्थिर', Sensitive: 'संवेदनशील', Supportive: 'अनुकूल',
  Active: 'सक्रिय', Ascendant: 'लग्न', Vargottama: 'वर्गोत्तम', Antardasha: 'अंतर्दशा', Pratyantar: 'प्रत्यंतर',
};

export const PLANET_SYMBOLS: Record<string, string> = {
  Lagna: '✦', Sun: '☉', Moon: '☾', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const ABBR_HI: Record<string, string> = {
  Lagna: 'ल', Sun: 'सू', Moon: 'चं', Mars: 'मं', Mercury: 'बु',
  Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के',
};

export const SIGN_LORDS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
  Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

export const tPlanet = (name: string, isHindi: boolean) => (isHindi ? PLANET_NAMES_HI[name] || name : name);
export const tSign = (sign: string, isHindi: boolean) => (isHindi ? ZODIAC_SIGNS_HI[sign] || sign : sign);
export const tStatus = (status: string, isHindi: boolean) => (!status ? '' : isHindi ? STATUS_HI[status] || status : status);
export const planetAbbr = (name: string, isHindi: boolean) =>
  isHindi ? ABBR_HI[name] || name.slice(0, 2) : name === 'Lagna' ? 'La' : name.slice(0, 2);

export const getSignName = (signNum: number) => SIGNS[(((signNum - 1) % 12) + 12) % 12] || 'Aries';

/** Sidereal longitude → nakshatra name (27 equal divisions of 13°20'). */
export const nakshatraOf = (longitude: number) =>
  NAKSHATRAS[Math.min(26, Math.floor((((longitude % 360) + 360) % 360) / (360 / 27)))];

export const formatDegree = (longitude: number) => {
  const inSign = ((longitude % 30) + 30) % 30;
  const d = Math.floor(inSign);
  const m = Math.floor((inSign * 60) % 60);
  const s = Math.floor((inSign * 3600) % 60);
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
};

export interface DisplayPlanet {
  name: string;
  sign: string;
  house: number;
  status: string;
  degree: string;
  isRetrograde: boolean;
  isCombust: boolean;
}

/** Lagna + nine planets with whole-sign houses counted from the ascendant. */
export function buildDisplayPlanets(chart: any): DisplayPlanet[] {
  if (!chart?.planets || !chart?.lagna) return [];
  const lagnaSign = chart.lagna.sign;
  return [
    {
      name: 'Lagna',
      sign: getSignName(lagnaSign),
      house: 1,
      status: 'Ascendant',
      degree: formatDegree(chart.lagna.longitude),
      isRetrograde: false,
      isCombust: false,
    },
    ...chart.planets.map((p: any) => ({
      name: p.name,
      sign: getSignName(p.sign),
      house: ((p.sign - lagnaSign + 12) % 12) + 1,
      status: p.isRetrograde ? 'Retrograde' : p.isCombust ? 'Combust' : p.isVargottama ? 'Vargottama' : p.strengthLevel || '',
      degree: formatDegree(p.longitude),
      isRetrograde: !!p.isRetrograde,
      isCombust: !!p.isCombust,
    })),
  ];
}

export const formatMonthYear = (iso: string | undefined, isHindi: boolean) =>
  iso ? new Date(iso).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { month: 'short', year: 'numeric' }) : '';
