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

/* ✅ STRONG DATE PARSER */
function getDate(row) {
  // PRIMARY → created (dd-mm-yyyy)
  if (row.created) {
    const parts = String(row.created).split("-");
    if (parts.length === 3) {
      const d = Number(parts[0]);
      const m = Number(parts[1]);
      const y = Number(parts[2]);
      if (y && m && d) return new Date(y, m - 1, d);
    }
  }

  // FALLBACK → year/month/day
  const y = num(row.year);
  const m = monthNum(row.month);
  const d = num(row.day);

  if (y && m && d) return new Date(y, m - 1, d);

  return null;
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

  /* ---------- FIND LATEST DATE ---------- */
  let latest = null;

  salesRows.forEach(r => {
    const dt = getDate(r);
    if (!dt) return;

    if (!latest || dt > latest) latest = dt;
  });

  if (!latest) {
    return { rows: [], days: [], months: [] };
  }

  const currentMonth = latest.getMonth() + 1;
  const currentYear = latest.getFullYear();

  const prev1 = currentMonth === 1 ? 12 : currentMonth - 1;
  const prev2 = currentMonth <= 2 ? 12 - (2 - currentMonth) : currentMonth - 2;

  const months = [prev2, prev1, currentMonth];

  const lastDay = latest.getDate();

  /* ---------- BUILD DATA ---------- */
  const map = {};

  salesRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    const dt = getDate(r);
    if (!dt) return;

    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();

    // ONLY current year + last 3 months
    if (y !== currentYear) return;
    if (!months.includes(m)) return;

    if (!map[style]) {
      map[style] = {
        style_id: style,
        erp_sku: masterMap[style]?.erp_sku || "",
        status: masterMap[style]?.status || "",
        monthly: {},
        daily: {}
      };
    }

    const qty = num(r.qty || 1);

    // monthly
    map[style].monthly[m] = (map[style].monthly[m] || 0) + qty;

    // daily (only current month)
    if (m === currentMonth) {
      map[style].daily[d] = (map[style].daily[d] || 0) + qty;
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