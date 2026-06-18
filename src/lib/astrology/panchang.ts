// ─── DivyaDrishti Panchang Engine ────────────────────────────────────────────
// Pure deterministic calculations. No I/O, no external APIs, no LLM.
// All positions are SIDEREAL (Lahiri / Chitra Paksha) from SwissEph.

const TITHI_NAMES = [
  // Shukla Paksha (1–15)
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
  // Krishna Paksha (16–30)
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya",
];

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
  "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
  "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
  "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Classical Vedic Rahu Kaal slot index (1–8) per weekday (JS: 0=Sun … 6=Sat)
const RAHU_KAAL_SLOT: Record<number, number> = {
  0: 8, // Sunday   → 8th segment
  1: 2, // Monday   → 2nd segment
  2: 7, // Tuesday  → 7th segment
  3: 5, // Wednesday→ 5th segment
  4: 6, // Thursday → 6th segment
  5: 4, // Friday   → 4th segment
  6: 3, // Saturday → 3rd segment
};

// ── Julian Day Number for a Gregorian calendar date ──────────────────────────
function julianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

// ── NOAA Solar Position Algorithm (simplified, pure JS) ──────────────────────
// Returns sunrise and sunset as UTC decimal hours for a given date & location.
function calcSunriseSunset(
  year: number,
  month: number,
  day: number,
  lat: number,
  lng: number,
): { sunrise: number; sunset: number } {
  const JD = julianDay(year, month, day);

  // Number of days since J2000.0 (+0.0008 corrects for solar noon)
  const n = JD - 2451545.0 + 0.0008;

  // Mean solar noon at longitude
  const J_star = n - lng / 360;

  // Solar mean anomaly (degrees), normalized 0–360
  const M_deg = ((357.5291 + 0.98560028 * J_star) % 360 + 360) % 360;
  const M_rad = (M_deg * Math.PI) / 180;

  // Equation of center
  const C =
    1.9148 * Math.sin(M_rad) +
    0.02 * Math.sin(2 * M_rad) +
    0.0003 * Math.sin(3 * M_rad);

  // Ecliptic longitude, normalized 0–360
  const lambda_deg = ((M_deg + C + 180 + 102.9372) % 360 + 360) % 360;
  const lambda_rad = (lambda_deg * Math.PI) / 180;

  // Julian date of solar transit (solar noon)
  const J_transit =
    2451545.0 +
    J_star +
    0.0053 * Math.sin(M_rad) -
    0.0069 * Math.sin(2 * lambda_rad);

  // Sun's declination
  const sin_delta = Math.sin(lambda_rad) * Math.sin((23.4397 * Math.PI) / 180);
  const delta_rad = Math.asin(sin_delta);

  // Hour angle at sunrise/sunset (−0.8333° accounts for refraction + solar disc)
  const lat_rad = (lat * Math.PI) / 180;
  const cos_omega =
    (Math.sin((-0.8333 * Math.PI) / 180) -
      Math.sin(lat_rad) * sin_delta) /
    (Math.cos(lat_rad) * Math.cos(delta_rad));

  // Polar edge-case handling
  if (cos_omega < -1) return { sunrise: 0, sunset: 24 };   // Midnight sun
  if (cos_omega > 1)  return { sunrise: 6, sunset: 18 };   // No sunrise → fallback

  const omega_deg = (Math.acos(cos_omega) * 180) / Math.PI;

  const J_rise = J_transit - omega_deg / 360;
  const J_set  = J_transit + omega_deg / 360;

  // Julian fraction → UTC decimal hours: (frac × 24 + 12) % 24
  const toUtcHours = (jd: number) => (((jd % 1) * 24 + 12) % 24 + 24) % 24;

  return { sunrise: toUtcHours(J_rise), sunset: toUtcHours(J_set) };
}

// ── Format UTC decimal hours → local "h:MM AM/PM" in a given timezone ────────
function formatLocalTime(utcDecimalHours: number, timezone: string): string {
  const totalMinutes = Math.round(((utcDecimalHours % 24) + 24) % 24 * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;

  const now = new Date();
  const ref = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0),
  );

  return ref.toLocaleTimeString("en-IN", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Yogas list ────────────────────────────────────────────────────────────────
const YOGA_NAMES = [
  "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shula", "Ganda", "Vridhi", "Dhruva", "Vyaghata",
  "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
  "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

// ── Karanas list ─────────────────────────────────────────────────────────────
const KARANA_NAMES = [
  "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti",
  "Shakuni", "Chatushpada", "Naga", "Kimstughna"
];

function getKaranaName(index: number): string {
  if (index === 0) return "Kimstughna";
  if (index >= 57) return ["Shakuni", "Chatushpada", "Naga"][index - 57];
  return KARANA_NAMES[(index - 1) % 7];
}

const VARA_NAMES_SANSKRIT = [
  "Ravivara",   // Sunday
  "Somavara",   // Monday
  "Mangalavara",// Tuesday
  "Budhavara",  // Wednesday
  "Guruvara",   // Thursday
  "Shukravara", // Friday
  "Shanivara",  // Saturday
];

// ── Public types ──────────────────────────────────────────────────────────────
export interface PanchangInput {
  /** Sidereal Sun longitude in degrees (from SwissEph Lahiri) */
  sunLongitude: number;
  /** Sidereal Moon longitude in degrees (from SwissEph Lahiri) */
  moonLongitude: number;
  /** Today's date in the user's local timezone, "YYYY-MM-DD" */
  date: string;
  /** Birth latitude */
  lat: number;
  /** Birth longitude */
  lng: number;
  /** IANA timezone string, e.g. "Asia/Kolkata" */
  timezone: string;
}

export interface PanchangResult {
  tithi: string;
  paksha: "Shukla" | "Krishna";
  nakshatra: string;
  moonSign: string;
  rahuKaal: { start: string; end: string };
  yoga: string;
  karana: string;
  sanskritDate: string;
  abhijitKaal: { start: string; end: string };
  vara: string;
}

// ── Main computation function ─────────────────────────────────────────────────
export function computePanchang(input: PanchangInput): PanchangResult {
  const { sunLongitude, moonLongitude, date, lat, lng, timezone } = input;

  // ── 1. Tithi ────────────────────────────────────────────────────────────────
  // Normalize Sun–Moon angle to [0, 360), divide by 12° per tithi
  const angleDiff = ((moonLongitude - sunLongitude) % 360 + 360) % 360;
  const tithiIndex = Math.floor(angleDiff / 12); // 0–29
  const tithi = TITHI_NAMES[tithiIndex] ?? "Pratipada";
  const paksha: "Shukla" | "Krishna" = tithiIndex < 15 ? "Shukla" : "Krishna";
  const sanskritDate = `${paksha} ${tithi}`;

  // ── 2. Nakshatra ────────────────────────────────────────────────────────────
  // Each nakshatra = 360/27 = 13.3333...° of sidereal Moon longitude
  const NAKSHATRA_SPAN = 360 / 27; // 13.333...
  const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN) % 27;
  const nakshatra = NAKSHATRA_NAMES[nakshatraIndex] ?? "Ashwini";

  // ── 3. Moon Sign ────────────────────────────────────────────────────────────
  const moonSignIndex = Math.floor(moonLongitude / 30) % 12;
  const moonSign = SIGN_NAMES[moonSignIndex] ?? "Aries";

  // ── 4. Yoga ─────────────────────────────────────────────────────────────────
  const yogaIndex = Math.floor(((sunLongitude + moonLongitude) % 360) / (360 / 27)) % 27;
  const yoga = YOGA_NAMES[yogaIndex] ?? "Siddha";

  // ── 5. Karana ───────────────────────────────────────────────────────────────
  const karanaIndex = Math.floor(angleDiff / 6) % 60;
  const karana = getKaranaName(karanaIndex);

  // ── 6. Weekday & Sanskrit Vara ──────────────────────────────────────────────
  const [year, month, day] = date.split("-").map(Number);
  const { sunrise, sunset } = calcSunriseSunset(year, month, day, lat, lng);

  const middayUtc = new Date(`${date}T12:00:00Z`);
  const weekday = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" })
      .format(middayUtc)
      .replace(/Sun/,"0").replace(/Mon/,"1").replace(/Tue/,"2")
      .replace(/Wed/,"3").replace(/Thu/,"4").replace(/Fri/,"5").replace(/Sat/,"6")
  );
  const vara = VARA_NAMES_SANSKRIT[weekday] ?? "Somavara";

  // ── 7. Rahu Kaal ────────────────────────────────────────────────────────────
  const slotIndex = RAHU_KAAL_SLOT[weekday] ?? 8;
  const daylightHours = ((sunset - sunrise) + 24) % 24;
  const segmentSize = daylightHours / 8;

  const rahuStartUtc = sunrise + (slotIndex - 1) * segmentSize;
  const rahuEndUtc = rahuStartUtc + segmentSize;

  // ── 8. Abhijit Kaal (8th Muhurta of the day: centered around solar noon) ─────
  const abhijitSegmentSize = daylightHours / 15;
  const abhijitStartUtc = sunrise + 7 * abhijitSegmentSize;
  const abhijitEndUtc = sunrise + 8 * abhijitSegmentSize;

  return {
    tithi,
    paksha,
    nakshatra,
    moonSign,
    yoga,
    karana,
    sanskritDate,
    vara,
    rahuKaal: {
      start: formatLocalTime(rahuStartUtc, timezone),
      end:   formatLocalTime(rahuEndUtc,   timezone),
    },
    abhijitKaal: {
      start: formatLocalTime(abhijitStartUtc, timezone),
      end:   formatLocalTime(abhijitEndUtc,   timezone),
    },
  };
}
