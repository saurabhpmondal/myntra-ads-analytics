import { buildGrowthData } from "./growthEngine.js";

let DATA = null;

function fmtPct(v){
  return `${v.toFixed(1)}%`;
}

export function initGrowDegrowTab(){

  window.renderGrowDegrowTab = async () => {

    const root = document.getElementById("growdegrow");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading Growth...</div></section>`;

    if(!DATA) DATA = await buildGrowthData();

    const { rows, days, months } = DATA;

    const today = days.length;

    let html = `
      <section class="panel">
        <div class="panel-head"><h3>Growth Report</h3></div>
        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Style</th>
                <th>SKU</th>
                <th>Brand</th>
                <th>Status</th>
                <th>${months.prev2}</th>
                <th>${months.prev1}</th>
                <th>${months.current}</th>
                <th>% Growth</th>
                <th>DRR</th>
                <th>Projection</th>
                ${days.map(d=>`<th>${d}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
    `;

    rows.slice(0,100).forEach(r=>{

      const drr = today ? (r.m0 / today) : 0;
      const proj = drr * months.currentMonthDays;

      const projColor = proj > r.m1 ? "green" : "red";
      const growthColor = r.growth > 0 ? "green" : r.growth < 0 ? "red" : "gray";

      html += `<tr>
        <td>${r.style_id}</td>
        <td>${r.erp_sku}</td>
        <td>${r.brand}</td>
        <td>${r.status}</td>
        <td>${r.m2}</td>
        <td>${r.m1}</td>
        <td>${r.m0}</td>
        <td style="color:${growthColor}">${fmtPct(r.growth)}</td>
        <td>${drr.toFixed(1)}</td>
        <td style="color:${projColor}">${proj.toFixed(0)}</td>
      `;

      days.forEach((d,i)=>{
        const v = r.days[d] || 0;
        const prev = r.days[d-1] || 0;

        let color = "";
        if(i>0){
          if(v>prev) color="green";
          else if(v<prev) color="red";
          else color="gray";
        }

        html += `<td style="color:${color}">${v}</td>`;
      });

      html += `</tr>`;
    });

    html += `</tbody></table></div></section>`;

    root.innerHTML = html;
  };
}