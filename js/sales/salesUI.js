import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildSalesData } from "./salesEngine.js";

let SALES = [];
let RETURNS = [];
let READY = false;

let LIMIT = 50;
let QUERY = "";
let SORT = "sales";
let TIMER = null;

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

async function ensureData() {
  if (READY) return;

  const [salesCsv, returnCsv] = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.RETURNS)
  ]);

  SALES = parseCSV(salesCsv);
  RETURNS = parseCSV(returnCsv);

  READY = true;
}

function sortRows(rows) {
  const out = [...rows];

  if (SORT === "sales") out.sort((a, b) => b.value - a.value);
  if (SORT === "return") out.sort((a, b) => b.returnPct - a.returnPct);
  if (SORT === "net") out.sort((a, b) => b.netUnits - a.netUnits);
  if (SORT === "returns") out.sort((a, b) => b.returns - a.returns);

  return out;
}

export function initSalesTab() {
  window.renderSalesTab = async () => {
    const root = document.getElementById("sales");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Sales Intelligence...</div></section>`;

    await ensureData();

    const filter = window.ACTIVE_FILTER || {};

    const data = buildSalesData(SALES, RETURNS, filter);

    let rows = sortRows(data.rows);

    if (QUERY) {
      rows = rows.filter(r =>
        r.id.toLowerCase().includes(QUERY.toLowerCase())
      );
    }

    const show = rows.slice(0, LIMIT);

    root.innerHTML = `
      <section class="kpi-grid">
        <div class="kpi-card"><span>Units Sold</span><strong>${fmt(data.cards.sold)}</strong></div>
        <div class="kpi-card"><span>Sales Value</span><strong>₹${fmt(data.cards.value)}</strong></div>
        <div class="kpi-card"><span>Returned Units</span><strong>${fmt(data.cards.returns)}</strong></div>
        <div class="kpi-card"><span>Return %</span><strong>${fmt(data.cards.returnPct)}%</strong></div>
        <div class="kpi-card"><span>Net Units</span><strong>${fmt(data.cards.netUnits)}</strong></div>
        <div class="kpi-card"><span>Active Styles</span><strong>${fmt(data.cards.styles)}</strong></div>
      </section>

      <section class="panel">
        <div style="padding:16px;display:grid;gap:12px;grid-template-columns:1fr 180px;align-items:end;">
          <div>
            <label style="font-size:12px;color:#666;">Search Style ID</label>
            <input id="salesSearch" placeholder="Type style id..." value="${QUERY}">
          </div>

          <div>
            <label style="font-size:12px;color:#666;">Sort</label>
            <select id="salesSort">
              <option value="sales">Sales High to Low</option>
              <option value="return">Return % High to Low</option>
              <option value="net">Net Units High to Low</option>
              <option value="returns">Returns High to Low</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>Sold Units</th>
                <th>Sales Value</th>
                <th>Returns</th>
                <th>Return %</th>
                <th>Net Units</th>
              </tr>
            </thead>
            <tbody>
              ${
                show.map(r => `
                  <tr>
                    <td>${r.id}</td>
                    <td>${fmt(r.sold)}</td>
                    <td>${fmt(r.value)}</td>
                    <td>${fmt(r.returns)}</td>
                    <td>${fmt(r.returnPct)}%</td>
                    <td>${fmt(r.netUnits)}</td>
                  </tr>
                `).join("")
              || `<tr><td colspan="6">No data</td></tr>`
              }
            </tbody>
          </table>
        </div>

        ${
          rows.length > LIMIT
            ? `<button id="salesMore" class="load-more">Load More</button>`
            : ""
        }
      </section>
    `;

    document.getElementById("salesSort").value = SORT;

    document.getElementById("salesSort").onchange = e => {
      SORT = e.target.value;
      LIMIT = 50;
      window.renderSalesTab();
    };

    document.getElementById("salesSearch").oninput = e => {
      clearTimeout(TIMER);

      TIMER = setTimeout(() => {
        QUERY = e.target.value.trim();
        LIMIT = 50;
        window.renderSalesTab();
      }, 300);
    };

    const more = document.getElementById("salesMore");

    if (more) {
      more.onclick = () => {
        LIMIT += 50;
        window.renderSalesTab();
      };
    }
  };
}