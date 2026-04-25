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

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

function card(label, value) {
  return `
    <div class="kpi-card">
      <span>${label}</span>
      <strong>${value}</strong>
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

function render() {
  const root = document.getElementById("dashboard");

  const rows = applyFilters(ALL, FILTER);

  window.ALL = ALL;
  window.FILTERED_ROWS = rows;
  window.ACTIVE_FILTER = FILTER;

  const k = buildKPI(rows);

  const campaign = buildCampaignRows(rows);
  const adgroup = buildAdgroupRows(rows);

  root.innerHTML = `
    <section class="kpi-grid">
      ${card("Spend", "₹" + fmt(k.spend))}
      ${card("Impressions", fmt(k.impressions))}
      ${card("Clicks", fmt(k.clicks))}
      ${card("Units Sold", fmt(k.units))}
      ${card("Revenue", "₹" + fmt(k.revenue))}
      ${card("ROI", fmt(k.roi) + "x")}
    </section>

    <section class="panel">
      ${renderTrendChart(buildTrendRows(rows))}
    </section>

    ${table(
      "Date Wise",
      ["Date", "Spend", "Impr", "Clicks", "Units", "Revenue", "ROI"],
      buildDateRows(rows).map(r => `
        <tr>
          <td>${r.date}</td>
          <td>${fmt(r.spend)}</td>
          <td>${fmt(r.impressions)}</td>
          <td>${fmt(r.clicks)}</td>
          <td>${fmt(r.units)}</td>
          <td>${fmt(r.revenue)}</td>
          <td>${fmt(roi(r.revenue, r.spend))}x</td>
        </tr>
      `).join("")
    )}

    ${table(
      "Campaign Wise",
      ["Campaign", "Spend", "Impr", "Clicks", "CTR", "CVR", "CPC", "Units", "Revenue", "ROI"],
      campaign.slice(0, LIMIT.campaign).map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${fmt(r.spend)}</td>
          <td>${fmt(r.impressions)}</td>
          <td>${fmt(r.clicks)}</td>
          <td>${fmt(r.impressions ? (r.clicks/r.impressions)*100 : 0)}%</td>
          <td>${fmt(r.clicks ? (r.units/r.clicks)*100 : 0)}%</td>
          <td>${fmt(r.clicks ? r.spend/r.clicks : 0)}</td>
          <td>${fmt(r.units)}</td>
          <td>${fmt(r.revenue)}</td>
          <td>${fmt(roi(r.revenue,r.spend))}x</td>
        </tr>
      `).join(""),
      "campaign"
    )}

    ${table(
      "Adgroup Wise",
      ["Adgroup", "Spend", "Impr", "Clicks", "CTR", "CVR", "CPC", "Units", "Revenue", "ROI"],
      adgroup.slice(0, LIMIT.adgroup).map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${fmt(r.spend)}</td>
          <td>${fmt(r.impressions)}</td>
          <td>${fmt(r.clicks)}</td>
          <td>${fmt(r.impressions ? (r.clicks/r.impressions)*100 : 0)}%</td>
          <td>${fmt(r.clicks ? (r.units/r.clicks)*100 : 0)}%</td>
          <td>${fmt(r.clicks ? r.spend/r.clicks : 0)}</td>
          <td>${fmt(r.units)}</td>
          <td>${fmt(r.revenue)}</td>
          <td>${fmt(roi(r.revenue,r.spend))}x</td>
        </tr>
      `).join(""),
      "adgroup"
    )}

    ${placementSection()}
  `;

  bindMore();
}

function bindMore() {
  document.querySelectorAll("[data-more]").forEach(btn => {
    btn.onclick = () => {
      LIMIT[btn.dataset.more] += 20;
      render();
    };
  });
}

function renderFilters() {
  const wrap = document.getElementById("filters");

  const years = getYears(ALL);
  const months = getMonths(ALL, FILTER.year);

  wrap.innerHTML = `
    <div class="filter-shell">

      <div class="f-item">
        <label>Year</label>
        <select id="fy">
          ${years.map(y =>
            `<option value="${y}" ${y === FILTER.year ? "selected" : ""}>${y}</option>`
          ).join("")}
        </select>
      </div>

      <div class="f-item">
        <label>Month</label>
        <select id="fm">
          ${months.map(m =>
            `<option value="${m}" ${Number(m) === Number(FILTER.month) ? "selected" : ""}>${m} - ${MONTH_NAMES[m]}</option>`
          ).join("")}
        </select>
      </div>

      <div class="f-item">
        <label>Start</label>
        <input id="fs" type="date" value="${FILTER.start}">
      </div>

      <div class="f-item">
        <label>End</label>
        <input id="fe" type="date" value="${FILTER.end}">
      </div>

    </div>
  `;

  fy.onchange = e => {
    FILTER.year = Number(e.target.value);
    FILTER.month = Number(getMonths(ALL, FILTER.year)[0]);
    FILTER.start = "";
    FILTER.end = "";
    renderFilters();
    render();
  };

  fm.onchange = e => {
    FILTER.month = Number(e.target.value);
    FILTER.start = "";
    FILTER.end = "";
    render();
  };

  fs.onchange = e => {
    FILTER.start = e.target.value;
    render();
  };

  fe.onchange = e => {
    FILTER.end = e.target.value;
    render();
  };
}

async function loadPPR() {
  const csv = await fetchCSV(SHEETS.PPR);
  PPR = parseCSV(csv);
  render();
}

export async function initDashboard() {
  document.getElementById("dashboard").innerHTML =
    `<section class="panel"><div class="loading">Loading dashboard...</div></section>`;

  const csv = await fetchCSV(SHEETS.CDR);

  ALL = parseCSV(csv);
  window.ALL = ALL;

  const latest = latestMonth(ALL);

  FILTER.year = latest.year;
  FILTER.month = latest.month;

  renderFilters();
  render();

  loadPPR();
}