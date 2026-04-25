import { buildCampaignReport } from "./campaignEngine.js";

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function roi(rev, spend) {
  return spend ? rev / spend : 0;
}

export function initCampaignTab() {
  window.renderCampaignTab = () => {
    const rows = window.FILTERED_ROWS || window.ALL || [];

    const root = document.getElementById("campaign");

    const data = buildCampaignReport(rows);

    root.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h3>Campaign Report</h3>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign Name</th>
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
              ${data.map(r => `
                <tr>
                  <td>${r.name}</td>
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
      </section>
    `;
  };
}