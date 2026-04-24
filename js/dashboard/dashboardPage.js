// FILE: js/dashboard/dashboardPage.js

import { state } from "../core/state.js";
import { num } from "../data/parser.js";

/* ---------------------------------- */
/* Render Dashboard */
/* ---------------------------------- */

export function renderDashboard() {

  const page = document.querySelector(".page-wrap");

  if (!page) return;

  const rows = state.data.cdr || [];

  const kpi = buildKPI(rows);

  page.innerHTML = `
    <!-- KPI CARDS -->
    <section class="cards-grid">

      ${card("Spend", money(kpi.spend), true)}
      ${card("Revenue", money(kpi.revenue))}
      ${card("ROI", kpi.roi.toFixed(2))}
      ${card("Clicks", formatNum(kpi.clicks))}
      ${card("Units", formatNum(kpi.units))}
      ${card("Impressions", formatNum(kpi.impressions))}

    </section>

    <!-- Trend -->
    <section class="panel-card">
      <div class="panel-head">
        <h3>Spend vs Revenue Trend</h3>
      </div>

      <div class="chart-placeholder">
        <div style="
          height:100%;
          display:grid;
          place-items:center;
          color:#64748b;
          font-weight:700;
        ">
          Chart Integration Next Phase
        </div>
      </div>
    </section>

    <!-- Table -->
    <section class="panel-card">
      <div class="panel-head">
        <h3>Daily Performance Summary</h3>
      </div>

      ${buildTable(rows)}
    </section>
  `;
}

/* ---------------------------------- */
/* KPI Builder */
/* ---------------------------------- */

function buildKPI(rows = []) {

  let spend = 0;
  let revenue = 0;
  let clicks = 0;
  let units = 0;
  let impressions = 0;

  rows.forEach(row => {

    spend += num(row.ad_spend);
    revenue += num(row.total_revenue);
    clicks += num(row.clicks);
    units += num(row.units_sold_total);
    impressions += num(row.impressions);
  });

  const roi = spend ? revenue / spend : 0;

  return {
    spend,
    revenue,
    clicks,
    units,
    impressions,
    roi
  };
}

/* ---------------------------------- */
/* Cards */
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
/* Table */
/* ---------------------------------- */

function buildTable(rows = []) {

  if (!rows.length) {
    return emptyState("No rows loaded.");
  }

  const topRows = rows.slice(0, 20);

  const trs = topRows.map(row => `
    <tr>
      <td>${row.date || "-"}</td>
      <td>${row.campaign_name || "-"}</td>
      <td>${money(num(row.ad_spend))}</td>
      <td>${formatNum(num(row.clicks))}</td>
      <td>${formatNum(num(row.units_sold_total))}</td>
      <td>${money(num(row.total_revenue))}</td>
      <td>${roi(row.ad_spend, row.total_revenue)}</td>
    </tr>
  `).join("");

  return `
    <div style="overflow:auto;">
      <table style="width:100%; min-width:900px;">
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
          ${trs}
        </tbody>
      </table>
    </div>
  `;
}

function emptyState(text) {

  return `
    <div style="
      min-height:220px;
      display:grid;
      place-items:center;
      color:#64748b;
      font-weight:700;
    ">
      ${text}
    </div>
  `;
}

/* ---------------------------------- */
/* Helpers */
/* ---------------------------------- */

function money(v) {
  return "₹" + Number(v || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  });
}

function formatNum(v) {
  return Number(v || 0).toLocaleString("en-IN");
}

function roi(spend, revenue) {

  const s = num(spend);
  const r = num(revenue);

  return s ? (r / s).toFixed(2) : "0.00";
}