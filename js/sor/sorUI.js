import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildSORDebug } from "./sorEngine.js";

let READY = false;

let SALES = [];
let RETURNS = [];
let TRAFFIC = [];
let STOCK = [];
let MASTER = [];

let QUERY = "";
let LIMIT = 50;
let SORT = "sales";
let TIMER = null;

let SALES_DAYS = 30;
let COVER_DAYS = 45;
let RECALL_DAYS = 60;

async function ensureData() {
  if (READY) return;

  const files = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.RETURNS),
    fetchCSV(SHEETS.TRAFFIC),
    fetchCSV(SHEETS.SOR_STOCK),
    fetchCSV(SHEETS.PRODUCT_MASTER)
  ]);

  SALES = parseCSV(files[0]);
  RETURNS = parseCSV(files[1]);
  TRAFFIC = parseCSV(files[2]);
  STOCK = parseCSV(files[3]);
  MASTER = parseCSV(files[4]);

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
  if (SORT === "projection") out.sort((a, b) => b.projectionQty - a.projectionQty);
  if (SORT === "ship") out.sort((a, b) => b.shipmentQty - a.shipmentQty);
  if (SORT === "recall") out.sort((a, b) => b.recallQty - a.recallQty);
  if (SORT === "stock") out.sort((a, b) => b.stock - a.stock);

  return out;
}

function sum(rows, key, brand) {
  return rows
    .filter(r => r.brand.toUpperCase() === brand)
    .reduce((s, r) => s + Number(r[key] || 0), 0);
}

export function initSORTab() {
  window.renderSORTab = async function () {
    const root = document.getElementById("sor");

    root.innerHTML =
      '<section class="panel"><div class="loading">Loading SOR Planner...</div></section>';

    try {
      await ensureData();

      const data = buildSORDebug(
        {
          salesRows: SALES,
          returnRows: RETURNS,
          trafficRows: TRAFFIC,
          stockRows: STOCK,
          masterRows: MASTER
        },
        {
          salesDays: SALES_DAYS,
          coverDays: COVER_DAYS,
          recallDays: RECALL_DAYS
        }
      );

      let rows = [...data.rows];

      if (QUERY) {
        const q = QUERY.toLowerCase();

        rows = rows.filter(r =>
          String(r.style_id || "").toLowerCase().includes(q) ||
          String(r.erp_sku || "").toLowerCase().includes(q) ||
          String(r.brand || "").toLowerCase().includes(q)
        );
      }

      rows = sortRows(rows);

      const show = rows.slice(0, LIMIT);

      const kaliniShip = sum(rows, "shipmentQty", "KALINI");
      const kaliniRecall = sum(rows, "recallQty", "KALINI");
      const kaliniStock = sum(rows, "stock", "KALINI");

      const miteraShip = sum(rows, "shipmentQty", "MITERA");
      const miteraRecall = sum(rows, "recallQty", "MITERA");
      const miteraStock = sum(rows, "stock", "MITERA");

      let html = `
        <section class="kpi-grid">
          <div class="kpi-card"><span>KALINI Shipment</span><strong>${fmt(kaliniShip)}</strong></div>
          <div class="kpi-card"><span>KALINI Recall</span><strong>${fmt(kaliniRecall)}</strong></div>
          <div class="kpi-card"><span>KALINI Stock</span><strong>${fmt(kaliniStock)}</strong></div>

          <div class="kpi-card"><span>Mitera Shipment</span><strong>${fmt(miteraShip)}</strong></div>
          <div class="kpi-card"><span>Mitera Recall</span><strong>${fmt(miteraRecall)}</strong></div>
          <div class="kpi-card"><span>Mitera Stock</span><strong>${fmt(miteraStock)}</strong></div>
        </section>

        <section class="panel">

          <div style="padding:16px;display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr));align-items:end;">
            <div>
              <label style="font-size:12px;color:#666;">Sales Days</label>
              <select id="salesDays">
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </select>
            </div>

            <div>
              <label style="font-size:12px;color:#666;">Target Cover</label>
              <select id="coverDays">
                <option value="45">45</option>
                <option value="60">60</option>
                <option value="90">90</option>
                <option value="120">120</option>
              </select>
            </div>

            <div>
              <label style="font-size:12px;color:#666;">Recall Trigger</label>
              <select id="recallDays">
                <option value="60">60</option>
                <option value="90">90</option>
                <option value="120">120</option>
              </select>
            </div>

            <div>
              <label style="font-size:12px;color:#666;">Sort</label>
              <select id="sorSort">
                <option value="sales">Sales High to Low</option>
                <option value="projection">Projection High to Low</option>
                <option value="ship">Shipment High to Low</option>
                <option value="recall">Recall High to Low</option>
                <option value="stock">Stock High to Low</option>
              </select>
            </div>
          </div>

          <div style="margin:0 16px 16px 16px;padding:12px;border-radius:10px;background:#f6f7f9;font-size:13px;">
            <strong>Brand Scope:</strong> KALINI + Mitera
            &nbsp;|&nbsp;
            <strong>Period:</strong> ${data.startDate} to ${data.endDate}
            &nbsp;|&nbsp;
            <strong>Window:</strong> ${SALES_DAYS} Days
          </div>

          <div style="padding:0 16px 16px 16px;">
            <label style="font-size:12px;color:#666;">Search</label>
            <input id="sorSearch" value="${QUERY}" placeholder="Style / ERP SKU / Brand">
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
                  <th>Net</th>
                  <th>DRR</th>
                  <th>SOR Stock</th>
                  <th>SC</th>
                  <th>Projection</th>
                  <th>Shipment</th>
                  <th>Recall</th>
                </tr>
              </thead>
              <tbody>
      `;

      if (!show.length) {
        html += `<tr><td colspan="12">No data</td></tr>`;
      } else {
        show.forEach(r => {
          html += `
            <tr>
              <td>${r.style_id}</td>
              <td>${r.erp_sku}</td>
              <td>${r.status}</td>
              <td>${r.brand}</td>
              <td>${fmt(r.rating)}</td>
              <td>${fmt(r.net)}</td>
              <td>${fmt(r.drr)}</td>
              <td>${fmt(r.stock)}</td>
              <td>${Number(r.sc) >= 999999 ? "∞" : fmt(r.sc)}</td>
              <td>${fmt(r.projectionQty)}</td>
              <td>${fmt(r.shipmentQty)}</td>
              <td>${fmt(r.recallQty)}</td>
            </tr>
          `;
        });
      }

      html += `
              </tbody>
            </table>
          </div>
      `;

      if (rows.length > LIMIT) {
        html += `<button id="sorMore" class="load-more">Load More</button>`;
      }

      html += `</section>`;

      root.innerHTML = html;

      document.getElementById("salesDays").value = SALES_DAYS;
      document.getElementById("coverDays").value = COVER_DAYS;
      document.getElementById("recallDays").value = RECALL_DAYS;
      document.getElementById("sorSort").value = SORT;

      document.getElementById("salesDays").onchange = e => {
        SALES_DAYS = Number(e.target.value);
        window.SOR_SALES_DAYS = SALES_DAYS;
        LIMIT = 50;
        window.renderSORTab();
      };

      document.getElementById("coverDays").onchange = e => {
        COVER_DAYS = Number(e.target.value);
        window.SOR_COVER_DAYS = COVER_DAYS;
        LIMIT = 50;
        window.renderSORTab();
      };

      document.getElementById("recallDays").onchange = e => {
        RECALL_DAYS = Number(e.target.value);
        window.SOR_RECALL_DAYS = RECALL_DAYS;
        LIMIT = 50;
        window.renderSORTab();
      };

      document.getElementById("sorSort").onchange = e => {
        SORT = e.target.value;
        LIMIT = 50;
        window.renderSORTab();
      };

      document.getElementById("sorSearch").oninput = e => {
        clearTimeout(TIMER);

        TIMER = setTimeout(() => {
          QUERY = e.target.value.trim();
          LIMIT = 50;
          window.renderSORTab();
        }, 300);
      };

      const more = document.getElementById("sorMore");

      if (more) {
        more.onclick = () => {
          LIMIT += 50;
          window.renderSORTab();
        };
      }
    } catch (err) {
      root.innerHTML = `
        <section class="panel" style="padding:16px;color:red;">
          <h3>SOR Error</h3>
          <pre>${err.message}</pre>
        </section>
      `;
    }
  };
}