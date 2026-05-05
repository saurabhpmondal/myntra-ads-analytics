import { buildGrowthData } from "./growthEngine.js";

let DATA = null;
let viewMode = "none";

/* NEW */
let brandFilter = "ALL";
let searchText = "";

/* NEW */
let LIMIT = 100;

function fmtPct(v){
  return `${v.toFixed(1)}%`;
}

export function initGrowDegrowTab(){

  window.renderGrowDegrowTab = async () => {

    const root = document.getElementById("growdegrow");

    /* ✅ NEW: LOADING STATE */
    if (!DATA) {
      root.innerHTML = `
        <section class="panel">
          <div class="loading">Loading Growth Report...</div>
        </section>
      `;
    }

    if(!DATA) DATA = await buildGrowthData();

    const { rows, days, prev1DaysArr, prev2DaysArr, months } = DATA;

    /* ---------- NEW: BUILD BRAND LIST ---------- */
    const brands = Array.from(
      new Set(rows.map(r => (r.brand || "").trim()).filter(Boolean))
    ).sort();

    /* ---------- NEW: APPLY FILTERS ---------- */
    let filteredRows = rows;

    if (brandFilter !== "ALL") {
      filteredRows = filteredRows.filter(r => r.brand === brandFilter);
    }

    if (searchText) {
      const s = searchText.toLowerCase();
      filteredRows = filteredRows.filter(r =>
        String(r.style_id).toLowerCase().includes(s) ||
        String(r.erp_sku).toLowerCase().includes(s)
      );
    }

    let html = `
      <section class="panel">
        <div class="panel-head" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          
          <h3>Growth Report</h3>

          <div style="display:flex;gap:8px;align-items:center;">

            <!-- SEARCH -->
            <input 
              id="searchBox"
              placeholder="Search style / SKU"
              style="padding:4px 6px;font-size:12px;width:160px;"
              value="${searchText}"
            />

            <!-- BRAND FILTER -->
            <select id="brandFilter" style="padding:3px 6px;font-size:12px;width:140px;">
              <option value="ALL">All Brands</option>
              ${brands.map(b=>`<option value="${b}">${b}</option>`).join("")}
            </select>

            <!-- VIEW -->
            <select id="viewMode" style="padding:3px 6px;font-size:12px;width:150px;">
              <option value="none">No Previous</option>
              <option value="prev1">${months.prev1} Day-wise</option>
              <option value="prev2">${months.prev2} Day-wise</option>
            </select>

          </div>
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

    /* ✅ UPDATED: USE LIMIT */
    filteredRows.slice(0, LIMIT).forEach(r=>{

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

        ${days.map((d,i)=>{
          const val = r.days[d] || 0;
          const prev = i > 0 ? (r.days[days[i-1]] || 0) : null;

          let color = "";
          if (prev !== null) {
            if (val > prev) color = "green";
            else if (val < prev) color = "red";
          }

          return `<td style="color:${color}">${val}</td>`;
        }).join("")}
      </tr>`;
    });

    html += `</tbody></table></div>`;

    /* ✅ NEW: LOAD MORE BUTTON */
    if (filteredRows.length > LIMIT) {
      html += `
        <div style="padding:10px;text-align:center;">
          <button id="loadMore" class="load-more">Load More</button>
        </div>
      `;
    }

    html += `</section>`;

    root.innerHTML = html;

    /* ---------- BIND CONTROLS ---------- */

    const view = document.getElementById("viewMode");
    const brand = document.getElementById("brandFilter");
    const search = document.getElementById("searchBox");

    view.value = viewMode;
    brand.value = brandFilter;

    view.onchange = e=>{
      viewMode = e.target.value;
      LIMIT = 100; /* reset */
      window.renderGrowDegrowTab();
    };

    brand.onchange = e=>{
      brandFilter = e.target.value;
      LIMIT = 100;
      window.renderGrowDegrowTab();
    };

    search.oninput = e=>{
      searchText = e.target.value;
      LIMIT = 100;
      window.renderGrowDegrowTab();
    };

    /* ✅ NEW: LOAD MORE EVENT */
    const more = document.getElementById("loadMore");
    if (more) {
      more.onclick = ()=>{
        LIMIT += 100;
        window.renderGrowDegrowTab();
      };
    }
  };
}