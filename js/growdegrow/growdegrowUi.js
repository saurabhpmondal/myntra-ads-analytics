import { buildGrowDegrow } from "./growDegrowEngine.js";

export function initGrowDegrowTab() {

  window.renderGrowDegrowTab = () => {

    const root = document.getElementById("growdegrow");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Growth Report...</div></section>`;

    const salesRows = window.SALES_ROWS || []; // 🔥 GUARANTEED SAFE
    const filter = window.ACTIVE_FILTER || {};

    const { rows, days } = buildGrowDegrow({
      salesRows,
      filter
    });

    /* TABLE BUILD */

    const head = `
      <tr>
        <th>Style ID</th>
        ${days.map(d => `<th>${d}</th>`).join("")}
      </tr>
    `;

    const body = rows.map(r => `
      <tr>
        <td>${r.style_id}</td>
        ${days.map(d => `<td>${r.daily[d] || ""}</td>`).join("")}
      </tr>
    `).join("");

    root.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h3>Grow / Degrow Report</h3>
        </div>

        <div class="table-wrap">
          <table>
            <thead>${head}</thead>
            <tbody>
              ${body || `<tr><td colspan="${days.length+1}">No data</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  };
}