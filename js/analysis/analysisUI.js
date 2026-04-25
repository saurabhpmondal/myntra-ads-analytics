import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildAnalysis } from "./analysisEngine.js";

let CPR = [];
let PPR = [];
let LOADING = false;

let TYPE = "leaks";
let LIMIT = 10;

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

async function ensureData() {
  if (CPR.length && PPR.length) return;
  if (LOADING) return;

  LOADING = true;

  const [cprCsv, pprCsv] = await Promise.all([
    fetchCSV(SHEETS.CPR),
    fetchCSV(SHEETS.PPR)
  ]);

  CPR = parseCSV(cprCsv);
  PPR = parseCSV(pprCsv);

  LOADING = false;
}

function cards(a) {
  return `
    <section class="kpi-grid">
      <div class="kpi-card"><span>Leak Styles</span><strong>${a.cards.leaks}</strong></div>
      <div class="kpi-card"><span>Scale Styles</span><strong>${a.cards.winners}</strong></div>
      <div class="kpi-card"><span>No Sale</span><strong>${a.cards.nosale}</strong></div>
      <div class="kpi-card"><span>CTR Issues</span><strong>${a.cards.ctrIssues}</strong></div>
      <div class="kpi-card"><span>CPC Risk</span><strong>${a.cards.cpcRisk}</strong></div>
      <div class="kpi-card"><span>Best Placement</span><strong>${a.cards.bestPlacement}</strong></div>
    </section>
  `;
}

function getRows(a) {
  return a.data[TYPE] || [];
}

function getTitle() {
  const map = {
    leaks: "Leak Finder",
    winners: "Scale Opportunities",
    nosale: "No Sale Styles",
    ctrIssues: "CTR Issues",
    cpcRisk: "CPC Risk",
    placements: "Placement Intelligence",
    campaigns: "Campaign Actions"
  };

  return map[TYPE] || "Insights";
}

function table(rows) {
  const visible = rows.slice(0, LIMIT);

  return `
    <section class="panel">
      <div class="panel-head">
        <h3>${getTitle()}</h3>
      </div>

      <div style="padding:12px;">
        <select id="analysisType">
          <option value="leaks">Leak Finder</option>
          <option value="winners">Scale Opportunities</option>
          <option value="nosale">No Sale Styles</option>
          <option value="ctrIssues">CTR Issues</option>
          <option value="cpcRisk">CPC Risk</option>
          <option value="placements">Placement Intelligence</option>
          <option value="campaigns">Campaign Actions</option>
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Spend</th>
              <th>Clicks</th>
              <th>Units</th>
              <th>Revenue</th>
              <th>ROI</th>
            </tr>
          </thead>

          <tbody>
            ${visible.map(r => `
              <tr>
                <td>${r.name}</td>
                <td>${fmt(r.spend)}</td>
                <td>${fmt(r.clicks)}</td>
                <td>${fmt(r.units)}</td>
                <td>${fmt(r.revenue)}</td>
                <td>${fmt(roi(r.revenue, r.spend))}x</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      ${rows.length > LIMIT
        ? `<button class="load-more" id="moreAnalysis">Load More</button>`
        : ""}
    </section>
  `;
}

export function initAnalysisTab() {
  window.renderAnalysisTab = async () => {
    const root = document.getElementById("analysis");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading analysis...</div></section>`;

    await ensureData();

    const a = buildAnalysis(
      CPR,
      window.ALL || [],
      PPR
    );

    root.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h3>Analysis Month: ${a.latest.month}/${a.latest.year}</h3>
        </div>
      </section>

      ${cards(a)}

      ${table(getRows(a))}
    `;

    const type = document.getElementById("analysisType");

    if (type) {
      type.value = TYPE;

      type.onchange = e => {
        TYPE = e.target.value;
        LIMIT = 10;
        window.renderAnalysisTab();
      };
    }

    const more = document.getElementById("moreAnalysis");

    if (more) {
      more.onclick = () => {
        LIMIT += 10;
        window.renderAnalysisTab();
      };
    }
  };
}