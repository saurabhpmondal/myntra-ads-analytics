import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildBusinessData, buildBrandDailyMatrix } from "./businessEngine.js";

let READY = false;
let SALES = [];
let STOCK = [];

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

async function ensureData() {
  if (READY) return;

  const [salesCsv, stockCsv] = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.SJIT_STOCK)
  ]);

  SALES = parseCSV(salesCsv);
  STOCK = parseCSV(stockCsv);

  READY = true;
}

function table(title, heads, rows) {
  return `
    <section class="panel">
      <div class="panel-head"><h3>${title}</h3></div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="${heads.length}">No data</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function initBusinessTab() {
  window.renderBusinessTab = async function () {
    const root = document.getElementById("business");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Business Summary...</div></section>`;

    await ensureData();

    const data = buildBusinessData({
      salesRows: SALES,
      stockRows: STOCK
    });

    const matrix = buildBrandDailyMatrix(SALES);

    root.innerHTML = `
      ${table(
        "Brand Wise",
        ["Brand","Units","Revenue","Share %"],
        data.brands.map(r => `
          <tr>
            <td>${r.brand}</td>
            <td>${fmt(r.units)}</td>
            <td>₹${fmt(r.revenue)}</td>
            <td>${fmt(r.share)}%</td>
          </tr>
        `).join("")
      )}

      ${table(
        "PO Type Wise",
        ["PO Type","Units","Revenue","Share %"],
        data.pos.map(r => `
          <tr>
            <td>${r.po}</td>
            <td>${fmt(r.units)}</td>
            <td>₹${fmt(r.revenue)}</td>
            <td>${fmt(r.share)}%</td>
          </tr>
        `).join("")
      )}

      ${table(
        "Warehouse Performance",
        ["Warehouse","Stock","Sales","Sell Through %"],
        data.warehouses.map(r => `
          <tr>
            <td>${r.warehouse}</td>
            <td>${fmt(r.stock)}</td>
            <td>${fmt(r.sales)}</td>
            <td>${fmt(r.sellThrough)}%</td>
          </tr>
        `).join("")
      )}

      ${table(
        "Brand Daily Performance",
        ["Date", ...matrix.brands],
        matrix.rows.map(r => `
          <tr>
            <td>${r.date}</td>
            ${r.brands.map(v=>`<td>${v}</td>`).join("")}
          </tr>
        `).join("")
      )}
    `;
  };
}