import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildStyleEyeData } from "./styleEyeEngine.js";

let READY = false;

let SALES = [];
let RETURNS = [];
let MASTER = [];
let SJIT = [];
let SOR = [];
let CPR = [];
let TRAFFIC = [];

async function ensureData() {
  if (READY) return;

  const files = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.RETURNS),
    fetchCSV(SHEETS.PRODUCT_MASTER),
    fetchCSV(SHEETS.SJIT_STOCK),
    fetchCSV(SHEETS.SOR_STOCK),
    fetchCSV(SHEETS.CPR),
    fetchCSV(SHEETS.TRAFFIC)
  ]);

  SALES = parseCSV(files[0]);
  RETURNS = parseCSV(files[1]);
  MASTER = parseCSV(files[2]);
  SJIT = parseCSV(files[3]);
  SOR = parseCSV(files[4]);
  CPR = parseCSV(files[5]);
  TRAFFIC = parseCSV(files[6]);

  READY = true;
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function pct(n) {
  return fmt(n) + "%";
}

function card(label, value) {
  return `
    <div class="kpi-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function rowGrid(items) {
  return `
    <section class="kpi-grid">
      ${items.join("")}
    </section>
  `;
}

function renderSingle(root, d) {
  const sorNA = d.inventory.sor.na;

  root.innerHTML = `
    <section class="panel" style="padding:16px;">
      <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;">
        <div>
          <div style="font-size:28px;font-weight:800;line-height:1;">
            ${d.style_id}
          </div>

          <div style="margin-top:8px;font-size:13px;color:#666;">
            ${d.brand} | ${d.erp_sku} | ${d.status} | Rating ${fmt(d.rating)}
          </div>
        </div>

        <a
          href="https://www.myntra.com/${d.style_id}"
          target="_blank"
          class="load-more"
          style="text-decoration:none;text-align:center;"
        >
          Go
        </a>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h3>Sales Pulse</h3></div>

      ${rowGrid([
        card("GMV","₹"+fmt(d.sales.gmv)),
        card("Gross Units",fmt(d.sales.gross)),
        card("Net Units",fmt(d.sales.net)),
        card("ASP","₹"+fmt(d.sales.asp)),
        card("Return %",pct(d.sales.returnPct))
      ])}

      ${rowGrid([
        card("DRR",fmt(d.sales.drr)),
        card("Growth %",pct(d.sales.growthPct))
      ])}
    </section>

    <section class="panel">
      <div class="panel-head"><h3>Inventory Pulse</h3></div>

      ${rowGrid([
        card("SJIT Stock",fmt(d.inventory.sjit.stock)),
        card("SJIT SC",Number(d.inventory.sjit.sc)>=999999?"∞":fmt(d.inventory.sjit.sc)),
        card("SJIT Projection",fmt(d.inventory.sjit.projection)),
        card("SJIT Recall",fmt(d.inventory.sjit.recall))
      ])}

      ${rowGrid([
        card("SOR Stock",sorNA?"N/A":fmt(d.inventory.sor.stock)),
        card("SOR SC",sorNA?"N/A":(Number(d.inventory.sor.sc)>=999999?"∞":fmt(d.inventory.sor.sc))),
        card("SOR Projection",sorNA?"N/A":fmt(d.inventory.sor.projection)),
        card("SOR Recall",sorNA?"N/A":fmt(d.inventory.sor.recall))
      ])}
    </section>

    <section class="panel">
      <div class="panel-head"><h3>Ads Pulse</h3></div>

      ${rowGrid([
        card("Spend","₹"+fmt(d.ads.spend)),
        card("Ads Units",fmt(d.ads.units)),
        card("Revenue","₹"+fmt(d.ads.revenue)),
        card("ROI",fmt(d.ads.roi)+"x")
      ])}

      ${rowGrid([
        card("Impressions",fmt(d.ads.impressions)),
        card("Clicks",fmt(d.ads.clicks)),
        card("CTR",pct(d.ads.ctr)),
        card("CVR",pct(d.ads.cvr))
      ])}
    </section>

    <section class="panel">
      <div class="panel-head"><h3>Quality Pulse</h3></div>

      ${rowGrid([
        card("Top Return Reason",d.quality.topReason),
        card("Risk",d.quality.risk)
      ])}
    </section>

    <section class="panel">
      <div class="panel-head"><h3>Action Engine</h3></div>

      <div style="padding:16px;display:grid;gap:10px;">
        ${d.actions.map(function(a){
          return `
            <div style="padding:12px;border:1px solid #eee;border-radius:12px;">
              ${a}
            </div>
          `;
        }).join("")}
      </div>
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
              <th>Dive</th>
            </tr>
          </thead>

          <tbody>
            ${d.options.map(function(r){
              return `
                <tr>
                  <td>${r.style_id}</td>
                  <td>${r.brand}</td>
                  <td>${r.status}</td>
                  <td>
                    <button class="load-more eyePick" data-style="${r.style_id}">
                      Open
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  root.querySelectorAll(".eyePick").forEach(function(btn){
    btn.onclick = function(){
      document.getElementById("eyeQuery").value = btn.dataset.style;
      window.runStyleEye();
    };
  });
}

export function initStyleEyeTab() {
  window.renderStyleEyeTab = async function () {
    const root = document.getElementById("styleeye");

    root.innerHTML = `
      <section class="panel" style="padding:16px;">
        <h3 style="margin-top:0;">Style Eye</h3>

        <div style="display:grid;grid-template-columns:1fr auto;gap:12px;">
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

    window.runStyleEye = function () {
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
          sorRows: SOR,
          masterRows: MASTER,
          cprRows: CPR,
          trafficRows: TRAFFIC
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

    document.getElementById("eyeDive").onclick = function () {
      window.runStyleEye();
    };
  };
}