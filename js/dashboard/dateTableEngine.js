export function buildDateRows(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key = r.date || `${r.year}-${r.month}-${r.day}`;

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

  return [...map.values()].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}