import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildSalesData } from "./salesEngine.js";

let SALES = [];
let RETURNS = [];
let READY = false;

async function ensureData() {
  if (READY) return;

  const [salesCsv, returnCsv] = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.RETURNS)
  ]);

  SALES = parseCSV(salesCsv);
  RETURNS = parseCSV(returnCsv);

  READY = true;
}

function esc(v) {
  return String(v ?? "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function initSalesTab() {
  window.renderSalesTab = async () => {
    const root = document.getElementById("sales");

    root.innerHTML =
      `<section class="panel"><div class="loading">Debug Loading Sales...</div></section>`;

    try {
      await ensureData();

      const filter = window.ACTIVE_FILTER || {};

      const data = buildSalesData(SALES, RETURNS, filter);
      const dbg = data.cards?.debug || {};

      const salesKeys =
        SALES.length ? Object.keys(SALES[0]).join(", ") : "NO SALES ROWS";

      const returnKeys =
        RETURNS.length ? Object.keys(RETURNS[0]).join(", ") : "NO RETURN ROWS";

      root.innerHTML = `
        <section class="panel" style="padding:16px;">
          <h3>Sales Debug Panel</h3>

          <p><strong>Sales Rows:</strong> ${SALES.length}</p>
          <p><strong>Return Rows:</strong> ${RETURNS.length}</p>

          <p><strong>Filtered Result Rows:</strong> ${data.rows.length}</p>

          <p><strong>Cards Sold:</strong> ${data.cards?.sold || 0}</p>
          <p><strong>Cards Returns:</strong> ${data.cards?.returns || 0}</p>

          <hr>

          <h4>Engine Counters</h4>

          <p><strong>Total Sales:</strong> ${dbg.totalSales || 0}</p>
          <p><strong>After Valid Sale:</strong> ${dbg.afterValidSale || 0}</p>
          <p><strong>After Filter:</strong> ${dbg.afterFilter || 0}</p>
          <p><strong>After Style:</strong> ${dbg.afterStyle || 0}</p>
          <p><strong>After Order:</strong> ${dbg.afterOrder || 0}</p>
          <p><strong>Matched Returns:</strong> ${dbg.matchedReturns || 0}</p>

          <hr>

          <p><strong>Sales First Row Keys:</strong></p>
          <div style="font-size:12px;word-break:break-word;">${esc(salesKeys)}</div>

          <br>

          <p><strong>Return First Row Keys:</strong></p>
          <div style="font-size:12px;word-break:break-word;">${esc(returnKeys)}</div>

          <hr>

          <p><strong>Active Filter:</strong></p>
          <pre style="white-space:pre-wrap;">${esc(JSON.stringify(filter, null, 2))}</pre>

          <hr>

          <p><strong>First Result Row:</strong></p>
          <pre style="white-space:pre-wrap;">${esc(JSON.stringify(data.rows[0] || {}, null, 2))}</pre>
        </section>
      `;
    } catch (err) {
      root.innerHTML = `
        <section class="panel" style="padding:16px;color:red;">
          <h3>Sales Debug Error</h3>
          <pre style="white-space:pre-wrap;">${esc(err?.stack || err?.message || err)}</pre>
        </section>
      `;
    }
  };
}