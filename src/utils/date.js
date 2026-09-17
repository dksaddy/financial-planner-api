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
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return String(value).slice(0, 10);
};

/**
 * The Saturday-to-Friday week a date falls in, as a half-open
 * ["YYYY-MM-DD", "YYYY-MM-DD") range.
 *
 * Saturday is the week's first day throughout the app — `dashboard.repository`
 * spells the same shift in SQL for its current-week and last-four-weeks
 * queries, and this is its JS counterpart, so a week means one thing wherever
 * it is counted.
 *
 * Everything here is done in UTC. A "YYYY-MM-DD" is a calendar day with no
 * zone, so parsing it as local time would move it a day either side of
 * midnight for anyone east or west of UTC, and with it the week it lands in.
 */
export const weekRange = (value) => {
  const date = new Date(`${toDateString(value)}T00:00:00Z`);

  // getUTCDay is 0 for Sunday through 6 for Saturday, so this many days back
  // is the Saturday that opened the week: 0 from a Saturday, 1 from a Sunday,
  // 6 from a Friday.
  const sinceSaturday = (date.getUTCDay() + 1) % 7;

  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - sinceSaturday);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return [
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  ];
};
