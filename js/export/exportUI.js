import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { exportReport } from "./exportEngine.js";
import { buildSJITDebug } from "../sjit/sjitEngine.js";

let LOADING = false;
let TYPE = "campaign";

async function ensureData() {
  if (
    window.CPR_ROWS &&
    window.PPR_ROWS &&
    window.SJIT_SALES &&
    window.SJIT_RETURNS &&
    window.SJIT_TRAFFIC &&
    window.SJIT_STOCK &&
    window.SJIT_MASTER &&
    window.SJIT_SOR
  ) return;

  if (LOADING) return;

  LOADING = true;

  const jobs = [];

  if (!window.CPR_ROWS) {
    jobs.push(
      fetchCSV(SHEETS.CPR).then(t => {
        window.CPR_ROWS = parseCSV(t);
      })
    );
  }

  if (!window.PPR_ROWS) {
    jobs.push(
      fetchCSV(SHEETS.PPR).then(t => {
        window.PPR_ROWS = parseCSV(t);
      })
    );
  }

  if (!window.SJIT_SALES) {
    jobs.push(fetchCSV(SHEETS.SALES).then(t => window.SJIT_SALES = parseCSV(t)));
    jobs.push(fetchCSV(SHEETS.RETURNS).then(t => window.SJIT_RETURNS = parseCSV(t)));
    jobs.push(fetchCSV(SHEETS.TRAFFIC).then(t => window.SJIT_TRAFFIC = parseCSV(t)));
    jobs.push(fetchCSV(SHEETS.SJIT_STOCK).then(t => window.SJIT_STOCK = parseCSV(t)));
    jobs.push(fetchCSV(SHEETS.PRODUCT_MASTER).then(t => window.SJIT_MASTER = parseCSV(t)));
    jobs.push(fetchCSV(SHEETS.SOR_STOCK).then(t => window.SJIT_SOR = parseCSV(t)));
  }

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

function exportSJIT() {
  const salesDays = Number(window.SJIT_SALES_DAYS || 30);
  const coverDays = Number(window.SJIT_COVER_DAYS || 45);
  const recallDays = Number(window.SJIT_RECALL_DAYS || 60);

  const data = buildSJITDebug(
    {
      salesRows: window.SJIT_SALES,
      returnRows: window.SJIT_RETURNS,
      trafficRows: window.SJIT_TRAFFIC,
      stockRows: window.SJIT_STOCK,
      masterRows: window.SJIT_MASTER,
      sorRows: window.SJIT_SOR
    },
    {
      salesDays,
      coverDays,
      recallDays
    }
  );

  const rows = data.rows;

  const totalProjection = rows.reduce((s, r) => s + r.projectionQty, 0);
  const totalShipment = rows.reduce((s, r) => s + r.shipmentQty, 0);
  const totalRecall = rows.reduce((s, r) => s + r.recallQty, 0);

  const out = [];

  out.push(["Report Name", "SJIT Planner Export"]);
  out.push(["Generated At", new Date().toLocaleString()]);
  out.push(["Sales Days", salesDays]);
  out.push(["Target Cover Days", coverDays]);
  out.push(["Recall Trigger Days", recallDays]);
  out.push(["Period Start", data.startDate]);
  out.push(["Period End", data.endDate]);
  out.push(["Based On", "Latest available sales date"]);
  out.push(["Total Styles", rows.length]);
  out.push(["Total Projection Qty", totalProjection]);
  out.push(["Total Shipment Qty", totalShipment]);
  out.push(["Total Recall Qty", totalRecall]);
  out.push([]);
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

  downloadCSV(
    `SJIT_Planner_${salesDays}D_${coverDays}C_${recallDays}R.csv`,
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
            </select>
          </div>

          <button id="doExport" class="load-more">
            Export CSV
          </button>

          <div style="font-size:12px;color:#666;text-align:center;">
            Export downloads the full table data based on current filters / planner settings.
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
      if (TYPE === "sjit") {
        exportSJIT();
      } else {
        exportReport(TYPE);
      }
    };
  };
}