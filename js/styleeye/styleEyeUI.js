import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildStyleEyeData } from "./styleEyeEngine.js";

let READY = false;

let SALES = [];
let RETURNS = [];
let MASTER = [];
let SJIT = [];

async function ensureData() {
  if (READY) return;

  const files = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.RETURNS),
    fetchCSV(SHEETS.PRODUCT_MASTER),
    fetchCSV(SHEETS.SJIT_STOCK)
  ]);

  SALES = parseCSV(files[0]);
  RETURNS = parseCSV(files[1]);
  MASTER = parseCSV(files[2]);
  SJIT = parseCSV(files[3]);

  READY = true;
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function card(label, value) {
  return `
    <div class="kpi-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderSingle(root, d) {
  root.innerHTML = `
    <section class="panel" style="padding:16px;">
      <div style="display:grid;gap:12px;grid-template-columns:1fr auto;">
        <div>
          <h3 style="margin:0;">Style ${d.style_id}</h3>
          <div style="font-size:13px;color:#666;margin-top:6px;">
            ${d.brand} | ${d.erp_sku} | ${d.status}
          </div>
        </div>

        <a class="load-more"
           style="text-decoration:none;text-align:center;"
           target="_blank"
           href="https://www.myntra.com/${d.style_id}">
          Go
        </a>
      </div>
    </section>

    <section class="kpi-grid">
      ${card("Overall Rank", "#" + d.ranking.overall)}
      ${card("Brand Rank", "#" + d.ranking.brand)}
      ${card("Launch", d.launch_date || "-")}
      ${card("Live", d.live_date || "-")}
    </section>

    <section class="panel">
      <div class="panel-head"><h3>Sales Pulse</h3></div>
      <section class="kpi-grid">
        ${card("GMV", "₹" + fmt(d.sales.gmv))}
        ${card("Net Units", fmt(d.sales.net))}
        ${card("ASP", "₹" + fmt(d.sales.asp))}
        ${card("DRR", fmt(d.sales.drr))}
        ${card("Return %", fmt(d.sales.returnPct) + "%")}
        ${card("Gross", fmt(d.sales.gross))}
      </section>
    </section>

    <section class="panel">
      <div class="panel-head"><h3>Inventory Pulse</h3></div>
      <section class="kpi-grid">
        ${card("SJIT Stock", fmt(d.inventory.stock))}
      </section>
    </section>
  `;
}

function renderMulti(root, d) {
  root.innerHTML = `
    <section class="panel" style="padding:16px;">
      <h3>Multiple Styles Found</h3>
      <div style="font-size:13px;color:#666;margin-bottom:12px;">
        ERP SKU: ${d.erp_sku}
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Style ID</th>
              <th>Brand</th>
              <th>Status</th>
              <th>Units</th>
              <th>Dive</th>
            </tr>
          </thead>
          <tbody>
            ${d.options.map(r => `
              <tr>
                <td>${r.style_id}</td>
                <td>${r.brand}</td>
                <td>${r.status}</td>
                <td>${fmt(r.units)}</td>
                <td>
                  <button class="load-more eyePick"
                    data-style="${r.style_id}">
                    Open
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  root.querySelectorAll(".eyePick").forEach(btn => {
    btn.onclick = () => {
      document.getElementById("eyeQuery").value = btn.dataset.style;
      window.runStyleEye?.();
    };
  });
}

export function initStyleEyeTab() {
  window.renderStyleEyeTab = async function () {
    const root = document.getElementById("styleeye");

    root.innerHTML = `
      <section class="panel" style="padding:16px;">
        <h3 style="margin-top:0;">Style Eye</h3>

        <div style="display:grid;gap:12px;grid-template-columns:1fr auto;">
          <input id="eyeQuery" placeholder="Enter Style ID or ERP SKU">
          <button id="eyeDive" class="load-more">Dive</button>
        </div>

        <div style="margin-top:10px;font-size:12px;color:#666;">
          Search by Style ID or ERP SKU
        </div>
      </section>

      <div id="eyeResult"></div>
    `;

    await ensureData();

    window.runStyleEye = () => {
      const q = document.getElementById("eyeQuery").value.trim();
      const box = document.getElementById("eyeResult");

      if (!q) {
        box.innerHTML = "";
        return;
      }

      const data = buildStyleEyeData(
        {
          salesRows: SALES,
          returnRows: RETURNS,
          stockRows: SJIT,
          masterRows: MASTER
        },
        q
      );

      if (data.type === "not_found") {
        box.innerHTML = `
          <section class="panel" style="padding:16px;">
            Style not found.
          </section>
        `;
        return;
      }

      if (data.type === "multi") {
        renderMulti(box, data);
        return;
      }

      renderSingle(box, data);
    };

    document.getElementById("eyeDive").onclick = () => {
      window.runStyleEye();
    };
  };
}