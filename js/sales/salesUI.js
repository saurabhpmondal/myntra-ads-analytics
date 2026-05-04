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
let FLAG = "ALL"; // ✅ NEW
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

/* KPI */
function card(label, value) {
  return `
    <div class="kpi-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

export function initSalesTab() {
  window.renderSalesTab = async () => {
    const root = document.getElementById("sales");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Sales Intelligence...</div></section>`;

    await ensureData();

    const filter = window.ACTIVE_FILTER || {};
    const current = buildSalesData(SALES, RETURNS, MASTER, filter);

    let rows = sortRows(current.rows);

    /* BRAND FILTER */
    if (BRAND !== "ALL") {
      rows = rows.filter(r => r.brand === BRAND);
    }

    /* FLAG FILTER ✅ */
    if (FLAG !== "ALL") {
      rows = rows.filter(r => r.flag === FLAG);
    }

    /* SEARCH */
    if (QUERY) {
      rows = rows.filter(r =>
        String(r.id).toLowerCase().includes(QUERY.toLowerCase())
      );
    }

    const brands = [...new Set(current.rows.map(r => r.brand))];

    /* FLAG OPTIONS ✅ */
    const flags = [
      "High Return Low Sale",
      "High Return",
      "Low Sale",
      "Dead Inventory",
      "Rising Returns",
      "Best Pricing",
      "Normal"
    ];

    const visible = rows.slice(0, LIMIT);

    /* KPI */
    const totalRevenue = current.cards.value;
    const totalUnits = current.cards.sold;
    const asp = totalUnits ? totalRevenue / totalUnits : 0;

    /* UI */
    root.innerHTML = `
      <section class="panel">

        <!-- KPI -->
        <section class="kpi-grid">
          ${card("Revenue", "₹" + fmt(totalRevenue))}
          ${card("Units", fmt(totalUnits))}
          ${card("ASP", "₹" + fmt(asp))}
        </section>

        <!-- FILTERS -->
        <div style="padding:16px;display:grid;gap:12px;grid-template-columns:1fr 160px 160px 180px;align-items:end;">

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

          <!-- NEW FLAG FILTER -->
          <div>
            <label>Flag</label>
            <select id="salesFlag">
              <option value="ALL">All</option>
              ${flags.map(f => `<option value="${f}">${f}</option>`).join("")}
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
                <th>Flag</th> <!-- ✅ NEW -->
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
                        <td>${r.flag}</td> <!-- ✅ NEW -->
                      </tr>
                    `).join("")
                  : `<tr><td colspan="13">No data</td></tr>`
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
    document.getElementById("salesFlag").value = FLAG; // ✅ NEW

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

    /* FLAG FILTER EVENT ✅ */
    document.getElementById("salesFlag").onchange = e => {
      FLAG = e.target.value;
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