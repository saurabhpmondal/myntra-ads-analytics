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
  1:"January",2:"February",3:"March",4:"April",5:"May",6:"June",
  7:"July",8:"August",9:"September",10:"October",11:"November",12:"December"
};

function latestMonth(rows) {
  return rows.reduce((best, r) => {
    const score = Number(r.year) * 100 + Number(r.month);
    return score > best.score
      ? { score, year:Number(r.year), month:Number(r.month) }
      : best;
  }, { score:0, year:0, month:0 });
}

function previousMonth(y, m) {
  if (m === 1) return { year:y - 1, month:12 };
  return { year:y, month:m - 1 };
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits:2
  });
}

function pct(n) {
  const v = Number(n || 0);
  const sign = v > 0 ? "▲ +" : v < 0 ? "▼ " : "";
  return `${sign}${fmt(Math.abs(v))}%`;
}

function roiDelta(n) {
  const v = Number(n || 0);
  const sign = v > 0 ? "▲ +" : v < 0 ? "▼ " : "";
  return `${sign}${fmt(Math.abs(v))}x`;
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
      <div class="panel-head"><h3>${title}</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${rowsHtml || `<tr><td colspan="${heads.length}">No data</td></tr>`}</tbody>
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
        <td>${fmt(r.impressions ? r.clicks/r.impressions*100 : 0)}%</td>
        <td>${fmt(r.units)}</td>
        <td>${fmt(r.revenue)}</td>
        <td>${fmt(roi(r.revenue,r.spend))}x</td>
      </tr>
    `).join("");

  return table(
    "Placement Wise",
    ["Placement","Spend","Impr","Clicks","CTR","Units","Revenue","ROI"],
    html,
    "placement"
  );
}

function render() {
  const root = document.getElementById("dashboard");

  const rows = applyFilters(ALL, FILTER);

  const prev = previousMonth(FILTER.year, FILTER.month);

  const prevRows = ALL.filter(r =>
    Number(r.year) === prev.year &&
    Number(r.month) === prev.month
  );

  window.ALL = ALL;
  window.FILTERED_ROWS = rows;
  window.ACTIVE_FILTER = { ...FILTER };
  window.LATEST_MONTH = latestMonth(ALL);

  const k = buildKPI(rows, prevRows);

  const campaign = buildCampaignRows(rows);
  const adgroup = buildAdgroupRows(rows);

  root.innerHTML = `
    <section class="kpi-grid">
      ${card("Spend","₹"+fmt(k.spend),pct(k.delta.spend))}
      ${card("Impressions",fmt(k.impressions),pct(k.delta.impressions))}
      ${card("Clicks",fmt(k.clicks),pct(k.delta.clicks))}
      ${card("Units Sold",fmt(k.units),pct(k.delta.units))}
      ${card("Revenue","₹"+fmt(k.revenue),pct(k.delta.revenue))}
      ${card("ROI",fmt(k.roi)+"x",roiDelta(k.delta.roi))}
    </section>

    <section class="panel">
      ${renderTrendChart(buildTrendRows(rows))}
    </section>

    ${table(
      "Date Wise",
      ["Date","Spend","Impr","Clicks","Units","Revenue","ROI"],
      buildDateRows(rows).map(r => `
        <tr>
          <td>${r.date}</td>
          <td>${fmt(r.spend)}</td>
          <td>${fmt(r.impressions)}</td>
          <td>${fmt(r.clicks)}</td>
          <td>${fmt(r.units)}</td>
          <td>${fmt(r.revenue)}</td>
          <td>${fmt(roi(r.revenue,r.spend))}x</td>
        </tr>
      `).join("")
    )}

    ${table(
      "Campaign Wise",
      ["Campaign","Spend","Impr","Clicks","CTR","CVR","CPC","Units","Revenue","ROI"],
      campaign.slice(0,LIMIT.campaign).map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${fmt(r.spend)}</td>
          <td>${fmt(r.impressions)}</td>
          <td>${fmt(r.clicks)}</td>
          <td>${fmt(r.impressions ? r.clicks/r.impressions*100 : 0)}%</td>
          <td>${fmt(r.clicks ? r.units/r.clicks*100 : 0)}%</td>
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
      ["Adgroup","Spend","Impr","Clicks","CTR","CVR","CPC","Units","Revenue","ROI"],
      adgroup.slice(0,LIMIT.adgroup).map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${fmt(r.spend)}</td>
          <td>${fmt(r.impressions)}</td>
          <td>${fmt(r.clicks)}</td>
          <td>${fmt(r.impressions ? r.clicks/r.impressions*100 : 0)}%</td>
          <td>${fmt(r.clicks ? r.units/r.clicks*100 : 0)}%</td>
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

/* keep your existing bindMore, renderFilters, loadPPR, initDashboard exactly same below this point */