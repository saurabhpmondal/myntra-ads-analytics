function makeDateKey(r) {
  if (r.date && String(r.date).trim()) {
    return String(r.date).trim();
  }

  const y = Number(r.year) || 0;
  const m = Number(r.month) || 0;
  const d = Number(r.day) || 0;

  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function sortValue(v) {
  const txt = String(v);

  const p = txt.split("-");

  if (p.length === 3) {
    const y = Number(p[0]) || 0;
    const m = Number(p[1]) || 0;
    const d = Number(p[2]) || 0;

    return y * 10000 + m * 100 + d;
  }

  return txt;
}

export function buildDateRows(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key = makeDateKey(r);

    if (!map.has(key)) {
      map.set(key, {
        date: key,
        spend: 0,
        impressions: 0,
        clicks: 0,
        units: 0,
        revenue: 0
      });
    }

    const x = map.get(key);

    x.spend += r.ad_spend || 0;
    x.impressions += r.impressions || 0;
    x.clicks += r.clicks || 0;
    x.units += r.units_sold_total || 0;
    x.revenue += r.total_revenue || 0;
  });

  return [...map.values()].sort(
    (a, b) => sortValue(a.date) - sortValue(b.date)
  );
}