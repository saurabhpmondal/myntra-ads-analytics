// FILE: js/dashboard/dashboardPage.js

import { state } from "../core/state.js";
import { num } from "../data/parser.js";

/* ---------------------------------- */
/* RENDER DASHBOARD */
/* ---------------------------------- */

export function renderDashboard() {

  const page = document.querySelector(".page-wrap");

  if (!page) return;

  const rows = state.data.cdr || [];

  const kpi = buildKPI(rows);

  page.innerHTML = `
    <section class="cards-grid">

      ${card("Spend", money(kpi.spend), true)}
      ${card("Revenue", money(kpi.revenue))}
      ${card("ROI", kpi.roi.toFixed(2))}
      ${card("Clicks", fmt(kpi.clicks))}
      ${card("Units", fmt(kpi.units))}
      ${card("Impressions", fmt(kpi.impressions))}

    </section>

    <section class="panel-card">
      <div class="panel-head">
        <h3>Daily Trend (${rows.length} Rows)</h3>
      </div>

      ${dailyTrend(rows)}
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <h3>Performance Summary</h3>
      </div>

      ${summaryTable(rows)}
    </section>
  `;
}

/* ---------------------------------- */
/* KPI */
/* ---------------------------------- */

function buildKPI(rows = []) {

  let spend = 0;
  let revenue = 0;
  let clicks = 0;
  let units = 0;
  let impressions = 0;

  rows.forEach(r => {

    spend += num(r.ad_spend);
    revenue += num(r.total_revenue);
    clicks += num(r.clicks);
    units += num(r.units_sold_total);
    impressions += num(r.impressions);
  });

  return {
    spend,
    revenue,
    clicks,
    units,
    impressions,
    roi: spend ? revenue / spend : 0
  };
}

/* ---------------------------------- */
/* DAILY TREND */
/* ---------------------------------- */

function dailyTrend(rows = []) {

  if (!rows.length) return empty("No data found");

  const map = {};

  rows.forEach(r => {

    const d = r.date || "NA";

    if (!map[d]) {
      map[d] = {
        spend: 0,
        revenue: 0
      };
    }

    map[d].spend += num(r.ad_spend);
    map[d].revenue += num(r.total_revenue);
  });

  const days = Object.keys(map).sort().slice(-10);

  return `
    <div style="display:grid;gap:10px;">
      ${days.map(day => `
        <div style="
          display:grid;
          grid-template-columns:120px 1fr 1fr;
          gap:12px;
          align-items:center;
          font-size:13px;
        ">
          <div><b>${day}</b></div>
          <div>Spend: ${money(map[day].spend)}</div>
          <div>Revenue: ${money(map[day].revenue)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

/* ---------------------------------- */
/* TABLE */
/* ---------------------------------- */

function summaryTable(rows = []) {

  if (!rows.length) return empty("No rows available");

  const top = rows.slice(0, 20);

  return `
    <div style="overflow:auto;">
      <table style="width:100%;min-width:900px;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Campaign</th>
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
              <td>${money(num(r.ad_spend))}</td>
              <td>${fmt(num(r.clicks))}</td>
              <td>${fmt(num(r.units_sold_total))}</td>
              <td>${money(num(r.total_revenue))}</td>
              <td>${roi(r.ad_spend, r.total_revenue)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------------------------------- */
/* CARD */
/* ---------------------------------- */

function card(label, value, primary = false) {

  return `
    <div class="kpi-card ${primary ? "primary" : ""}">
      <span class="kpi-label">${label}</span>
      <strong class="kpi-value">${value}</strong>
    </div>
  `;
}

/* ---------------------------------- */
/* HELPERS */
/* ---------------------------------- */

function money(v) {
  return "₹" + Number(v || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  });
}

function fmt(v) {
  return Number(v || 0).toLocaleString("en-IN");
}

function roi(s, r) {

  const spend = num(s);
  const rev = num(r);

  return spend ? (rev / spend).toFixed(2) : "0.00";
}

function empty(t) {
  return `
    <div style="
      min-height:220px;
      display:grid;
      place-items:center;
      color:#64748b;
      font-weight:700;
    ">
      ${t}
    </div>
  `;
}