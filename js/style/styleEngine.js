function cleanId(v) {
  return String(v ?? "")
    .trim()
    .replace(/\.0$/, "");
}

export function buildStyleReport(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key = cleanId(r.product_id);

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        spend: 0,
        impressions: 0,
        clicks: 0,
        units: 0,
        revenue: 0
      });
    }

    const x = map.get(key);

    x.spend += Number(r.budget_spend || 0);
    x.impressions += Number(r.impressions || 0);
    x.clicks += Number(r.clicks || 0);
    x.units += Number(r.units_sold_total || 0);
    x.revenue += Number(r.total_revenue || 0);
  });

  return [...map.values()]
    .filter(r => r.spend > 0)
    .sort((a, b) => b.spend - a.spend);
}