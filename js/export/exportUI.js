import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { exportReport } from "./exportEngine.js";

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

  /* CORE */
  load("CPR_ROWS", SHEETS.CPR);
  load("PPR_ROWS", SHEETS.PPR);

  /* SALES (for sales export) */
  load("SALES_ROWS", SHEETS.SALES);
  load("RETURN_ROWS", SHEETS.RETURNS);
  load("MASTER_ROWS", SHEETS.PRODUCT_MASTER);

  /* SJIT / SOR */
  load("TRAFFIC_ROWS", SHEETS.TRAFFIC);
  load("SJIT_STOCK_ROWS", SHEETS.SJIT_STOCK);
  load("SOR_STOCK_ROWS", SHEETS.SOR_STOCK);

  await Promise.all(tasks);

  LOADING = false;
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

            <option value="sales">Sales Report</option>

            <option value="sjit">SJIT Planner</option>
            <option value="sor">SOR Planner</option>
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
      exportReport(TYPE);
    };
  };
}