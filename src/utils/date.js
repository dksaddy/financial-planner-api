/**
 * Normalizes a value that may come back from `pg` as either a JS
 * Date object (pg's default parser for the `date` column type) or
 * an already-plain "YYYY-MM-DD" string (e.g. from a validated
 * request body), into a consistent "YYYY-MM-DD" string.
 *
 * Safe to call on either shape — use this anywhere a date coming
 * from the database is compared against or passed alongside a date
 * coming from user input, so the two never silently mismatch.
 */
export const toDateString = (value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
};