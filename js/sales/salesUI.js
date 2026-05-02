import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildSalesData } from "./salesEngine.js";

let SALES = [];
let RETURNS = [];
let MASTER = [];
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

  const [salesCsv, returnCsv, masterCsv] = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.RETURNS),
    fetchCSV(SHEETS.PRODUCT_MASTER)
  ]);

  SALES = parseCSV(salesCsv);
  RETURNS = parseCSV(returnCsv);
  MASTER = parseCSV(masterCsv);

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
    const data = buildSalesData(SALES, RETURNS, MASTER, filter);

    let rows = sortRows(data.rows);

    if (QUERY) {
      rows = rows.filter(r =>
        String(r.id).toLowerCase().includes(QUERY.toLowerCase())
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

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>ERP SKU</th>
                <th>Brand</th>
                <th>Status</th>
                <th>Sold</th>
                <th>Value</th>
                <th>Returns</th>
                <th>Return %</th>
                <th>Net</th>
                <th>DRR</th>
              </tr>
            </thead>
            <tbody>
              ${
                show.map(r => `
                  <tr>
                    <td>${r.id}</td>
                    <td>${r.erp_sku}</td>
                    <td>${r.brand}</td>
                    <td>${r.status}</td>
                    <td>${fmt(r.sold)}</td>
                    <td>₹${fmt(r.value)}</td>
                    <td>${fmt(r.returns)}</td>
                    <td>${fmt(r.returnPct)}%</td>
                    <td>${fmt(r.netUnits)}</td>
                    <td>${fmt(r.drr)}</td>
                  </tr>
                `).join("")
                || `<tr><td colspan="10">No data</td></tr>`
              }
            </tbody>
          </table>
        </div>

      </section>
    `;
  };
}