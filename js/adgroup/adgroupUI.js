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
              ${data.map(r => `
                <tr>
                  <td>${r.name}</td>
                  <td>${fmt(r.spend)}</td>
                  <td>${fmt