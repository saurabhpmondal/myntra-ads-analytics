import { buildStyleReport } from "./styleEngine.js";

let LIMIT = 50;
let SEARCH = "";
let LOADING = false;

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

async function ensureCPR() {
  if (window.CPR_ROWS) return;
  if (LOADING) return;

  LOADING = true;

  const [{ SHEETS }, fetcher, parser] = await Promise.all([
    import("/js/config/sheets.js"),
    import("/js/core/fetcher.js"),
    import("/js/core/parser.js")
  ]);

  const csv = await fetcher.fetchCSV(SHEETS.CPR);
  window.CPR_ROWS = parser.parseCSV(csv);

  LOADING = false;
}

export function initStyleTab() {
  window.renderStyleTab = async () => {
    const root = document.getElementById("style");

    root.innerHTML = `
      <section class="panel">
        <div class="loading">Loading style data...</div>
      </section>
    `;

    await ensureCPR();

    const rows = (window.CPR_ROWS || []).filter(r =>
      Number(r.year) === Number(window.ACTIVE_FILTER?.year || 0) &&
      Number(r.month) === Number(window.ACTIVE_FILTER?.month || 0)
    );

    const data = buildStyleReport(rows).filter(r =>
      SEARCH
        ? String(r.id).toLowerCase().includes(SEARCH.toLowerCase())
        : true
    );

    const visible = data.slice(0, LIMIT);

    root.innerHTML = `
      <section class="panel">

        <div class="panel-head">
          <h3>Style Report</h3>
        </div>

        <div style="padding:12px;">
          <input
            id="styleSearch"
            placeholder="Search Style ID"
            value="${SEARCH}"
            style="width:100%;height:42px;border:1px solid #ddd;border-radius:10px;padding:0 10px;"
          >

          <div style="margin-top:8px;font-size:12px;color:#666;">
            Showing ${visible.length} of ${data.length} styles
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>Name</th>
                <th>Brand</th>
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
                  <td>${r.id}</td>
                  <td>${r.name}</td>
                  <td>${r.brand}</td>
                  <td>${fmt(r.spend)}</td>
                  <td>${fmt(r.impressions)}</td>
                  <td>${fmt(r.clicks)}</td>
                  <td>${fmt(r.impressions ? (r.clicks/r.impressions)*100 : 0)}%</td>
                  <td>${fmt(r.clicks ? (r.units/r.clicks)*100 : 0)}%</td>
                  <td>${fmt(r.clicks ? r.spend/r.clicks : 0)}</td>
                  <td>${fmt(r.units)}</td>
                  <td>${fmt(r.revenue)}</td>
                  <td>${fmt(roi(r.revenue,r.spend))}x</td>
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

    document.getElementById("styleSearch").oninput = e => {
      SEARCH = e.target.value;
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