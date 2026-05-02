import { buildGrowthData } from "./growthEngine.js";

let DATA = null;

function fmtPct(v){
  return `${v.toFixed(1)}%`;
}

function downloadCSV(rows, days, months){

  const header = [
    "style_id","erp_sku","brand","rating","status",
    months.prev2, months.prev1, months.current,
    "growth","drr","projection",
    ...days.map(d=>`${months.current}-${d}`)
  ];

  const out = [header];

  rows.forEach(r=>{
    const row = [
      r.style_id,
      r.erp_sku,
      r.brand,
      r.rating,
      r.status,
      r.m2,
      r.m1,
      r.m0,
      r.growth.toFixed(1),
      r.drr.toFixed(1),
      r.projection.toFixed(0),
      ...days.map(d=>r.days[d]||0)
    ];

    out.push(row);
  });

  const csv = out.map(r=>r.join(",")).join("\n");

  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "growth_report.csv";
  a.click();
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
      <button id="exportGrowth" class="load-more">Export CSV</button>

      <section class="panel">
        <div class="panel-head"><h3>Growth Report</h3></div>
        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Style</th>
                <th>SKU</th>
                <th>Brand</th>
                <th>Rating</th>
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

    rows.slice(0,100).forEach((r,i)=>{

      const projColor = r.projection > r.m1 ? "green" : "red";
      const growthColor =
        r.growth > 0 ? "green" :
        r.growth < 0 ? "red" : "gray";

      html += `<tr>
        <td><button data-i="${i}" class="exp">+</button></td>
        <td>${r.style_id}</td>
        <td>${r.erp_sku}</td>
        <td>${r.brand}</td>
        <td>${r.rating || ""}</td>
        <td>${r.status}</td>
        <td>${r.m2}</td>
        <td>${r.m1}</td>
        <td>${r.m0}</td>
        <td style="color:${growthColor}">${fmtPct(r.growth)}</td>
        <td>${r.drr.toFixed(1)}</td>
        <td style="color:${projColor}">${r.projection.toFixed(0)}</td>
        ${days.map(d=>`<td>${r.days[d]||0}</td>`).join("")}
      </tr>

      <tr class="child-${i}" style="display:none;background:#fafafa;">
        <td colspan="100%">
          ${days.map(d=>`${months.prev1}-${d}: ${r.prevDays[d]||0}`).join(" | ")}
        </td>
      </tr>`;
    });

    html += `</tbody></table></div></section>`;

    root.innerHTML = html;

    document.getElementById("exportGrowth").onclick =
      () => downloadCSV(rows, days, months);

    document.querySelectorAll(".exp").forEach(btn=>{
      btn.onclick = ()=>{
        const i = btn.dataset.i;
        const row = document.querySelector(`.child-${i}`);
        row.style.display =
          row.style.display === "none" ? "" : "none";
      };
    });
  };
}