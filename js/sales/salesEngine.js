function num(v){
  return Number(String(v ?? "").replace(/,/g,"").trim()) || 0;
}

function txt(v){
  return String(v ?? "").trim();
}

function normMonth(v){
  const s = txt(v).toUpperCase();

  if (s === "JAN" || s === "JANUARY") return 1;
  if (s === "FEB" || s === "FEBRUARY") return 2;
  if (s === "MAR" || s === "MARCH") return 3;
  if (s === "APR" || s === "APRIL") return 4;
  if (s === "MAY") return 5;
  if (s === "JUN" || s === "JUNE") return 6;
  if (s === "JUL" || s === "JULY") return 7;
  if (s === "AUG" || s === "AUGUST") return 8;
  if (s === "SEP" || s === "SEPTEMBER") return 9;
  if (s === "OCT" || s === "OCTOBER") return 10;
  if (s === "NOV" || s === "NOVEMBER") return 11;
  if (s === "DEC" || s === "DECEMBER") return 12;

  return num(v);
}

function passFilter(row, filter){
  const y = num(row.year);
  const m = normMonth(row.month);
  const d = num(row.date || row.day);

  if (filter.year && y !== num(filter.year)) return false;
  if (filter.month && m !== num(filter.month)) return false;

  if (filter.start){
    const sd = Number(String(filter.start).slice(-2));
    if (d < sd) return false;
  }

  if (filter.end){
    const ed = Number(String(filter.end).slice(-2));
    if (d > ed) return false;
  }

  return true;
}