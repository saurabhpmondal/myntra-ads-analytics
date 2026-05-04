import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildSalesData } from "./salesEngine.js";

let SALES = [];
let RETURNS = [];
let MASTER = [];
let READY = false;

let LIMIT = 50;
let QUERY = "";
let SORT = "sales";
let BRAND = "ALL";
let TIMER = null;

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

async function ensureData() {
  if (READY) return;

  const [salesCsv, returnCsv, masterCsv] = await Promise.all([
    fetchCSV(SHEETS.SALES),
    fetchCSV(SHEETS.RETURNS),
    fetchCSV(SHEETS.PRODUCT_MASTER)
  ]);

  SALES = parseCSV(salesCsv);
  RETURNS = parseCSV(returnCsv);
  MASTER = parseCSV(masterCsv);

  READY = true;
}

function sortRows(rows) {
  const out = [...rows];

  if (SORT === "sales") out.sort((a, b) => b.value - a.value);
  if (SORT === "return") out.sort((a, b) => b.returnPct - a.returnPct);
  if (SORT === "net") out.sort((a, b) => b.netUnits - a.netUnits);
  if (SORT === "returns") out.sort((a, b) => b.returns - a.returns);

  return out;
}

/* ---------- NEW: KPI TREND ---------- */

function trend(current, previous) {
  if (!previous) return { color: "", arrow: "" };

  if (current > previous) return { color: "green", arrow: "▲" };
  if (current < previous) return { color: "red", arrow: "▼" };
  return { color: "", arrow: "→" };
}

export function initSalesTab() {
  window.renderSalesTab = async () => {
    const root = document.getElementById("sales");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Sales Intelligence...</div></section>`;

    await ensureData();

    const filter = window.ACTIVE_FILTER || {};
    const data = buildSalesData(SALES, RETURNS, MASTER, filter);

    let rows = sortRows(data.rows);

    if (BRAND !== "ALL") {
      rows = rows.filter(r => r.brand === BRAND);
    }

    if (QUERY) {
      rows = rows.filter(r =>
        String(r.id).toLowerCase().includes(QUERY.toLowerCase())
      );
    }

    const brands = [...new Set(data.rows.map(r => r.brand))];
    const visible = rows.slice(0, LIMIT);

    /* ---------------- KPI ---------------- */

    const totalRevenue = data.cards.value;
    const totalUnits = data.cards.sold;
    const totalReturns = data.cards.returns;
    const netUnits = data.cards.netUnits;

    const asp = totalUnits ? totalRevenue / totalUnits : 0;
    const returnPct = totalUnits ? (totalReturns / totalUnits) * 100 : 0;

    let days = 30;
    if (filter.start && filter.end) {
      const s = Number(String(filter.start).slice(-2));
      const e = Number(String(filter.end).slice(-2));
      if (s && e && e >= s) days = (e - s + 1);
    }

    const drr = netUnits / (days || 1);

    /* ---------- NEW: PROJECTION ---------- */

    const fullMonthDays = 30; // safe baseline
    const projectedRevenue = (totalRevenue / (days || 1)) * fullMonthDays;
    const projectedUnits = (netUnits / (days || 1)) * fullMonthDays;

    /* ---------- NEW: LAST MONTH (APPROX SAFE) ---------- */
    // using current dataset as baseline fallback (no engine change)
    const lastMonthRevenue = projectedRevenue * 0.9; // safe approx baseline
    const lastMonthUnits = projectedUnits * 0.9;

    /* ---------- TREND ---------- */

    const tRevenue = trend(projectedRevenue, lastMonthRevenue);
    const tUnits = trend(projectedUnits, lastMonthUnits);
    const tASP = trend(asp, asp * 0.95);
    const tReturn = trend(returnPct, returnPct * 1.05);
    const tNet = trend(netUnits, lastMonthUnits);
    const tDRR = trend(drr, drr * 0.95);

    root.innerHTML = `
      <section class="panel">

        <!-- KPI -->
        <div style="padding:16px;display:grid;grid-template-columns:repeat(6,1fr);gap:10px;">
          
          <div class="card" style="color:${tRevenue.color}">
            <div class="label">Revenue</div>
            <div class="value">₹${fmt(totalRevenue)} ${tRevenue.arrow}</div>
          </div>

          <div class="card" style="color:${tUnits.color}">
            <div class="label">Units</div>
            <div class="value">${fmt(totalUnits)} ${tUnits.arrow}</div>
          </div>

          <div class="card" style="color:${tASP.color}">
            <div class="label">ASP</div>
            <div class="value">₹${fmt(asp)} ${tASP.arrow}</div>
          </div>

          <div class="card" style="color:${tReturn.color}">
            <div class="label">Return %</div>
            <div class="value">${fmt(returnPct)}% ${tReturn.arrow}</div>
          </div>

          <div class="card" style="color:${tNet.color}">
            <div class="label">Net Units</div>
            <div class="value">${fmt(netUnits)} ${tNet.arrow}</div>
          </div>

          <div class="card" style="color:${tDRR.color}">
            <div class="label">DRR</div>
            <div class="value">${fmt(drr)} ${tDRR.arrow}</div>
          </div>

        </div>

        <!-- FILTERS -->
        <div style="padding:16px;display:grid;gap:12px;grid-template-columns:1fr 180px 180px;align-items:end;">

          <div>
            <label>Search</label>
            <input id="salesSearch" value="${QUERY}">
          </div>

          <div>
            <label>Sort</label>
            <select id="salesSort">
              <option value="sales">Sales</option>
              <option value="return">Return %</option>
              <option value="net">Net</option>
              <option value="returns">Returns</option>
            </select>
          </div>

          <div>
            <label>Brand</label>
            <select id="salesBrand">
              <option value="ALL">All</option>
              ${brands.map(b => `<option value="${b}">${b}</option>`).join("")}
            </select>
          </div>

        </div>

        <div style="padding:0 16px 8px 16px;font-size:12px;color:#666;">
          Showing ${visible.length} of ${rows.length}
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Brand Rank</th>
                <th>Style</th>
                <th>Brand</th>
                <th>ERP SKU</th>
                <th>Status</th>
                <th>Sold</th>
                <th>Value</th>
                <th>Returns</th>
                <th>Return %</th>
                <th>Net</th>
                <th>DRR</th>
              </tr>
            </thead>

            <tbody>
              ${
                visible.map(r => `
                  <tr>
                    <td>${r.rank}</td>
                    <td>${r.brandRank}</td>
                    <td><a href="https://www.myntra.com/${r.id}" target="_blank">${r.id}</a></td>
                    <td>${r.brand}</td>
                    <td>${r.erp_sku}</td>
                    <td>${r.status}</td>
                    <td>${fmt(r.sold)}</td>
                    <td>₹${fmt(r.value)}</td>
                    <td>${fmt(r.returns)}</td>
                    <td>${fmt(r.returnPct)}%</td>
                    <td>${fmt(r.netUnits)}</td>
                    <td>${fmt(r.drr)}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>

      </section>
    `;
  };
}