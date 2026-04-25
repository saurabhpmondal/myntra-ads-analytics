const MONTH_ORDER = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

function norm(v) {
  return String(v || "").trim().toUpperCase();
}

function parseDate(v) {
  const s = String(v || "").trim();

  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00");
    return isNaN(d) ? null : d;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd)
    );
    return isNaN(d) ? null : d;
  }

  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("-");
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd)
    );
    return isNaN(d) ? null : d;
  }

  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function getYears(rows) {
  return [...new Set(
    rows.map(r => Number(r.year)).filter(Boolean)
  )].sort((a, b) => b - a);
}

export function getMonths(rows, year) {
  const months = [...new Set(
    rows
      .filter(r => Number(r.year) === Number(year))
      .map(r => norm(r.month))
      .filter(Boolean)
  )];

  return months.sort(
    (a, b) => MONTH_ORDER.indexOf(b) - MONTH_ORDER.indexOf(a)
  );
}

export function applyFilters(rows, filter) {
  const start = parseDate(filter.start);
  const end = parseDate(filter.end);

  return rows.filter(r => {
    if (filter.year && Number(r.year) !== Number(filter.year)) {
      return false;
    }

    if (filter.month && norm(r.month) !== norm(filter.month)) {
      return false;
    }

    const rowDate = parseDate(r.date);

    if (start && rowDate && rowDate < start) {
      return false;
    }

    if (end && rowDate && rowDate > end) {
      return false;
    }

    return true;
  });
}