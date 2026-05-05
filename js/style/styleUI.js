import { buildStyleReport } from "./styleEngine.js";
import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildSalesData } from "../sales/salesEngine.js";

let LIMIT = 50;
let SEARCH = "";
let LOADING = false;
let SEARCH_TIMER = null;

function num(v) {
  return Number(String(v ?? "").trim());
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

/* ---------- LOADERS ---------- */

async function ensureCPR() {
  if (window.CPR_ROWS) return;
  if (LOADING) return;

  LOADING = true;

  const csv = await fetchCSV(SHEETS.CPR);
  window.CPR_ROWS = parseCSV(csv);

  LOADING = false;
}

async function ensureSalesMaster() {
  const tasks = [];

  if (!window.SALES_ROWS) {
    tasks.push(
      fetchCSV(SHEETS.SALES).then(txt => {
        window.SALES_ROWS = parseCSV(txt);
      })
    );
  }

  if (!window.RETURN_ROWS) {
    tasks.push(
      fetchCSV(SHEETS.RETURNS).then(txt => {
        window.RETURN_ROWS = parseCSV(txt);
      })
    );
  }

  if (!window.MASTER_ROWS) {
    tasks.push(
      fetchCSV(SHEETS.PRODUCT_MASTER).then(txt => {
        window.MASTER_ROWS = parseCSV(txt);
      })
    );
  }

  await Promise.all(tasks);
}

/* ---------- FILTER ---------- */

function getLiveFilters() {
  const fy = document.getElementById("fy");
  const fm = document.getElementById("fm");

  return {
    year: num(fy ? fy.value : 0),
    month: num(fm ? fm.value : 0)
  };
}

function getFilteredRows() {
  const active = getLiveFilters();

  return (window.CPR_ROWS || []).filter(r =>
    num(r.year) === active.year &&
    num(r.month) === active.month
  );
}

/* ---------- INIT ---------- */

export function initStyleTab() {
  window.renderStyleTab = async () => {
    const root = document.getElementById("style");

    root.innerHTML = `
      <section class="panel">
        <div class="loading">Loading style data...</div>
      </section>
    `;

    await ensureCPR();
    await ensureSalesMaster();

    const rows = getFilteredRows();
    const report = buildStyleReport(rows);

    /* ---------- MASTER MAP ONLY (KEEP) ---------- */

    const masterMap = {};
    (window.MASTER_ROWS || []).forEach(r => {
      masterMap[String(r.style_id).trim()] = r;
    });

    /* ---------- MERGE (REMOVED RANKS ONLY) ---------- */

    const enriched = report.map(r => {
      const m = masterMap[r.id] || {};

      return {
        ...r,
        launch: m.launch_date || "",
        live: m.live_date || ""
      };
    });

    const data = enriched.filter(r =>
      SEARCH
        ? String(r.id).toLowerCase().includes(SEARCH.toLowerCase())
        : true
    );

    const visible = data.slice(0, LIMIT);

    /* ---------- UI ---------- */

    root.innerHTML = `
      <section class="panel">

        <div class="panel-head">
          <h3>Style Report</h3>
        </div>

        <!-- CENTER SEARCH -->
        <div style="padding:12px;display:flex;justify-content:center;gap:8px;">
          <input
            id="styleSearch"
            placeholder="Search Style ID"
            value="${SEARCH}"
            style="width:260px;height:36px;border:1px solid #ddd;border-radius:8px;padding:0 10px;"
          >
          <button id="clearSearch" class="load-more" style="height:36px;">Clear</button>
        </div>

        <div style="padding:0 12px 8px 12px;font-size:12px;color:#666;text-align:center;">
          Showing ${visible.length} of ${data.length} styles
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>Launch</th>
                <th>Live</th>

                <th>Spend</th>
                <th>Impr</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>CVR</th>
                <th>CPC</th>
                <th>Units</th>
                <th>Revenue</th>
                <th>ROI</th>
              </tr>
            </thead>

            <tbody>
              ${visible.map(r => `
                <tr>
                  <td>
                    <a href="https://www.myntra.com/${r.id}" target="_blank">
                      ${r.id}
                    </a>
                  </td>

                  <td>${r.launch}</td>
                  <td>${r.live}</td>

                  <td>${fmt(r.spend)}</td>
                  <td>${fmt(r.impressions)}</td>
                  <td>${fmt(r.clicks)}</td>
                  <td>${fmt(r.impressions ? (r.clicks / r.impressions) * 100 : 0)}%</td>
                  <td>${fmt(r.clicks ? (r.units / r.clicks) * 100 : 0)}%</td>
                  <td>${fmt(r.clicks ? r.spend / r.clicks : 0)}</td>
                  <td>${fmt(r.units)}</td>
                  <td>${fmt(r.revenue)}</td>
                  <td>${fmt(roi(r.revenue, r.spend))}x</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        ${visible.length < data.length
          ? `<button class="load-more" id="styleMore">Load More</button>`
          : ""}

      </section>
    `;

    /* ---------- EVENTS ---------- */

    const search = document.getElementById("styleSearch");
    const clear = document.getElementById("clearSearch");

    search.oninput = e => {
      const val = e.target.value;

      clearTimeout(SEARCH_TIMER);

      SEARCH_TIMER = setTimeout(() => {
        SEARCH = val;
        LIMIT = 50;
        window.renderStyleTab();
      }, 300);
    };

    clear.onclick = () => {
      SEARCH = "";
      LIMIT = 50;
      window.renderStyleTab();
    };

    const more = document.getElementById("styleMore");

    if (more) {
      more.onclick = () => {
        LIMIT += 50;
        window.renderStyleTab();
      };
    }
  };
}