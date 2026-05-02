import { buildGrowthData } from "./growthEngine.js";

let DATA = null;
let showPrev1 = false;
let showPrev2 = false;

export function initGrowDegrowTab(){

  window.renderGrowDegrowTab = async () => {

    const root = document.getElementById("growdegrow");

    if(!DATA) DATA = await buildGrowthData();

    const { rows, days, months } = DATA;

    let html = `
      <button id="togglePrev2">Toggle ${months.prev2}</button>
      <button id="togglePrev1">Toggle ${months.prev1}</button>

      <div style="overflow:auto;">
      <table>
      <thead>
        <tr>
          <th>Style</th>
          <th>Rating</th>
          <th>${months.prev2}</th>
          ${showPrev2 ? days.map(d=>`<th>${months.prev2}-${d}</th>`).join("") : ""}
          <th>${months.prev1}</th>
          ${showPrev1 ? days.map(d=>`<th>${months.prev1}-${d}</th>`).join("") : ""}
          <th>${months.current}</th>
          ${days.map(d=>`<th>${d}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
    `;

    rows.slice(0,50).forEach(r=>{

      html += `<tr>
        <td>${r.style_id}</td>
        <td>${r.rating}</td>
        <td>${r.m2}</td>
        ${showPrev2 ? days.map(d=>`<td>${r.prev2Days[d]||0}</td>`).join("") : ""}
        <td>${r.m1}</td>
        ${showPrev1 ? days.map(d=>`<td>${r.prev1Days[d]||0}</td>`).join("") : ""}
        <td>${r.m0}</td>
        ${days.map(d=>`<td>${r.days[d]||0}</td>`).join("")}
      </tr>`;
    });

    html += `</tbody></table></div>`;

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