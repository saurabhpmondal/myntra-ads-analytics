// FILE: js/dashboard/dashboardPage.js

/* ---------------------------------- */
/* RENDER LIVE DASHBOARD */
/* ---------------------------------- */

export function renderDashboard(rows = []) {

  const page = document.querySelector(".page-wrap");

  if (!page) return;

  const kpi = buildKPI(rows);
  const daily = buildDaily(rows);

  page.innerHTML = `
    <!-- KPI -->
    <section class="cards-grid">

      ${card("Spend", money(kpi.spend), true)}
      ${card("Impressions", fmt(kpi.impressions))}
      ${card("Clicks", fmt(kpi.clicks))}
      ${card("Units Sold", fmt(kpi.units))}
      ${card("Revenue", money(kpi.revenue))}
      ${card("ROI", kpi.roi.toFixed(2))}

    </section>

    <!-- Trend -->
    <section class="panel-card">
      <div class="panel-head">
        <h3>Daily Trend - Spend vs Revenue</h3>
      </div>

      ${trendBlock(daily)}
    </section>

    <!-- Daily Table -->
    <section class="panel-card">
      <div class="panel-head">
        <h3>Daily Spend Summary</h3>
      </div>

      ${dailyTable(daily)}
    </section>

    <!-- Raw Detail -->
    <section class="panel-card">
      <div class="panel-head">
        <h3>Campaign Detail (Top 20 Rows)</h3>
      </div>

      ${detailTable(rows)}
    </section>
  `;
}

/* ---------------------------------- */
/* KPI */
/* ---------------------------------- */

function buildKPI(rows = []) {

  let spend = 0;
  let impressions = 0;
  let clicks = 0;
  let units = 0;
  let revenue = 0;

  rows.forEach(r => {

    spend += num(r.ad_spend);
    impressions += num(r.impressions);
    clicks += num(r.clicks);
    units += num(r.units_sold_total);
    revenue += num(r.total_revenue);
  });

  return {
    spend,
    impressions,
    clicks,
    units,
    revenue,
    roi: spend ? revenue / spend : 0
  };
}

/* ---------------------------------- */
/* DAILY GROUP */
/* 1 date = 1 row
/* ---------------------------------- */

function buildDaily(rows = []) {

  const map = {};

  rows.forEach(r => {

    const d = r.date || "NA";

    if (!map[d]) {
      map[d] = {
        date: d,
        spend: 0,
        impressions: 0,
        clicks: 0,
        units: 0,
        revenue: 0
      };
    }

    map[d].spend += num(r.ad_spend);
    map[d].impressions += num(r.impressions);
    map[d].clicks += num(r.clicks);
    map[d].units += num(r.units_sold_total);
    map[d].revenue += num(r.total_revenue);
  });

  return Object.values(map).sort((a,b)=>
    a.date.localeCompare(b.date)
  );
}

/* ---------------------------------- */
/* TREND BLOCK */
/* ---------------------------------- */

function trendBlock(rows = []) {

  if (!rows.length) return empty("No trend data");

  const latest = rows.slice(-10);

  return `
    <div style="display:grid;gap:10px;">
      ${latest.map(r => `
        <div style="
          display:grid;
          grid-template-columns:120px 1fr 1fr;
          gap:12px;
          font-size:14px;
        ">
          <div><b>${r.date}</b></div>
          <div>Spend: ${money(r.spend)}</div>
          <div>Revenue: ${money(r.revenue)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

/* ---------------------------------- */
/* DAILY TABLE */
/* ---------------------------------- */

function dailyTable(rows = []) {

  if (!rows.length) return empty("No rows");

  return `
    <div style="overflow:auto;">
      <table style="width:100%;min-width:1000px;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Spend</th>
            <th>Impressions</th>
            <th>Clicks</th>
            <th>CTR</th>
            <th>Units</th>
            <th>Revenue</th>
            <th>ROI</th>
          </tr>
        </thead>

        <tbody>

          ${rows.map(r => `
            <tr>
              <td>${r.date}</td>
              <td>${money(r.spend)}</td>
              <td>${fmt(r.impressions)}</td>
              <td>${fmt(r.clicks)}</td>
              <td>${pct(r.clicks, r.impressions)}</td>
              <td>${fmt(r.units)}</td>
              <td>${money(r.revenue)}</td>
              <td>${ratio(r.revenue, r.spend)}</td>
            </tr>
          `).join("")}

        </tbody>
      </table>
    </div>
  `;
}

/* ---------------------------------- */
/* DETAIL TABLE */
/* ---------------------------------- */

function detailTable(rows = []) {

  const top = rows.slice(0,20);

  return `
    <div style="overflow:auto;">
      <table style="width:100%;min-width:1100px;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Campaign</th>
            <th>Adgroup</th>
            <th>Spend</th>
            <th>Clicks</th>
            <th>Units</th>
            <th>Revenue</th>
            <th>ROI</th>
          </tr>
        </thead>

        <tbody>

        ${top.map(r => `
          <tr>
            <td>${r.date || "-"}</td>
            <td>${r.campaign_name || "-"}</td>
            <td>${r.adgroup_name || "-"}</td>
            <td>${money(num(r.ad_spend))}</td>
            <td>${fmt(num(r.clicks))}</td>
            <td>${fmt(num(r.units_sold_total))}</td>
            <td>${money(num(r.total_revenue))}</td>
            <td>${ratio(num(r.total_revenue), num(r.ad_spend))}</td>
          </tr>
        `).join("")}

        </tbody>
      </table>
    </div>
  `;
}

/* ---------------------------------- */
/* UI HELPERS */
/* ---------------------------------- */

function card(label, value, primary=false) {
  return `
    <div class="kpi-card ${primary ? "primary" : ""}">
      <span class="kpi-label">${label}</span>
      <strong class="kpi-value">${value}</strong>
    </div>
  `;
}

function empty(t) {
  return `
    <div style="
      min-height:220px;
      display:grid;
      place-items:center;
      color:#64748b;
      font-weight:700;
    ">${t}</div>
  `;
}

/* ---------------------------------- */
/* MATH */
/* ---------------------------------- */

function num(v){
  const n = Number(String(v || 0).replace(/,/g,""));
  return isNaN(n) ? 0 : n;
}

function money(v){
  return "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0});
}

function fmt(v){
  return Number(v || 0).toLocaleString("en-IN");
}

function pct(a,b){
  return b ? ((a/b)*100).toFixed(2)+"%" : "0.00%";
}

function ratio(a,b){
  return b ? (a/b).toFixed(2) : "0.00";
}