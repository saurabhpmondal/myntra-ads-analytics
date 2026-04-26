import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildSJITDebug } from "./sjitEngine.js";

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

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

export function initSJITTab() {
  window.renderSJITTab = async () => {
    const root = document.getElementById("sjit");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading SJIT Debug...</div></section>`;

    await ensureData();

    const data = buildSJITDebug({
      salesRows: SALES,
      returnRows: RETURNS,
      trafficRows: TRAFFIC,
      stockRows: STOCK,
      masterRows: MASTER,
      sorRows: SOR
    });

    const preview = data.rows
      .slice(0, 50)
      .map(r => `
        <tr>
          <td>${r.style_id}</td>
          <td>${r.erp_sku}</td>
          <td>${r.status}</td>
          <td>${r.brand}</td>
          <td>${fmt(r.rating)}</td>
          <td>${fmt(r.gross)}</td>
          <td>${fmt(r.returns)}</td>
          <td>${fmt(r.net)}</td>
          <td>${fmt(r.stock)}</td>
        </tr>
      `)
      .join("");

    root.innerHTML = `
      <section class="kpi-grid">
        <div class="kpi-card"><span>Anchor Date</span><strong>${data.endDate}</strong></div>
        <div class="kpi-card"><span>30D Start</span><strong>${data.startDate}</strong></div>
        <div class="kpi-card"><span>30D Sales Rows</span><strong>${fmt(data.salesRows30)}</strong></div>
        <div class="kpi-card"><span>30D Return Rows</span><strong>${fmt(data.returnRows30)}</strong></div>
        <div class="kpi-card"><span>Total Styles</span><strong>${fmt(data.rows.length)}</strong></div>
        <div class="kpi-card"><span>Preview Rows</span><strong>${Math.min(50, data.rows.length)}</strong></div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h3>SJIT Joined Debug Preview</h3>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>ERP SKU</th>
                <th>Status</th>
                <th>Brand</th>
                <th>Rating</th>
                <th>Gross</th>
                <th>Returns</th>
                <th>Net</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              ${preview || `<tr><td colspan="9">No data</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  };
}