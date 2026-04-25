import { buildPPRReport } from "./pprEngine.js";
import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";

let OPEN = {};
let LOADING = false;

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

function pct(a, b) {
  return b ? (a / b) * 100 : 0;
}

async function ensurePPR() {
  if (window.PPR_ROWS) return;
  if (LOADING) return;

  LOADING = true;

  const csv = await fetchCSV(SHEETS.PPR);
  window.PPR_ROWS = parseCSV(csv);

  LOADING = false;
}

function getRows() {
  const f = window.ACTIVE_FILTER || {};

  return (window.PPR_ROWS || []).filter(r =>
    Number(r.year) === Number(f.year) &&
    Number(r.month) === Number(f.month)
  );
}

function rowHtml(label, r, child = false) {
  return `
    <tr>
      <td>${child ? "↳ " : ""}${label}</td>
      <td>${fmt(r.spend)}</td>
      <td>${fmt(r.impressions)}</td>
      <td>${fmt(r.clicks)}</td>
      <td>${fmt(pct(r.clicks, r.impressions))}%</td>
      <td>${fmt(pct(r.units, r.clicks))}%</td>
      <td>${fmt(r.clicks ? r.spend / r.clicks : 0)}</td>
      <td>${fmt(r.units)}</td>
      <td>${fmt(r.revenue)}</td>
      <td>${fmt(roi(r.revenue, r.spend))}x</td>
    </tr>
  `;
}

export function initPPRTab() {
  window.renderPPRTab = async () => {
    const root = document.getElementById("ppr");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading PPR data...</div></section>`;

    await ensurePPR();

    const data = buildPPRReport(getRows());

    root.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h3>PPR Placement Report</h3>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Placement / Adgroup</th>
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
              ${data.map(p => `
                ${rowHtml((OPEN[p.name] ? "▼ " : "▶ ") + p.name, p)}

                ${OPEN[p.name]
                  ? p.children.map(c =>
                      rowHtml(c.name, c, true)
                    ).join("")
                  : ""}
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;

    data.forEach(p => {
      const rows = [...root.querySelectorAll("tbody tr")];
      rows.forEach(tr => {
        const txt = tr.children[0]?.innerText || "";

        if (
          txt.includes("▶ " + p.name) ||
          txt.includes("▼ " + p.name)
        ) {
          tr.style.cursor = "pointer";

          tr.onclick = () => {
            OPEN[p.name] = !OPEN[p.name];
            window.renderPPRTab();
          };
        }
      });
    });
  };
}