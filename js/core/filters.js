export function getYears(rows) {
  return [...new Set(
    rows.map(r => r.year).filter(Boolean)
  )].sort((a, b) => b - a);
}

export function getMonths(rows, year) {
  return [...new Set(
    rows
      .filter(r => r.year === year)
      .map(r => r.month)
      .filter(Boolean)
  )].sort((a, b) => b - a);
}

export function applyFilters(rows, filter) {
  return rows.filter(r => {
    if (filter.year && r.year !== filter.year) {
      return false;
    }

    if (filter.month && r.month !== filter.month) {
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