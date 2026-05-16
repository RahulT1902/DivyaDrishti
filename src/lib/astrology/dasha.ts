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
 * Sub-divide an Antardasha into 9 Pratyantardashas
 */
export function buildPratyantardasha(ad: Period): Period[] {
  const adTotalMs = ad.end.getTime() - ad.start.getTime();
  const pds: Period[] = [];
  let cursor = new Date(ad.start);

  // PD sequence starts with the AD lord itself
  const startIndex = DASHA_SEQUENCE.indexOf(ad.planet as any);
  for (let i = 0; i < 9; i++) {
    const p = DASHA_SEQUENCE[(startIndex + i) % 9];
    const fraction = DASHA_YEARS[p] / 120; // AD * PD / 120
    const durMs = adTotalMs * fraction;
    const end = new Date(cursor.getTime() + durMs);
    pds.push({ planet: p, start: cursor, end });
    cursor = new Date(end);
  }

  return pds;
}

/**
 * Identify the current Dasha phase (MD, AD, PD) for a given date
 */
export function getCurrentDasha(timeline: Period[], now: Date) {
  const md = timeline.find(p => now >= p.start && now < p.end);
  if (!md) return null;

  const ads = buildAntardasha(md);
  const ad = ads.find(p => now >= p.start && now < p.end);
  if (!ad) return { md, ad: null, pd: null, nextAd: null };

  const pds = buildPratyantardasha(ad);
  const pd = pds.find(p => now >= p.start && now < p.end);
  
  // Find "Next" Antardasha
  const adIndex = ads.findIndex(p => p === ad);
  const nextAd = ads[adIndex + 1] || null;

  return { md, ad, pd, nextAd };
}

/**
 * Get full context for a specific date (supports Hysteresis and Benchmark requirements)
 */
export function getDashaContext(timeline: Period[], targetDate: Date) {
  const dasha = getCurrentDasha(timeline, targetDate);
  if (!dasha) return null;

  const { md, ad, pd, nextAd } = dasha;

  // Time Pressure Logic
  const totalMs = ad.end.getTime() - ad.start.getTime();
  const elapsedMs = targetDate.getTime() - ad.start.getTime();
  const remainingMs = ad.end.getTime() - targetDate.getTime();
  const progress = elapsedMs / totalMs;

  const monthsRemaining = Math.floor(remainingMs / (30.44 * 24 * 60 * 60 * 1000));
  const yearsRemaining = Math.floor(monthsRemaining / 12);
  const remStr = yearsRemaining > 0 
    ? `${yearsRemaining}y ${monthsRemaining % 12}m` 
    : `${monthsRemaining}m`;

  let pressureLabel = "Standard";
  if (progress > 0.85) pressureLabel = "Short";
  else if (progress > 0.4) pressureLabel = "Medium";
  else pressureLabel = "Long";

  return {
    stack: {
      mahadasha: md.planet,
      antardasha: ad.planet,
      pratyantar: pd?.planet || null,
      nextAntardasha: nextAd?.planet || null
    },
    timing: {
      startsAt: ad.start,
      endsAt: ad.end,
      remaining: remStr,
      pressure: pressureLabel,
      isNearBoundary: progress > 0.9
    }
  };
}

/**
 * Precision date arithmetic using Tropical Year average (365.2425 days)
 */
function addYears(d: Date, years: number): Date {
  const ms = years * 365.2425 * 24 * 60 * 60 * 1000;
  return new Date(d.getTime() + ms);
}
