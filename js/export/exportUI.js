import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { exportReport } from "./exportEngine.js";
import { buildSJITDebug } from "../sjit/sjitEngine.js";
import { buildSORDebug } from "../sor/sorEngine.js";

let LOADING = false;
let TYPE = "campaign";

async function ensureData() {
  if (LOADING) return;
  LOADING = true;

  const jobs = [];

  const load = (key, url) => {
    if (!window[key]) {
      jobs.push(
        fetchCSV(url).then(t => {
          window[key] = parseCSV(t);
        })
      );
    }
  };

  load("CPR_ROWS", SHEETS.CPR);
  load("PPR_ROWS", SHEETS.PPR);

  load("SJIT_SALES", SHEETS.SALES);
  load("SJIT_RETURNS", SHEETS.RETURNS);
  load("SJIT_TRAFFIC", SHEETS.TRAFFIC);
  load("SJIT_STOCK", SHEETS.SJIT_STOCK);
  load("SJIT_MASTER", SHEETS.PRODUCT_MASTER);
  load("SJIT_SOR", SHEETS.SOR_STOCK);

  await Promise.all(jobs);

  LOADING = false;
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(name, rows) {
  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL(url);
}

function metaRows(out, title, cfg, data, rows, scope = "") {
  out.push(["Report Name", title]);
  out.push(["Generated At", new Date().toLocaleString()]);
  out.push(["Sales Days", cfg.salesDays]);
  out.push(["Target Cover Days", cfg.coverDays]);
  out.push(["Recall Trigger Days", cfg.recallDays]);
  out.push(["Period Start", data.startDate]);
  out.push(["Period End", data.endDate]);

  if (scope) out.push(["Brand Scope", scope]);

  out.push(["Total Styles", rows.length]);
  out.push(["Total Projection Qty", rows.reduce((s, r) => s + r.projectionQty, 0)]);
  out.push(["Total Shipment Qty", rows.reduce((s, r) => s + r.shipmentQty, 0)]);
  out.push(["Total Recall Qty", rows.reduce((s, r) => s + r.recallQty, 0)]);
  out.push([]);
}

function addHeaders(out, stockLabel) {
  out.push([
    "Style ID",
    "ERP SKU",
    "Status",
    "Brand",
    "Launch Date",
    "Live Date",
    "Rating",
    "Gross",
    "Returns",
    "Net",
    "Return %",
    "DRR",
    stockLabel,
    "SC",
    "Projection Qty",
    "Shipment Qty",
    "Recall Qty"
  ]);
}

function addRows(out, rows) {
  rows.forEach(r => {
    out.push([
      r.style_id,
      r.erp_sku,
      r.status,
      r.brand,
      r.launch_date,
      r.live_date,
      r.rating,
      r.gross,
      r.returns,
      r.net,
      r.returnPct,
      r.drr,
      r.stock,
      r.sc,
      r.projectionQty,
      r.shipmentQty,
      r.recallQty
    ]);
  });
}

function exportSJIT() {
  const cfg = {
    salesDays: Number(window.SJIT_SALES_DAYS || 30),
    coverDays: Number(window.SJIT_COVER_DAYS || 45),
    recallDays: Number(window.SJIT_RECALL_DAYS || 60)
  };

  const data = buildSJITDebug(
    {
      salesRows: window.SJIT_SALES,
      returnRows: window.SJIT_RETURNS,
      trafficRows: window.SJIT_TRAFFIC,
      stockRows: window.SJIT_STOCK,
      masterRows: window.SJIT_MASTER,
      sorRows: window.SJIT_SOR
    },
    cfg
  );

  const out = [];
  metaRows(out, "SJIT Planner Export", cfg, data, data.rows);
  addHeaders(out, "SJIT Stock");
  addRows(out, data.rows);

  downloadCSV(
    `SJIT_Planner_${cfg.salesDays}D_${cfg.coverDays}C_${cfg.recallDays}R.csv`,
    out
  );
}

function exportSOR() {
  const cfg = {
    salesDays: Number(window.SOR_SALES_DAYS || 30),
    coverDays: Number(window.SOR_COVER_DAYS || 45),
    recallDays: Number(window.SOR_RECALL_DAYS || 60)
  };

  const data = buildSORDebug(
    {
      salesRows: window.SJIT_SALES,
      returnRows: window.SJIT_RETURNS,
      trafficRows: window.SJIT_TRAFFIC,
      stockRows: window.SJIT_SOR,
      masterRows: window.SJIT_MASTER
    },
    cfg
  );

  const out = [];
  metaRows(
    out,
    "SOR Planner Export",
    cfg,
    data,
    data.rows,
    "KALINI + Mitera"
  );

  addHeaders(out, "SOR Stock");
  addRows(out, data.rows);

  downloadCSV(
    `SOR_Planner_${cfg.salesDays}D_${cfg.coverDays}C_${cfg.recallDays}R.csv`,
    out
  );
}

export function initExportTab() {
  window.renderExportTab = async () => {
    const root = document.getElementById("export");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading export center...</div></section>`;

    await ensureData();

    root.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h3>Export Center</h3>
        </div>

        <div style="padding:16px;display:grid;gap:14px;max-width:520px;margin:auto;">

          <div>
            <label style="display:block;font-size:12px;color:#666;margin-bottom:6px;">
              Select Report
            </label>

            <select id="exportType">
              <option value="datewise">Date Wise</option>
              <option value="campaign">Campaign</option>
              <option value="adgroup">Adgroup</option>
              <option value="placement">Placement</option>
              <option value="style">Product ID</option>
              <option value="analysis">Analysis</option>
              <option value="sjit">SJIT Planner</option>
              <option value="sor">SOR Planner</option>
            </select>
          </div>

          <button id="doExport" class="load-more">
            Export CSV
          </button>

          <div style="font-size:12px;color:#666;text-align:center;">
            Export downloads full data based on current filters / planner settings.
          </div>

        </div>
      </section>
    `;

    const type = document.getElementById("exportType");
    const btn = document.getElementById("doExport");

    type.value = TYPE;

    type.onchange = e => {
      TYPE = e.target.value;
    };

    btn.onclick = () => {
      if (TYPE === "sjit") return exportSJIT();
      if (TYPE === "sor") return exportSOR();

      exportReport(TYPE);
    };
  };
}