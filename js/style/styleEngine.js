export function buildStyleReport(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key = r.product_id || "Unknown";

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: r.product_name || "",
        brand: r.brand || "",
        spend: 0,
        impressions: 0,
        clicks: 0,
        units: 0,
        revenue: 0
      });
    }

    const x = map.get(key);

    x.spend += r.budget_spend || 0;
    x.impressions += r.impressions || 0;
    x.clicks += r.clicks || 0;
    x.units += r.units_sold_total || 0;
    x.revenue += r.total_revenue || 0;
  });

  return [...map.values()]
    .filter(r => r.spend > 0)
    .sort((a, b) => b.spend - a.spend);
}