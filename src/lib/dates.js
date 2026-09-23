// Dates are passed around as local "YYYY-MM-DD" strings. Weeks start on Sunday.

const WEEKDAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const toDateStr = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const parseDate = (ds) => {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => toDateStr(new Date());

export const weekdayKey = (date) => WEEKDAY_KEYS[date.getDay()];

// "YYYY-MM": day logs are stored one month per localStorage key.
export const monthKey = (ds) => ds.slice(0, 7);

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export const shiftDateStr = (ds, n) => toDateStr(addDays(parseDate(ds), n));

export const daysBetween = (fromDs, toDs) => Math.round((parseDate(toDs) - parseDate(fromDs)) / 864e5);

export function weekStartOf(ds) {
  const d = parseDate(ds);
  d.setDate(d.getDate() - d.getDay());
  return toDateStr(d);
}

// Which week a date falls in, and its index (0 = Sunday) within that week.
export function weekPosition(ds) {
  const start = weekStartOf(ds);
  return { start, index: daysBetween(start, ds) };
}

export const shortDate = (ds) =>
  parseDate(ds).toLocaleDateString(undefined, { month: "short", day: "numeric" });
