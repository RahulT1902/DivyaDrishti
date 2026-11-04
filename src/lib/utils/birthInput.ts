/**
 * Validate birth details before they are saved.
 *
 * `new Date("2025-02-31")` silently rolls over to 3 March, so a bad date from
 * any client would be stored and cast as a different day's chart. Returns an
 * error message, or null when the input is valid.
 */
export function validateBirthInput(
  dateStr: unknown,
  time: unknown,
  latitude: number,
  longitude: number,
): string | null {
  const dateMatch = typeof dateStr === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr) : null;
  if (!dateMatch) return "Date of birth must be in YYYY-MM-DD format.";

  const [y, m, d] = dateMatch.slice(1).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return "Date of birth is not a real calendar date.";
  }
  if (date.getTime() > Date.now()) return "Date of birth cannot be in the future.";

  const timeMatch = typeof time === "string" ? /^(\d{2}):(\d{2})$/.exec(time) : null;
  if (!timeMatch || Number(timeMatch[1]) > 23 || Number(timeMatch[2]) > 59) {
    return "Time of birth must be in 24-hour HH:mm format.";
  }

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return "Birth place coordinates are invalid.";
  }

  return null;
}
