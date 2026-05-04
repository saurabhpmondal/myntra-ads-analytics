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

/* ---------- CLEAN TREND (NO COLOR) ---------- */
function trend(current, previous) {
  if (!previous) return "";

  if (current > previous) return "▲";
  if (current < previous) return "▼";
  return "→";
}

function getPrevMonthFilter(filter) {
  const f = { ...filter };

  let m = Number(filter.month);
  let y = Number(filter.year);

  if (!m || !y) return f;

  m = m - 1;
  if (m === 0) {
    m = 12;
    y = y - 1;
  }

  f.month = m;
  f.year = y;

  return f;
}

export function initSalesTab() {
  window.renderSalesTab = async () => {
    const root = document.getElementById("sales");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Sales Intelligence...</div></section>`;

    await ensureData();

    const filter = window.ACTIVE_FILTER || {};

    const current = buildSalesData(SALES, RETURNS, MASTER, filter);
    const prevFilter = getPrevMonthFilter(filter);
    const previous = buildSalesData(SALES, RETURNS, MASTER, prevFilter);

    let rows = sortRows(current.rows);

    if (BRAND !== "ALL") {
      rows = rows.filter(r => r.brand === BRAND);
    }

    if (QUERY) {
      rows = rows.filter(r =>
        String(r.id).toLowerCase().includes(QUERY.toLowerCase())
      );
    }

    const brands = [...new Set(current.rows.map(r => r.brand))];
    const visible = rows.slice(0, LIMIT);

    /* ---------- KPI ---------- */

    const totalRevenue = current.cards.value;
    const totalUnits = current.cards.sold;
    const totalReturns = current.cards.returns;
    const netUnits = current.cards.netUnits;

    const prevRevenue = previous.cards.value;
    const prevUnits = previous.cards.sold;
    const prevReturns = previous.cards.returns;
    const prevNet = previous.cards.netUnits;

    const asp = totalUnits ? totalRevenue / totalUnits : 0;
    const prevAsp = prevUnits ? prevRevenue / prevUnits : 0;

    const returnPct = totalUnits ? (totalReturns / totalUnits) * 100 : 0;
    const prevReturnPct = prevUnits ? (prevReturns / prevUnits) * 100 : 0;

    let days = 30;
    if (filter.start && filter.end) {
      const s = Number(String(filter.start).slice(-2));
      const e = Number(String(filter.end).slice(-2));
      if (s && e && e >= s) days = (e - s + 1);
    }

    const drr = netUnits / (days || 1);
    const prevDRR = prevNet / 30;

    const fullMonthDays = 30;

    const projectedRevenue = (totalRevenue / (days || 1)) * fullMonthDays;
    const projectedUnits = (netUnits / (days || 1)) * fullMonthDays;

    /* ---------- UI ---------- */

    root.innerHTML = `
      <section class="panel">

        <!-- NEW CLEAN KPI (ADDED) -->
        <div style="padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          
          <div class="card">
            <div class="label">Revenue</div>
            <div class="value">₹${fmt(totalRevenue)}</div>
          </div>

          <div class="card">
            <div class="label">Units</div>
            <div class="value">${fmt(totalUnits)}</div>
          </div>

          <div class="card">
            <div class="label">ASP</div>
            <div class="value">₹${fmt(asp)}</div>
          </div>

        </div>

        <!-- CLEAN KPI -->
        <div style="padding:16px;display:grid;grid-template-columns:repeat(6,1fr);gap:10px;">
          
          <div class="card">
            <div class="label">Revenue</div>
            <div class="value">₹${fmt(totalRevenue)} ${trend(projectedRevenue, prevRevenue)}</div>
          </div>

          <div class="card">
            <div class="label">Units</div>
            <div class="value">${fmt(totalUnits)} ${trend(projectedUnits, prevUnits)}</div>
          </div>

          <div class="card">
            <div class="label">ASP</div>
            <div class="value">₹${fmt(asp)} ${trend(asp, prevAsp)}</div>
          </div>

          <div class="card">
            <div class="label">Return %</div>
            <div class="value">${fmt(returnPct)}% ${trend(returnPct, prevReturnPct)}</div>
          </div>

          <div class="card">
            <div class="label">Net Units</div>
            <div class="value">${fmt(netUnits)} ${trend(netUnits, prevNet)}</div>
          </div>

          <div class="card">
            <div class="label">DRR</div>
            <div class="value">${fmt(drr)} ${trend(drr, prevDRR)}</div>
          </div>

        </div>

        <!-- ORIGINAL FILTERS (UNCHANGED) -->
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
                visible.length
                  ? visible.map(r => `
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
                    `).join("")
                  : `<tr><td colspan="12">No data</td></tr>`
              }
            </tbody>
          </table>
        </div>

        ${
          rows.length > LIMIT
            ? `<button id="salesMore" class="load-more">Load More</button>`
            : ""
        }

      </section>
    `;

    document.getElementById("salesSort").value = SORT;
    document.getElementById("salesBrand").value = BRAND;

    document.getElementById("salesSort").onchange = e => {
      SORT = e.target.value;
      LIMIT = 50;
      window.renderSalesTab();
    };

    document.getElementById("salesBrand").onchange = e => {
      BRAND = e.target.value;
      LIMIT = 50;
      window.renderSalesTab();
    };

    document.getElementById("salesSearch").oninput = e => {
      clearTimeout(TIMER);
      TIMER = setTimeout(() => {
        QUERY = e.target.value;
        LIMIT = 50;
        window.renderSalesTab();
      }, 300);
    };

    const more = document.getElementById("salesMore");

    if (more) {
      more.onclick = () => {
        LIMIT += 50;
        window.renderSalesTab();
      };
    }
  };
}