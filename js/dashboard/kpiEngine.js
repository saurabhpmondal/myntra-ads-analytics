function sum(rows) {
  return rows.reduce((a, r) => {
    a.spend += Number(r.ad_spend || 0);
    a.impressions += Number(r.impressions || 0);
    a.clicks += Number(r.clicks || 0);
    a.units += Number(r.units_sold_total || 0);
    a.revenue += Number(r.total_revenue || 0);
    return a;
  }, {
    spend: 0,
    impressions: 0,
    clicks: 0,
    units: 0,
    revenue: 0
  });
}

function pct(curr, prev) {
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
}

export function buildKPI(rows, prevRows = []) {
  const now = sum(rows);
  const prev = sum(prevRows);

  now.roi = now.spend ? now.revenue / now.spend : 0;
  prev.roi = prev.spend ? prev.revenue / prev.spend : 0;

  now.delta = {
    spend: pct(now.spend, prev.spend),
    impressions: pct(now.impressions, prev.impressions),
    clicks: pct(now.clicks, prev.clicks),
    units: pct(now.units, prev.units),
    revenue: pct(now.revenue, prev.revenue),
    roi: now.roi - prev.roi
  };

  return now;
}