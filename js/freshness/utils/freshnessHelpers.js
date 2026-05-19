export function num(v) {

  return Number(
    String(v ?? "")
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

export function txt(v) {

  return String(v ?? "")
    .trim();
}

export function monthNum(v) {

  const s = txt(v).toUpperCase();

  const map = {

    JAN:1,
    FEB:2,
    MAR:3,
    APR:4,
    MAY:5,

    JUN:6,
    JUNE:6,

    JUL:7,
    JULY:7,

    AUG:8,

    SEP:9,
    SEPT:9,

    OCT:10,
    NOV:11,
    DEC:12
  };

  return map[s] || num(v);
}

export function createDate(
  year,
  month,
  day
) {

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
}

export function diffDays(
  currentDate,
  launchDate
) {

  const ms =
    currentDate - launchDate;

  return Math.floor(
    ms / (1000 * 60 * 60 * 24)
  );
}

export function passFilter(
  row,
  filter
) {

  const y = num(row.year);

  const m = monthNum(row.month);

  const d = num(
    row.date || row.day
  );

  if (
    filter.year &&
    y !== num(filter.year)
  ) {
    return false;
  }

  if (
    filter.month &&
    m !== num(filter.month)
  ) {
    return false;
  }

  if (filter.start) {

    const sd = Number(
      String(filter.start).slice(-2)
    );

    if (d < sd) {
      return false;
    }
  }

  if (filter.end) {

    const ed = Number(
      String(filter.end).slice(-2)
    );

    if (d > ed) {
      return false;
    }
  }

  return true;
}