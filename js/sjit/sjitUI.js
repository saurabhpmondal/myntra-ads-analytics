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

let QUERY = "";
let LIMIT = 50;
let SORT = "sales";
let TIMER = null;

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

function sortRows(rows) {
  const out = [...rows];

  if (SORT === "sales") out.sort((a, b) => b.net - a.net);
  if (SORT === "ship") out.sort((a, b) => b.shipmentQty - a.shipmentQty);
  if (SORT === "recall") out.sort((a, b) => b.recallQty - a.recallQty);
  if (SORT === "stock") out.sort((a, b) => b.stock - a.stock);

  return out;
}

export function initSJITTab() {
  window.renderSJITTab = async () => {
    const root = document.getElementById("sjit");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading SJIT Planning...</div></section>`;

    await ensureData();

    const data = buildSJITDebug({
      salesRows: SALES,
      returnRows: RETURNS,
      trafficRows: TRAFFIC,
      stockRows: STOCK,
      masterRows: MASTER,
      sorRows: SOR
    });

    let rows = [...data.rows];

    if (QUERY) {
      const q = QUERY.toLowerCase();

      rows = rows.filter(r =>
        String(r.style_id).toLowerCase().includes(q) ||
        String(r.erp_sku).toLowerCase().includes(q) ||
        String(r.brand).toLowerCase().includes(q)
      );
    }

    rows = sortRows(rows);

    const show = rows.slice(0, LIMIT);

    const shipStyles = rows.filter(r => r.shipmentQty > 0).length;
    const recallStyles = rows.filter(r => r.recallQty > 0).length;

    const shipQty = rows.reduce((s, r) => s + r.shipmentQty, 0);
    const recallQty = rows.reduce((s, r) => s + r.recallQty, 0);
    const totalStock = rows.reduce((s, r) => s + r.stock, 0);

    const avgReturn =
      rows.length
        ? rows.reduce((s, r) => s + r.returnPct, 0) / rows.length
        : 0;

    const body = show.map(r => `
      <tr>
        <td>${r.style_id}</td>
        <td>${r.erp_sku}</td>
        <td>${r.status}</td>
        <td>${r.brand}</td>
        <td>${r.launch_date}</td>
        <td>${r.live_date}</td>
        <td>${fmt(r.rating)}</td>
        <td>${fmt(r.gross)}</td>
        <td>${fmt(r.returns)}</td>
        <td>${fmt(r.net)}</td>
        <td>${fmt(r.returnPct)}%</td>
        <td>${fmt(r.drr)}</td>
        <td>${fmt(r.stock)}</td>
        <td>${r.sc >= 999999 ? "∞" : fmt(r.sc)}</td>
        <td>${fmt(r.shipmentQty)}</td>
        <td>${fmt(r.recallQty)}</td>
      </tr>
    `).join("");

    root.innerHTML = `
      <section class="kpi-grid">
        <div class="kpi-card"><span>Styles To Ship</span><strong>${fmt(shipStyles)}</strong></div>
        <div class="kpi-card"><span>Total Shipment Qty</span><strong>${fmt(shipQty)}</strong></div>
        <div class="kpi-card"><span>Styles To Recall</span><strong>${fmt(recallStyles)}</strong></div>
        <div class="kpi-card"><span>Total Recall Qty</span><strong>${fmt(recallQty)}</strong></div>
        <div class="kpi-card"><span>Avg Return %</span><strong>${fmt(avgReturn)}%</strong></div>
        <div class="kpi-card"><span>Total Stock</span><strong>${fmt(totalStock)}</strong></div>
      </section>

      <section class="panel">
        <div style="padding:16px;display:grid;gap:12px;grid-template-columns:1fr 220px;align-items:end;">
          <div>
            <label style="font-size:12px;color:#666;">Search Style / ERP SKU / Brand</label>
            <input id="sjitSearch" value="${QUERY}" placeholder="Type to search...">
          </div>

          <div>
            <label style="font-size:12px;color:#666;">Sort</label>
            <select id="sjitSort">
              <option value="sales">Sales High to Low</option>
              <option value="ship">Shipment High to Low</option>
              <option value="recall">Recall High to Low</option>
              <option value="stock">Stock High to Low</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>ERP SKU</th>
                <th>Status</th>
                <th>Brand</th>
                <th>Launch</th>
                <th>Live</th>
                <th>Rating</th>
                <th>Gross</th>
                <th>Returns</th>
                <th>Net</th>
                <th>Return%</th>
                <th>DRR</th>
                <th>Stock</th>
                <th>SC</th>
                <th>Shipment</th>
                <th>Recall</th>
              </tr>
            </thead>
            <tbody>
              ${body || `<tr><td colspan="16">No data</td></tr>`}
            </tbody>
          </table>
        </div>

        ${
          rows.length > LIMIT
            ? `<button id="sjitMore" class="load-more">Load More</button>`
            : ""
        }
      </section>
    `;

    document.getElementById("sjitSort").value = SORT;

    document.getElementById("sjitSort").onchange = e => {
      SORT = e.target.value;
      LIMIT