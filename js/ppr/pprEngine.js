const ORDER = [
  "Top of Search",
  "Rest of Search",
  "Top of PDP",
  "Rest of PDP",
  "Top of Home",
  "Rest of Home"
];

function base() {
  return {
    spend: 0,
    impressions: 0,
    clicks: 0,
    units: 0,
    revenue: 0
  };
}

export function buildPPRReport(rows) {
  const placements = new Map();

  ORDER.forEach(name => {
    placements.set(name, {
      name,
      ...base(),
      children: new Map()
    });
  });

  rows.forEach(r => {
    const p = r.placement || "Unknown";

    if (!placements.has(p)) {
      placements.set(p, {
        name: p,
        ...base(),
        children: new Map()
      });
    }

    const row = placements.get(p);

    row.spend += Number(r.budget_spend || 0);
    row.impressions += Number(r.impressions || 0);
    row.clicks += Number(r.clicks || 0);
    row.units += Number(r.units_sold_total || 0);
    row.revenue += Number(r.total_revenue || 0);

    const key = r.adgroup_name || "Unknown";

    if (!row.children.has(key)) {
      row.children.set(key, {
        name: key,
        ...base()
      });
    }

    const c = row.children.get(key);

    c.spend += Number(r.budget_spend || 0);
    c.impressions += Number(r.impressions || 0);
    c.clicks += Number(r.clicks || 0);
    c.units += Number(r.units_sold_total || 0);
    c.revenue += Number(r.total_revenue || 0);
  });

  return [...placements.values()].map(r => ({
    ...r,
    children: [...r.children.values()].sort((a,b) => b.spend - a.spend)
  }));
}