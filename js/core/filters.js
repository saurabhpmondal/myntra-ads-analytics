const MONTH_ORDER = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

function norm(v) {
  return String(v || "").trim().toUpperCase();
}

function parseInputDate(v) {
  const s = String(v || "").trim();

  if (!s) return null;

  const d = new Date(s + "T00:00:00");
  return isNaN(d) ? null : d;
}

function rowDate(r) {
  const y = Number(r.year || 0);
  const m = Number(r.month || 0);
  const d = Number(r.day || 0);

  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d);
}

export function getYears(rows) {
  return [...new Set(
    rows.map(r => Number(r.year)).filter(Boolean)
  )].sort((a, b) => b - a);
}

export function getMonths(rows, year) {
  const nums = [...new Set(
    rows
      .filter(r => Number(r.year) === Number(year))
      .map(r => Number(r.month))
      .filter(Boolean)
  )];

  return nums.sort((a, b) => b - a);
}

export function applyFilters(rows, filter) {
  const start = parseInputDate(filter.start);
  const end = parseInputDate(filter.end);

  return rows.filter(r => {
    if (filter.year && Number(r.year) !== Number(filter.year)) {
      return false;
    }

    if (filter.month && Number(r.month) !== Number(filter.month)) {
      return false;
    }

    const dt = rowDate(r);

    if (start && dt && dt < start) {
      return false;
    }

    if (end && dt && dt > end) {
      return false;
    }

    return true;
  });
}