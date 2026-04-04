/**
 * Vimshottari Dasha Engine
 * 120-year cycle based on Moon Nakshatra at birth.
 */

export const DASHA_SEQUENCE = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", 
  "Rahu", "Jupiter", "Saturn", "Mercury"
] as const;

export const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

export const NAKSHATRA_SPAN = 13 + 20/60; // 13.333333... degrees

export interface Period {
  planet: string;
  start: Date;
  end: Date;
}

/**
 * Get Nakshatra index (0-26), Lord, and Progress (0-1)
 */
export function getNakshatra(moonDeg: number) {
  const index = Math.floor(moonDeg / NAKSHATRA_SPAN);
  const lord = DASHA_SEQUENCE[index % 9];
  const startDeg = index * NAKSHATRA_SPAN;
  const progressDeg = moonDeg - startDeg;
  const progress = progressDeg / NAKSHATRA_SPAN;
  return { index, lord, progress };
}

/**
 * Calculate Remaining Years of the starting Dasha at birth
 */
export function getBalanceYears(lord: string, progress: number) {
  const total = DASHA_YEARS[lord];
  const remainingFraction = 1 - progress; // portion of the nakshatra left
  return remainingFraction * total;
}

/**
 * Build the 120-year Mahadasha Timeline
 */
export function buildMahadashaTimeline(birth: Date, startLord: string, balanceYears: number): Period[] {
  const periods: Period[] = [];
  let cursor = new Date(birth);

  // 1. Initial (Partial) Mahadasha
  const firstEnd = addYears(cursor, balanceYears);
  periods.push({ planet: startLord, start: cursor, end: firstEnd });
  cursor = new Date(firstEnd);

  // 2. Continuous Full Cycle
  const startIndex = DASHA_SEQUENCE.indexOf(startLord as any);
  for (let i = 1; i < 9; i++) {
    const p = DASHA_SEQUENCE[(startIndex + i) % 9];
    const yrs = DASHA_YEARS[p];
    const end = addYears(cursor, yrs);
    periods.push({ planet: p, start: cursor, end });
    cursor = new Date(end);
  }

  return periods;
}

/**
 * Sub-divide a Mahadasha into 9 Antardashas
 */
export function buildAntardasha(md: Period): Period[] {
  const mdTotalMs = md.end.getTime() - md.start.getTime();
  const ads: Period[] = [];
  let cursor = new Date(md.start);

  // AD sequence starts with the MD lord itself
  const startIndex = DASHA_SEQUENCE.indexOf(md.planet as any);
  for (let i = 0; i < 9; i++) {
    const p = DASHA_SEQUENCE[(startIndex + i) % 9];
    const fraction = DASHA_YEARS[p] / 120; // MD * AD / 120
    const durMs = mdTotalMs * fraction;
    const end = new Date(cursor.getTime() + durMs);
    ads.push({ planet: p, start: cursor, end });
    cursor = new Date(end);
  }

  return ads;
}

/**
 * Identify the current Dasha phase for a given date
 */
export function getCurrentDasha(timeline: Period[], now: Date) {
  const md = timeline.find(p => now >= p.start && now < p.end);
  if (!md) return null;

  const ads = buildAntardasha(md);
  const ad = ads.find(p => now >= p.start && now < p.end);
  
  // Find "Next" Antardasha
  const adIndex = ads.findIndex(p => p === ad);
  const nextAd = ads[adIndex + 1] || null;

  return { md, ad, nextAd };
}

/**
 * Precision date arithmetic using Tropical Year average (365.2425 days)
 */
function addYears(d: Date, years: number): Date {
  const ms = years * 365.2425 * 24 * 60 * 60 * 1000;
  return new Date(d.getTime() + ms);
}
