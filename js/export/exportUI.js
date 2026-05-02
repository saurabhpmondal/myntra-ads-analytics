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

  const tasks = [];

  function load(key, url) {
    if (!window[key]) {
      tasks.push(
        fetchCSV(url).then(txt => {
          window[key] = parseCSV(txt);
        })
      );
    }
  }

  load("CPR_ROWS", SHEETS.CPR);
  load("PPR_ROWS", SHEETS.PPR);

  load("SJIT_SALES", SHEETS.SALES);
  load("SJIT_RETURNS", SHEETS.RETURNS);
  load("SJIT_TRAFFIC", SHEETS.TRAFFIC);
  load("SJIT_STOCK", SHEETS.SJIT_STOCK);
  load("SJIT_MASTER", SHEETS.PRODUCT_MASTER);
  load("SJIT_SOR", SHEETS.SOR_STOCK);

  await Promise.all(tasks);

  LOADING = false;
}

function csv(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function download(name, rows) {
  const text = rows.map(r => r.map(csv).join(",")).join("\n");

  const blob = new Blob([text], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL(url);
}

function exportSJIT() {
  const cfg = {
    salesDays: Number(window.SJIT_SALES_DAYS || 30),
    coverDays: Number(window.SJIT_COVER_DAYS || 45),
    recallDays: Number(window.SJIT_RECALL_DAYS || 60)
  };

  const res = buildSJITDebug(
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

  out.push(["Report", "SJIT Planner"]);
  out.push(["Generated", new Date().toLocaleString()]);
  out.push(["Sales Days", cfg.salesDays]);
  out.push(["Cover Days", cfg.coverDays]);
  out.push(["Recall Days", cfg.recallDays]);
  out.push([]);

  out.push([
    "Style ID",
    "ERP SKU",
    "Brand",
    "Status",
    "Net",
    "DRR",
    "Stock",
    "SC",
    "Projection Qty",
    "Shipment Qty",
    "Recall Qty"
  ]);

  res.rows.forEach(r => {
    out.push([
      r.style_id,
      r.erp_sku,
      r.brand,
      r.status,
      r.net,
      r.drr,
      r.stock,
      r.sc,
      r.projectionQty,
      r.shipmentQty,
      r.recallQty
    ]);
  });

  download("SJIT_Planner.csv", out);
}

function exportSOR(brandName) {
  const cfg = {
    salesDays: Number(window.SOR_SALES_DAYS || 30),
    coverDays: Number(window.SOR_COVER_DAYS || 45),
    recallDays: Number(window.SOR_RECALL_DAYS || 60)
  };

  const res = buildSORDebug(
    {
      salesRows: window.SJIT_SALES,
      returnRows: window.SJIT_RETURNS,
      trafficRows: window.SJIT_TRAFFIC,
      stockRows: window.SJIT_SOR,
      masterRows: window.SJIT_MASTER
    },
    cfg
  );

  const rows = res.rows.filter(r =>
    String(r.brand || "").trim().toUpperCase() === brandName.toUpperCase()
  );

  const out = [];

  out.push(["Report", `${brandName} SOR Planner`]);
  out.push(["Generated", new Date().toLocaleString()]);
  out.push(["Brand Scope", brandName]);
  out.push(["Sales Days", cfg.salesDays]);
  out.push(["Cover Days", cfg.coverDays]);
  out.push(["Recall Days", cfg.recallDays]);
  out.push([]);

  out.push([
    "Style ID",
    "ERP SKU",
    "Brand",
    "Status",
    "Net",
    "DRR",
    "Stock",
    "SC",
    "Projection Qty",
    "Shipment Qty",
    "Recall Qty"
  ]);

  rows.forEach(r => {
    out.push([
      r.style_id,
      r.erp_sku,
      r.brand,
      r.status,
      r.net,
      r.drr,
      r.stock,
      r.sc,
      r.projectionQty,
      r.shipmentQty,
      r.recallQty
    ]);
  });

  download(`${brandName}_SOR_Planner.csv`, out);
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

          <select id="exportType">
            <option value="datewise">Date Wise</option>
            <option value="campaign">Campaign</option>
            <option value="adgroup">Adgroup</option>
            <option value="placement">Placement</option>
            <option value="style">Product ID</option>
            <option value="analysis">Analysis</option>
            <option value="sjit">SJIT Planner</option>
            <option value="sor_kalini">SOR Planner - KALINI</option>
            <option value="sor_mitera">SOR Planner - Mitera</option>
          </select>

          <button id="doExport" class="load-more">
            Export CSV
          </button>

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
      if (TYPE === "sor_kalini") return exportSOR("KALINI");
      if (TYPE === "sor_mitera") return exportSOR("Mitera");

      exportReport(TYPE);
    };
  };
}