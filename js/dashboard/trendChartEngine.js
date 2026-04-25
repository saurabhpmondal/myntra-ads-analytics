export function buildTrendRows(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key = r.date;

    if (!map.has(key)) {
      map.set(key, {
        date: key,
        spend: 0,
        revenue: 0
      });
    }

    const x = map.get(key);
    x.spend += r.ad_spend;
    x.revenue += r.total_revenue;
  });

  return [...map.values()].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}

export function renderTrendChart(rows) {
  if (!rows.length) {
    return `<div class="card">No chart data available</div>`;
  }

  const max = Math.max(
    ...rows.map(r => Math.max(r.spend, r.revenue)),
    1
  );

  const bars = rows.map(r => {
    const spendH = (r.spend / max) * 140;
    const revH = (r.revenue / max) * 140;

    return `
      <div class="bar-group">
        <div class="bar spend" style="height:${spendH}px"></div>
        <div class="bar revenue" style="height:${revH}px"></div>
        <small>${r.date.slice(-2)}</small>
      </div>
    `;
  }).join("");

  return `
    <section class="card">
      <h3>Daily Spend vs Revenue</h3>
      <div class="chart-wrap">
        ${bars}
      </div>
      <div class="legend">
        <span><i class="lg spend"></i> Spend</span>
        <span><i class="lg revenue"></i> Revenue</span>
      </div>
    </section>
  `;
}