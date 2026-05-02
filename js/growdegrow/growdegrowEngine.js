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
    JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12
  };

  return map[s] || num(v);
}

export function buildGrowDegrow(salesRows, masterRows) {

  /* ---------- FILTER (SOURCE OF TRUTH) ---------- */
  const f = window.ACTIVE_FILTER || {};
  const year = Number(f.year);
  const month = Number(f.month);

  if (!year || !month) {
    return { rows: [], days: [] };
  }

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

  /* ---------- PIVOT ---------- */
  const map = {};
  let maxDay = 0;

  salesRows.forEach(r => {
    const y = num(r.year);
    const m = monthNum(r.month);
    const d = num(r.day);
    const style = txt(r.style_id);

    if (!style) return;
    if (y !== year || m !== month) return;

    const qty = num(r.qty || 1);

    if (!map[style]) {
      map[style] = {
        style_id: style,
        erp_sku: masterMap[style]?.erp_sku || "",
        status: masterMap[style]?.status || "",
        daily: {}
      };
    }

    map[style].daily[d] = (map[style].daily[d] || 0) + qty;

    if (d > maxDay) maxDay = d;
  });

  const rows = Object.values(map);

  /* ---------- FILL MISSING DAYS ---------- */
  rows.forEach(r => {
    for (let i = 1; i <= maxDay; i++) {
      if (!r.daily[i]) r.daily[i] = 0;
    }
  });

  /* ---------- SORT ---------- */
  rows.sort((a, b) => {
    const sumA = Object.values(a.daily).reduce((s, v) => s + v, 0);
    const sumB = Object.values(b.daily).reduce((s, v) => s + v, 0);
    return sumB - sumA;
  });

  const days = [];
  for (let i = 1; i <= maxDay; i++) days.push(i);

  return {
    rows,
    days
  };
}