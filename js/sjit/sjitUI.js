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

    let rows = [...data.rows];

    if (QUERY) {
      const q = QUERY.toLowerCase();

      rows = rows.filter(r =>
        String(r.style_id).toLowerCase().includes(q) ||
        String(r.erp_sku).toLowerCase().includes(q) ||
        String(r.brand).toLowerCase().includes(q)
      );
    }

    const show = rows.slice(0, LIMIT);

    const preview = show.map(r => `
      <tr>
        <td>${r.style_id}</td>
        <td>${r.erp_sku}</td>
        <td>${r.status}</td>
        <td>${r.brand}</td>
        <td>${fmt(r.rating)}</td>
        <td>${fmt(r.gross)}</td>
        <td>${fmt(r.returns)}</td>
        <td>${fmt(r.net)}</td>
        <td>${fmt(r.returnPct)}%</td>
        <td>${fmt(r.drr)}</td>
        <td>${fmt(r.stock)}</td>
        <td>${r.sc >= 999999 ? "∞" : fmt(r.sc)}</td>
      </tr>
    `).join("");

    root.innerHTML = `
      <section class="kpi-grid">
        <div class="kpi-card"><span>Anchor Date</span><strong>${data.endDate}</strong></div>
        <div class="kpi-card"><span>30D Start</span><strong>${data.startDate}</strong></div>
        <div class="kpi-card"><span>30D Sales Rows</span><strong>${fmt(data.salesRows30)}</strong></div>
        <div class="kpi-card"><span>30D Return Rows</span><strong>${fmt(data.returnRows30)}</strong></div>
        <div class="kpi-card"><span>Total Styles</span><strong>${fmt(rows.length)}</strong></div>
        <div class="kpi-card"><span>Shown Rows</span><strong>${fmt(show.length)}</strong></div>
      </section>

      <section class="panel">
        <div style="padding:16px;">
          <label style="font-size:12px;color:#666;">Search Style / ERP SKU / Brand</label>
          <input id="sjitSearch" value="${QUERY}" placeholder="Type to search...">
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
                <th>Return%</th>
                <th>DRR</th>
                <th>Stock</th>
                <th>SC</th>
              </tr>
            </thead>
            <tbody>
              ${preview || `<tr><td colspan="12">No data</td></tr>`}
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

    document.getElementById("sjitSearch").oninput = e => {
      clearTimeout(TIMER);

      TIMER = setTimeout(() => {
        QUERY = e.target.value.trim();
        LIMIT = 50;
        window.renderSJITTab();
      }, 300);
    };

    const more = document.getElementById("sjitMore");

    if (more) {
      more.onclick = () => {
        LIMIT += 50;
        window.renderSJITTab();
      };
    }
  };
}