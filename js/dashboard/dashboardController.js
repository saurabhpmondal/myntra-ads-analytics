import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildKPI } from "./kpiEngine.js";
import { getYears, getMonths, applyFilters } from "../core/filters.js";
import { buildDateRows } from "./dateTableEngine.js";
import { buildCampaignRows } from "./campaignTableEngine.js";
import { buildAdgroupRows } from "./adgroupTableEngine.js";
import { buildTrendRows, renderTrendChart } from "./trendChartEngine.js";
import { buildPlacementRows } from "./placementTableEngine.js";

let ALL = [];
let PPR = [];

let FILTER = {
  year: 0,
  month: 0,
  start: "",
  end: ""
};

let LIMIT = {
  campaign: 20,
  adgroup: 20,
  placement: 20
};

const MONTH_NAMES = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December"
};

function latestMonth(rows) {
  return rows.reduce((best, r) => {
    const score = Number(r.year) * 100 + Number(r.month);

    return score > best.score
      ? { score, year: Number(r.year), month: Number(r.month) }
      : best;
  }, { score: 0, year: 0, month: 0 });
}

function previousMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function pctLabel(v) {
  const n = Number(v || 0);
  if (!n) return "0%";
  return `${n > 0 ? "▲ +" : "▼ "}${fmt(Math.abs(n))}%`;
}

function roiLabel(v) {
  const n = Number(v || 0);
  if (!n) return "0x";
  return `${n > 0 ? "▲ +" : "▼ "}${fmt(Math.abs(n))}x`;
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

function refreshAllTabs() {
  window.renderCampaignTab?.();
  window.renderAdgroupTab?.();
  window.renderStyleTab?.();
  window.renderPPRTab?.();
  window.renderAnalysisTab?.();
  window.renderSalesTab?.();
  window.renderSJITTab?.();
  window.renderExportTab?.();
}

function card(label, value, sub = "") {
  return `
    <div class="kpi-card">
      <span>${label}</span>
      <strong>${value}</strong>
      ${sub ? `<div style="margin-top:6px;font-size:12px;color:#666;">${sub}</div>` : ""}
    </div>
  `;
}

function table(title, heads, rowsHtml, key = "") {
  return `
    <section class="panel">
      <div class="panel-head">
        <h3>${title}</h3>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="${heads.length}">No data</td></tr>`}
          </tbody>
        </table>
      </div>

      ${key ? `<button class="load-more" data-more="${key}">Load More</button>` : ""}
    </section>
  `;
}

function placementSection() {
  if (!PPR.length) {
    return `<section class="panel"><div class="loading">Loading placement data...</div></section>`;
  }

  const rows = PPR.filter(r =>
    Number(r.year) === FILTER.year &&
    Number(r.month) === FILTER.month
  );

  const html = buildPlacementRows(rows)
    .slice(0, LIMIT.placement)
    .map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${fmt(r.spend)}</td>
        <td>${fmt(r.impressions)}</td>
        <td>${fmt(r.clicks)}</td>
        <td>${fmt(r.impressions ? (r.clicks / r.impressions) * 100 : 0)}%</td>
        <td>${fmt(r.units)}</td>
        <td>${fmt(r.revenue)}</td>
        <td>${fmt(roi(r.revenue, r.spend))}x</td>
      </tr>
    `).join("");

  return table(
    "Placement Wise",
    ["Placement", "Spend", "Impr", "Clicks", "CTR", "Units", "Revenue", "ROI"],
    html,
    "placement"
  );
}

/* keep your existing render(), bindMore(), renderFilters(), loadPPR(), initDashboard() unchanged below this line */