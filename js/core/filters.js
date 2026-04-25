const MONTH_ORDER = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

function norm(v) {
  return String(v || "").trim().toUpperCase();
}

export function getYears(rows) {
  return [...new Set(
    rows.map(r => r.year).filter(Boolean)
  )].sort((a, b) => b - a);
}

export function getMonths(rows, year) {
  const months = [...new Set(
    rows
      .filter(r => r.year === year)
      .map(r => norm(r.month))
      .filter(Boolean)
  )];

  return months.sort(
    (a, b) => MONTH_ORDER.indexOf(b) - MONTH_ORDER.indexOf(a)
  );
}

export function applyFilters(rows, filter) {
  return rows.filter(r => {
    if (filter.year && r.year !== filter.year) {
      return false;
    }

    if (filter.month && norm(r.month) !== norm(filter.month)) {
      return false;
    }

    if (filter.start && r.date < filter.start) {
      return false;
    }

    if (filter.end && r.date > filter.end) {
      return false;
    }

    return true;
  });
}