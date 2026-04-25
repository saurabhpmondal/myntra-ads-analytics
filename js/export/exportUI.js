import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { exportReport } from "./exportEngine.js";

let LOADING = false;
let TYPE = "campaign";

async function ensureData() {
  if (window.CPR_ROWS && window.PPR_ROWS) return;
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

  await Promise.all(jobs);

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
            </select>
          </div>

          <button id="doExport" class="load-more">
            Export CSV
          </button>

          <div style="font-size:12px;color:#666;text-align:center;">
            Export downloads the full table data based on current filters.
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
      exportReport(TYPE);
    };
  };
}