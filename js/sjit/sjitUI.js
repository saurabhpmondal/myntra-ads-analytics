import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";

let READY = false;

let SALES = [];
let RETURNS = [];
let TRAFFIC = [];
let STOCK = [];
let MASTER = [];
let SOR = [];

async function ensureData() {
  if (READY) return;

  const [
    salesCsv,
    returnCsv,
    trafficCsv,
    stockCsv,
    masterCsv,
    sorCsv
  ] = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.RETURNS),
    fetchCSV(SHEETS.TRAFFIC),
    fetchCSV(SHEETS.SJIT_STOCK),
    fetchCSV(SHEETS.PRODUCT_MASTER),
    fetchCSV(SHEETS.SOR_STOCK)
  ]);

  SALES = parseCSV(salesCsv);
  RETURNS = parseCSV(returnCsv);
  TRAFFIC = parseCSV(trafficCsv);
  STOCK = parseCSV(stockCsv);
  MASTER = parseCSV(masterCsv);
  SOR = parseCSV(sorCsv);

  READY = true;
}

function uniq(rows, key) {
  const s = new Set();

  rows.forEach(r => {
    const v = String(r[key] || "").trim();
    if (v) s.add(v);
  });

  return s.size;
}

function stockStyles(rows) {
  const map = {};

  rows.forEach(r => {
    const style = String(r.style_id || "").trim();
    if (!style) return;

    map[style] =
      (map[style] || 0) +
      Number(r.sellable_inventory_count || 0);
  });

  return map;
}

export function initSJITTab() {
  window.renderSJITTab = async () => {
    const root = document.getElementById("sjit");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading SJIT Debug...</div></section>`;

    await ensureData();

    const stockMap = stockStyles(STOCK);

    const preview = Object.entries(stockMap)
      .slice(0, 20)
      .map(([style, qty]) => `
        <tr>
          <td>${style}</td>
          <td>${qty}</td>
        </tr>
      `)
      .join("");

    root.innerHTML = `
      <section class="kpi-grid">
        <div class="kpi-card"><span>Sales Rows</span><strong>${SALES.length}</strong></div>
        <div class="kpi-card"><span>Return Rows</span><strong>${RETURNS.length}</strong></div>
        <div class="kpi-card"><span>Traffic Rows</span><strong>${TRAFFIC.length}</strong></div>
        <div class="kpi-card"><span>SJIT Stock Rows</span><strong>${STOCK.length}</strong></div>
        <div class="kpi-card"><span>Master Rows</span><strong>${MASTER.length}</strong></div>
        <div class="kpi-card"><span>SOR Rows</span><strong>${SOR.length}</strong></div>
      </section>

      <section class="kpi-grid">
        <div class="kpi-card"><span>Sales Styles</span><strong>${uniq(SALES, "style_id")}</strong></div>
        <div class="kpi-card"><span>Return Styles</span><strong>${uniq(RETURNS, "style_id")}</strong></div>
        <div class="kpi-card"><span>Traffic Styles</span><strong>${uniq(TRAFFIC, "style_id")}</strong></div>
        <div class="kpi-card"><span>Stock Styles</span><strong>${Object.keys(stockMap).length}</strong></div>
        <div class="kpi-card"><span>Master Styles</span><strong>${uniq(MASTER, "style_id")}</strong></div>
        <div class="kpi-card"><span>SOR Styles</span><strong>${uniq(SOR, "style_id")}</strong></div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h3>SJIT Stock Consolidation Preview</h3>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>Sellable Stock</th>
              </tr>
            </thead>
            <tbody>
              ${preview || `<tr><td colspan="2">No data</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  };
}