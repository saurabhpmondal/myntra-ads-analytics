function txt(v) {
  return String(v ?? "").trim();
}

function num(v) {
  return Number(String(v ?? "").replace(/,/g, "").trim()) || 0;
}

function monthNum(v) {
  const s = txt(v).toUpperCase();

  const map = {
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,
    JUN:6,JUNE:6,JUL:7,JULY:7,
    AUG:8,SEP:9,SEPT:9,OCT:10,NOV:11,DEC:12
  };

  return map[s] || num(v);
}

/* ✅ STRICT DATE USING year + month + day */
function getDate(row) {
  const y = num(row.year);
  const m = monthNum(row.month);
  const d = num(row.day);

  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d);
}

export function buildGrowDegrow(salesRows, masterRows) {

  /* ---------- MASTER MAP ---------- */
  const masterMap = {};
  masterRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    masterMap[style] = {
      erp_sku: txt(r.erp_sku),
      status: txt(r.status)
    };
  });

  /* ---------- NORMALIZE SALES ---------- */
  const clean = [];

  salesRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    const dt = getDate(r);
    if (!dt) return;

    clean.push({
      style,
      qty: num(r.qty || 1),
      y: dt.getFullYear(),
      m: dt.getMonth() + 1,
      d: dt.getDate()
    });
  });

  if (!clean.length) {
    return { rows: [], days: [], months: [] };
  }

  /* ---------- FIND LATEST DATE ---------- */
  let latest = clean[0];

  clean.forEach(v => {
    if (
      v.y > latest.y ||
      (v.y === latest.y && v.m > latest.m) ||
      (v.y === latest.y && v.m === latest.m && v.d > latest.d)
    ) {
      latest = v;
    }
  });

  const currentMonth = latest.m;
  const currentYear = latest.y;

  const prev1 = currentMonth === 1 ? 12 : currentMonth - 1;
  const prev2 = currentMonth <= 2 ? 12 - (2 - currentMonth) : currentMonth - 2;

  const months = [prev2, prev1, currentMonth];
  const lastDay = latest.d;

  /* ---------- BUILD STYLE MAP ---------- */
  const map = {};

  clean.forEach(v => {
    if (v.y !== currentYear) return;
    if (!months.includes(v.m)) return;

    if (!map[v.style]) {
      map[v.style] = {
        style_id: v.style,
        erp_sku: masterMap[v.style]?.erp_sku || "",
        status: masterMap[v.style]?.status || "",
        monthly: {},
        daily: {}
      };
    }

    map[v.style].monthly[v.m] =
      (map[v.style].monthly[v.m] || 0) + v.qty;

    if (v.m === currentMonth) {
      map[v.style].daily[v.d] =
        (map[v.style].daily[v.d] || 0) + v.qty;
    }
  });

  const rows = Object.values(map);

  /* ---------- FILL MISSING DAYS ---------- */
  rows.forEach(r => {
    for (let d = 1; d <= lastDay; d++) {
      if (!r.daily[d]) r.daily[d] = 0;
    }
  });

  /* ---------- SORT ---------- */
  rows.sort((a, b) =>
    (b.monthly[currentMonth] || 0) - (a.monthly[currentMonth] || 0)
  );

  const days = [];
  for (let i = 1; i <= lastDay; i++) days.push(i);

  return {
    rows,
    days,
    months
  };
}