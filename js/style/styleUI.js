import { buildStyleReport } from "./styleEngine.js";
import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";

let LIMIT = 50;
let SEARCH = "";
let LOADING = false;
let SEARCH_TIMER = null;

function num(v) {
  return Number(String(v ?? "").trim());
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

async function ensureCPR() {
  if (window.CPR_ROWS) return;
  if (LOADING) return;

  LOADING = true;
  const csv = await fetchCSV(SHEETS.CPR);
  window.CPR_ROWS = parseCSV(csv);
  LOADING = false;
}

function getFilteredRows() {
  const active = window.ACTIVE_FILTER || {};
  const fy = num(active.year);
  const fm = num(active.month);

  return (window.CPR_ROWS || []).filter(r => {
    return num(r.year) === fy && num(r.month) === fm;
  });
}

export function initStyleTab() {
  window.renderStyleTab = async () => {
    const root = document.getElementById("style");

    root.innerHTML = `
      <section class="panel">
        <div class="loading">Loading style data...</div>
      </section>
    `;

    await ensureCPR();

    const rows = getFilteredRows();

    const report = buildStyleReport(rows);

    const data = report.filter(r =>
      SEARCH
        ? String(r.id).toLowerCase().includes(SEARCH.toLowerCase())
        : true
    );

    const visible = data.slice(0, LIMIT);

    root.innerHTML = `
      <section class="panel">

        <div class="panel-head">
          <h3>Style Report</h3>
        </div>

        <div style="padding:12px;">
          <input
            id="styleSearch"
            placeholder="Search Style ID"
            value="${SEARCH}"
            style="width:100%;height:42px;border:1px solid #ddd;border-radius:10px;padding:0 10px;"
          >

          <div style="margin-top:8px;font-size:12px;color:#666;">
            Showing ${visible.length} of ${data.length} styles
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>Spend</th>
                <th>Impr</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>CVR</th>
                <th>CPC</th>
                <th>Units</th>
                <th>Revenue</th>
                <th>ROI</th>
              </tr>
            </thead>

            <tbody>
              ${visible.map(r => `
                <tr>
                  <td>${r.id}</td>
                  <td>${fmt(r.spend)}</td>
                  <td>${fmt(r.impressions)}</td>
                  <td>${fmt(r.clicks)}</td>
                  <td>${fmt(r.impressions ? (r.clicks / r.impressions) * 100 : 0)}%</td>
                  <td>${fmt(r.clicks ? (r.units / r.clicks) * 100 : 0)}%</td>
                  <td>${fmt(r.clicks ? r.spend / r.clicks : 0)}</td>
                  <td>${fmt(r.units)}</td>
                  <td>${fmt(r.revenue)}</td>
                  <td>${fmt(roi(r.revenue, r.spend))}x</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        ${visible.length < data.length
          ? `<button class="load-more" id="styleMore">Load More</button>`
          : ""}

      </section>
    `;

    const search = document.getElementById("styleSearch");

    search.oninput = e => {
      const val = e.target.value;

      clearTimeout(SEARCH_TIMER);

      SEARCH_TIMER = setTimeout(() => {
        SEARCH = val;
        LIMIT = 50;
        window.renderStyleTab();
      }, 300);
    };

    const more = document.getElementById("styleMore");

    if (more) {
      more.onclick = () => {
        LIMIT += 50;
        window.renderStyleTab();
      };
    }
  };
}