import { buildGrowthData } from "./growthEngine.js";

let DATA = null;

export function initGrowDegrowTab() {

  window.renderGrowDegrowTab = async () => {

    const root = document.getElementById("growdegrow");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Growth...</div></section>`;

    if (!DATA) {
      DATA = await buildGrowthData();
    }

    const { rows, days } = DATA;

    let html = `
      <section class="panel">
        <div class="panel-head">
          <h3>Growth Report</h3>
        </div>

        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>ERP SKU</th>
                <th>Brand</th>
                <th>Status</th>
                <th>M-2</th>
                <th>M-1</th>
                <th>Current</th>
                ${days.map(d=>`<th>${d}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
    `;

    rows.slice(0,100).forEach(r=>{

      html += `<tr>
        <td>${r.style_id}</td>
        <td>${r.erp_sku}</td>
        <td>${r.brand}</td>
        <td>${r.status}</td>
        <td>${r.m2}</td>
        <td>${r.m1}</td>
        <td>${r.m0}</td>
      `;

      days.forEach((d,i)=>{

        const v = r.days[d] || 0;
        const prev = r.days[d-1] || 0;

        let color = "";

        if (i > 0) {
          color = v > prev ? "green" : "red";
        }

        html += `<td style="color:${color}">${v}</td>`;
      });

      html += `</tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>
      </section>
    `;

    root.innerHTML = html;
  };
}