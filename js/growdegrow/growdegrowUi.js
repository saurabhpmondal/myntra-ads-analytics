import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildGrowDegrow } from "./growdegrowEngine.js";

let SALES = [];
let MASTER = [];
let READY = false;

let LIMIT = 50;

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

async function ensureData() {
  if (READY) return;

  const [salesCsv, masterCsv] = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.PRODUCT_MASTER)
  ]);

  SALES = parseCSV(salesCsv);
  MASTER = parseCSV(masterCsv);

  READY = true;
}

export function initGrowDegrowTab() {
  window.renderGrowDegrowTab = async () => {
    const root = document.getElementById("growdegrow");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Growth Report...</div></section>`;

    await ensureData();

    const data = buildGrowDegrow(SALES, MASTER);

    const show = data.rows.slice(0, LIMIT);

    let html = `
      <section class="panel">
        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>ERP SKU</th>
                <th>Status</th>
                ${data.days.map(d => `<th>${d}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
    `;

    if (!show.length) {
      html += `<tr><td colspan="100%">No data</td></tr>`;
    } else {
      show.forEach(r => {
        html += `<tr>
          <td>${r.style_id}</td>
          <td>${r.erp_sku}</td>
          <td>${r.status}</td>
        `;

        data.days.forEach(d => {
          const val = r.daily[d] || 0;
          const prev = r.daily[d - 1] || 0;

          let color = "";

          if (d > 1) {
            if (val > prev) color = "color:green;font-weight:600;";
            else if (val < prev) color = "color:red;font-weight:600;";
          }

          html += `<td style="${color}">${fmt(val)}</td>`;
        });

        html += `</tr>`;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
    `;

    if (data.rows.length > LIMIT) {
      html += `<button id="growMore" class="load-more">Load More</button>`;
    }

    html += `</section>`;

    root.innerHTML = html;

    const more = document.getElementById("growMore");

    if (more) {
      more.onclick = () => {
        LIMIT += 50;
        window.renderGrowDegrowTab();
      };
    }
  };
}