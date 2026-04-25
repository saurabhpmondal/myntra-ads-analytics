export function buildTrendRows(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key =
      r.date ||
      `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`;

    if (!map.has(key)) {
      map.set(key, {
        date: key,
        spend: 0,
        revenue: 0
      });
    }

    const x = map.get(key);

    x.spend += r.ad_spend || 0;
    x.revenue += r.total_revenue || 0;
  });

  return [...map.values()].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}

export function renderTrendChart(rows) {
  if (!rows.length) {
    return `<section class="card"><h3>Daily Spend vs Revenue</h3><div>No data</div></section>`;
  }

  const max = Math.max(
    ...rows.map(r => Math.max(r.spend, r.revenue)),
    1
  );

  const html = rows.map(r => {
    const spendH = (r.spend / max) * 140;
    const revH = (r.revenue / max) * 140;

    const label = String(r.date).slice(-2);

    return `
      <div class="bar-group">
        <div class="bar spend" style="height:${spendH}px"></div>
        <div class="bar revenue" style="height:${revH}px"></div>
        <small>${label}</small>
      </div>
    `;
  }).join("");

  return `
    <section class="card">
      <h3>Daily Spend vs Revenue</h3>
      <div class="chart-wrap">${html}</div>
      <div class="legend">
        <span><i class="lg spend"></i> Spend</span>
        <span><i class="lg revenue"></i> Revenue</span>
      </div>
    </section>
  `;
}