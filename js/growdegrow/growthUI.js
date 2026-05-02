import { buildGrowthData } from "./growthEngine.js";

let DATA = null;
let showPrev1 = false;
let showPrev2 = false;

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

    let html = `
      <section class="panel">
        <div class="panel-head">
          <h3>Growth Report</h3>
          <div style="display:flex; gap:8px;">
            <button id="togglePrev2">${months.prev2}</button>
            <button id="togglePrev1">${months.prev1}</button>
          </div>
        </div>

        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Style</th>
                <th>SKU</th>
                <th>Brand</th>
                <th>Rating</th>
                <th>Status</th>

                <th>${months.prev2}</th>
                ${showPrev2 ? days.map(d=>`<th>${months.prev2}-${d}</th>`).join("") : ""}

                <th>${months.prev1}</th>
                ${showPrev1 ? days.map(d=>`<th>${months.prev1}-${d}</th>`).join("") : ""}

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
        ${showPrev2 ? days.map(d=>`<td>${r.prev2Days[d]||0}</td>`).join("") : ""}

        <td>${r.m1}</td>
        ${showPrev1 ? days.map(d=>`<td>${r.prev1Days[d]||0}</td>`).join("") : ""}

        <td>${r.m0}</td>

        <td style="color:${growthColor}">${fmtPct(r.growth)}</td>
        <td>${r.drr.toFixed(1)}</td>
        <td style="color:${projColor}">${r.projection.toFixed(0)}</td>

        ${days.map(d=>`<td>${r.days[d]||0}</td>`).join("")}
      </tr>`;
    });

    html += `</tbody></table></div></section>`;

    root.innerHTML = html;

    document.getElementById("togglePrev1").onclick = ()=>{
      showPrev1 = !showPrev1;
      window.renderGrowDegrowTab();
    };

    document.getElementById("togglePrev2").onclick = ()=>{
      showPrev2 = !showPrev2;
      window.renderGrowDegrowTab();
    };
  };
}