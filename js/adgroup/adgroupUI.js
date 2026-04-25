import { buildAdgroupReport } from "./adgroupEngine.js";

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

export function initAdgroupTab() {
  window.renderAdgroupTab = () => {
    const rows = window.FILTERED_ROWS || window.ALL || [];
    const root = document.getElementById("adgroup");

    const data = buildAdgroupReport(rows);

    const body = data.map(r => {
      const ctr = r.impressions
        ? (r.clicks / r.impressions) * 100
        : 0;

      const cvr = r.clicks
        ? (r.units / r.clicks) * 100
        : 0;

      const cpc = r.clicks
        ? r.spend / r.clicks
        : 0;

      const rowRoi = roi(r.revenue, r.spend);

      return `
        <tr>
          <td>${r.name}</td>
          <td>${fmt(r.spend)}</td>
          <td>${fmt(r.impressions)}</td>
          <td>${fmt(r.clicks)}</td>
          <td>${fmt(ctr)}%</td>
          <td>${fmt(cvr)}%</td>
          <td>${fmt(cpc)}</td>
          <td>${fmt(r.units)}</td>
          <td>${fmt(r.revenue)}</td>
          <td>${fmt(rowRoi)}x</td>
        </tr>
      `;
    }).join("");

    root.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h3>Adgroup Report</h3>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Adgroup Name</th>
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
              ${body}
            </tbody>
          </table>
        </div>
      </section>
    `;
  };
}