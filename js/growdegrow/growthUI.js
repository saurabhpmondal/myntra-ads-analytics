import { buildGrowthData } from "./growthEngine.js";

let DATA = null;
let viewMode = "none";

function fmtPct(v){
  return `${v.toFixed(1)}%`;
}

export function initGrowDegrowTab(){

  window.renderGrowDegrowTab = async () => {

    const root = document.getElementById("growdegrow");

    if(!DATA) DATA = await buildGrowthData();

    const { rows, days, prev1DaysArr, prev2DaysArr, months } = DATA;

    let html = `
      <section class="panel">
        <div class="panel-head" style="display:flex;justify-content:space-between;align-items:center;">
          <h3>Growth Report</h3>

          <select id="viewMode" style="padding:3px 6px;font-size:12px;width:150px;">
            <option value="none">No Previous</option>
            <option value="prev1">${months.prev1} Day-wise</option>
            <option value="prev2">${months.prev2} Day-wise</option>
          </select>
        </div>

        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Style</th>
                <th>ERP SKU</th>
                <th>Brand</th>
                <th>Rating</th>
                <th>Status</th>

                <th>${months.prev2}</th>
                ${viewMode==="prev2" ? prev2DaysArr.map(d=>`<th>${months.prev2}-${d}</th>`).join("") : ""}

                <th>${months.prev1}</th>
                ${viewMode==="prev1" ? prev1DaysArr.map(d=>`<th>${months.prev1}-${d}</th>`).join("") : ""}

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

      const projColor = r.projection > r.m1 ? "green" : "red";
      const growthColor =
        r.growth > 0 ? "green" :
        r.growth < 0 ? "red" : "gray";

      html += `<tr>
        <td>${r.style_id}</td>
        <td>${r.erp_sku}</td>
        <td>${r.brand}</td>
        <td>${r.rating || ""}</td>
        <td>${r.status}</td>

        <td>${r.m2}</td>
        ${viewMode==="prev2" ? prev2DaysArr.map(d=>`<td>${r.prev2Days[d]||0}</td>`).join("") : ""}

        <td>${r.m1}</td>
        ${viewMode==="prev1" ? prev1DaysArr.map(d=>`<td>${r.prev1Days[d]||0}</td>`).join("") : ""}

        <td>${r.m0}</td>

        <td style="color:${growthColor}">${fmtPct(r.growth)}</td>
        <td>${r.drr.toFixed(1)}</td>
        <td style="color:${projColor}">${r.projection.toFixed(0)}</td>

        ${days.map(d=>`<td>${r.days[d]||0}</td>`).join("")}
      </tr>`;
    });

    html += `</tbody></table></div></section>`;

    root.innerHTML = html;

    const select = document.getElementById("viewMode");
    select.value = viewMode;

    select.onchange = (e)=>{
      viewMode = e.target.value;
      window.renderGrowDegrowTab();
    };
  };
}