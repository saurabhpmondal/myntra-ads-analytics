import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";

let SALES = [];
let MASTER = [];
let READY = false;

async function ensureData() {
  if (READY) return;

  const [salesCsv, masterCsv] = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.PRODUCT_MASTER)
  ]);

  SALES = parseCSV(salesCsv);
  MASTER = parseCSV(masterCsv);

  console.log("SALES SAMPLE", SALES.slice(0, 5));
  console.log("MASTER SAMPLE", MASTER.slice(0, 5));

  READY = true;
}

export function initGrowDegrowTab() {
  window.renderGrowDegrowTab = async () => {
    const root = document.getElementById("growdegrow");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Growth Report...</div></section>`;

    await ensureData();

    /* 🔥 STATIC HEADERS (FOR DEBUG) */
    const days = Array.from({ length: 10 }, (_, i) => i + 1);
    const months = ["Feb", "Mar", "Apr"];

    let html = `
      <section class="panel">
        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>ERP SKU</th>
                <th>Status</th>
                ${months.map(m => `<th>${m}</th>`).join("")}
                ${days.map(d => `<th>${d}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="100%">Debug Mode Active</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `;

    root.innerHTML = html;
  };
}