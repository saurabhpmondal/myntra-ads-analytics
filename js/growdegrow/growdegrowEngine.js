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

function pad(n) {
  return String(n).padStart(2, "0");
}

function getDate(row) {
  const y = num(row.year);
  const m = monthNum(row.month);
  const d = num(row.date || row.day);

  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d);
}

function key(dt) {
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
}

export function buildGrowDegrow(salesRows, masterRows) {
  const masterMap = {};

  masterRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    masterMap[style] = {
      erp_sku: txt(r.erp_sku),
      status: txt(r.status)
    };
  });

  // detect latest date
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

  const map = {};

  salesRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    const dt = getDate(r);
    if (!dt) return;

    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();

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

    map[style].monthly[m] = (map[style].monthly[m] || 0) + qty;

    if (m === currentMonth) {
      map[style].daily[d] = (map[style].daily[d] || 0) + qty;
    }
  });

  const rows = Object.values(map);

  rows.forEach(r => {
    for (let d = 1; d <= lastDay; d++) {
      if (!r.daily[d]) r.daily[d] = 0;
    }
  });

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