import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";

import {
  buildBusinessData,
  buildBrandDailyMatrix,
  buildDailyUnitsMatrix,
  buildProjectionMatrix
} from "./businessEngine.js";

let READY = false;
let SALES = [];
let STOCK = [];

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function monthName(n) {
  const map = [
    "",
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC"
  ];

  return map[n] || "";
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

    /* KEEP EXISTING ENGINE CALLS */
    buildBrandDailyMatrix(SALES);

    const dailyUnits = buildDailyUnitsMatrix(SALES);
    const projection = buildProjectionMatrix(SALES);

    /* ---------- SPLIT PO & BRAND ---------- */

    const poColumns = [];
    const brandColumns = [];

    dailyUnits.columns.forEach(c => {

      const isPO =
        c.toUpperCase() === "PPMP" ||
        c.toUpperCase() === "SJIT" ||
        c.toUpperCase() === "SOR";

      if (isPO) poColumns.push(c);
      else brandColumns.push(c);
    });

    /* ---------- BUILD TABLES ---------- */

    function brandRows() {

      let html = data.brands.map(r => `
        <tr>
          <td>${r.brand}</td>
          <td>${fmt(r.units)}</td>
          <td>₹${fmt(r.revenue)}</td>
          <td>${fmt(r.share)}%</td>
          <td>₹${fmt(r.units ? r.revenue / r.units : 0)}</td>
        </tr>
      `).join("");

      html += `
        <tr style="font-weight:bold;background:#f5f5f5;">
          <td>Total</td>
          <td>${fmt(data.totals.units)}</td>
          <td>₹${fmt(data.totals.revenue)}</td>
          <td>100%</td>
          <td>₹${fmt(data.totals.units ? data.totals.revenue / data.totals.units : 0)}</td>
        </tr>
      `;

      return html;
    }

    function poRows() {

      let totalUnits = 0;
      let totalRevenue = 0;

      let html = data.pos.map(r => {

        totalUnits += r.units;
        totalRevenue += r.revenue;

        return `
          <tr>
            <td>${r.po}</td>
            <td>${fmt(r.units)}</td>
            <td>₹${fmt(r.revenue)}</td>
            <td>${fmt(r.share)}%</td>
            <td>₹${fmt(r.units ? r.revenue / r.units : 0)}</td>
          </tr>
        `;
      }).join("");

      html += `
        <tr style="font-weight:bold;background:#f5f5f5;">
          <td>Total</td>
          <td>${fmt(totalUnits)}</td>
          <td>₹${fmt(totalRevenue)}</td>
          <td>100%</td>
          <td>₹${fmt(totalUnits ? totalRevenue / totalUnits : 0)}</td>
        </tr>
      `;

      return html;
    }

    /* ---------- DAILY UNITS ---------- */

    function dailyUnitsTable() {

      return `
        <section class="panel">

          <div class="panel-head">
            <h3>Daily Units</h3>
          </div>

          <div class="table-wrap">

            <table>

              <thead>

                <tr>

                  <th rowspan="2">Date</th>
                  <th rowspan="2">Total</th>

                  <th colspan="${poColumns.length}">
                    PO TYPE
                  </th>

                  <th colspan="${brandColumns.length}">
                    BRANDS
                  </th>

                </tr>

                <tr>

                  ${poColumns.map(c => `
                    <th>${c}</th>
                  `).join("")}

                  ${brandColumns.map(c => `
                    <th>${c}</th>
                  `).join("")}

                </tr>

              </thead>

              <tbody>

                ${dailyUnits.rows.map(r => {

                  const poTotal =
                    poColumns.reduce((s, c) => {

                      const idx = dailyUnits.columns.indexOf(c);

                      return s + (r.values[idx] || 0);

                    }, 0);

                  return `
                    <tr>

                      <td>${r.date}</td>

                      <td style="font-weight:600;">
                        ${fmt(poTotal)}
                      </td>

                      ${poColumns.map(c => {

                        const idx = dailyUnits.columns.indexOf(c);

                        return `
                          <td>${fmt(r.values[idx] || 0)}</td>
                        `;
                      }).join("")}

                      ${brandColumns.map(c => {

                        const idx = dailyUnits.columns.indexOf(c);

                        return `
                          <td>${fmt(r.values[idx] || 0)}</td>
                        `;
                      }).join("")}

                    </tr>
                  `;
                }).join("")}

                <tr style="font-weight:bold;background:#f5f5f5;">

                  <td>Grand Total</td>

                  <td>
                    ${fmt(
                      poColumns.reduce((s, c) => {

                        const idx = dailyUnits.columns.indexOf(c);

                        return s + (dailyUnits.totals[idx] || 0);

                      }, 0)
                    )}
                  </td>

                  ${poColumns.map(c => {

                    const idx = dailyUnits.columns.indexOf(c);

                    return `
                      <td>${fmt(dailyUnits.totals[idx] || 0)}</td>
                    `;
                  }).join("")}

                  ${brandColumns.map(c => {

                    const idx = dailyUnits.columns.indexOf(c);

                    return `
                      <td>${fmt(dailyUnits.totals[idx] || 0)}</td>
                    `;
                  }).join("")}

                </tr>

              </tbody>

            </table>

          </div>

        </section>
      `;
    }

    /* ---------- PROJECTION TABLE ---------- */

    function projectionTable() {

      const currentMonth = monthName(projection.currentMonth);
      const previousMonth = monthName(projection.previousMonth);

      return `
        <section class="panel">

          <div class="panel-head">
            <h3>Projections</h3>
          </div>

          <div class="table-wrap">

            <table>

              <thead>

                <tr>

                  <th rowspan="2">MONTH</th>

                  <th colspan="${2 + poColumns.length}">
                    PO TYPE
                  </th>

                  <th colspan="${brandColumns.length}">
                    BRANDS
                  </th>

                </tr>

                <tr>

                  ${projection.columns.map(c => `
                    <th>${c}</th>
                  `).join("")}

                </tr>

              </thead>

              <tbody>

                <tr>

                  <td>${currentMonth} (MTD)</td>

                  ${projection.mtd.map(v => `
                    <td>${fmt(v)}</td>
                  `).join("")}

                </tr>

                <tr>

                  <td>${currentMonth} (PDS)</td>

                  ${projection.pds.map(v => `
                    <td>${fmt(v)}</td>
                  `).join("")}

                </tr>

                <tr>

                  <td>${currentMonth} (PROJ)</td>

                  ${projection.proj.map(v => `
                    <td>${fmt(v)}</td>
                  `).join("")}

                </tr>

                <tr>

                  <td>${previousMonth}</td>

                  ${projection.prevMonthValues.map(v => `
                    <td>${fmt(v)}</td>
                  `).join("")}

                </tr>

                <tr style="font-weight:bold;">

                  <td>STATUS</td>

                  ${projection.status.map(v => {

                    const color =
                      v > 0 ? "green" :
                      v < 0 ? "red" :
                      "";

                    return `
                      <td style="color:${color}">
                        ${fmt(v)}%
                      </td>
                    `;
                  }).join("")}

                </tr>

              </tbody>

            </table>

          </div>

        </section>
      `;
    }

    /* ---------- FINAL ---------- */

    root.innerHTML = `

      ${dailyUnitsTable()}

      ${projectionTable()}

      <section class="panel">

        <div class="panel-head">
          <h3>Brand Wise</h3>
        </div>

        <div class="table-wrap">

          <table>

            <thead>
              <tr>
                <th>Brand</th>
                <th>Units</th>
                <th>Revenue</th>
                <th>Share %</th>
                <th>ASP</th>
              </tr>
            </thead>

            <tbody>
              ${brandRows()}
            </tbody>

          </table>

        </div>

      </section>

      <section class="panel">

        <div class="panel-head">
          <h3>PO Type Wise</h3>
        </div>

        <div class="table-wrap">

          <table>

            <thead>
              <tr>
                <th>PO Type</th>
                <th>Units</th>
                <th>Revenue</th>
                <th>Share %</th>
                <th>ASP</th>
              </tr>
            </thead>

            <tbody>
              ${poRows()}
            </tbody>

          </table>

        </div>

      </section>

      <section class="panel">

        <div class="panel-head">
          <h3>Warehouse Performance</h3>
        </div>

        <div class="table-wrap">

          <table>

            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Stock</th>
                <th>Sales</th>
                <th>Sell Through %</th>
              </tr>
            </thead>

            <tbody>

              ${data.warehouses.map(r => `
                <tr>
                  <td>${r.warehouse}</td>
                  <td>${fmt(r.stock)}</td>
                  <td>${fmt(r.sales)}</td>
                  <td>${fmt(r.sellThrough)}%</td>
                </tr>
              `).join("")}

            </tbody>

          </table>

        </div>

      </section>
    `;
  };
}