import { buildGrowthData } from "./growthEngine.js";

let DATA = null;
let viewMode = "none";

let brandFilter = "ALL";
let searchText = "";

/* ✅ NEW */
let ratingFilter = "ALL";
let growthFilter = "ALL";
let LIMIT = 100;

function fmtPct(v){
  return `${v.toFixed(1)}%`;
}

export function initGrowDegrowTab(){

  window.renderGrowDegrowTab = async () => {

    const root = document.getElementById("growdegrow");

    /* ✅ LOADING STATE (ADDED) */
    root.innerHTML = `
      <section class="panel">
        <div class="loading">Loading Growth Report...</div>
      </section>
    `;

    if(!DATA) DATA = await buildGrowthData();

    const { rows, days, prev1DaysArr, prev2DaysArr, months } = DATA;

    const brands = Array.from(
      new Set(rows.map(r => (r.brand || "").trim()).filter(Boolean))
    ).sort();

    let filteredRows = rows;

    /* ---------- EXISTING FILTERS ---------- */

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

    /* ---------- NEW FILTERS ---------- */

    if (ratingFilter !== "ALL") {
      if (ratingFilter === "LOW") {
        filteredRows = filteredRows.filter(r => r.rating < 3);
      }
      if (ratingFilter === "MID") {
        filteredRows = filteredRows.filter(r => r.rating >= 3 && r.rating <= 4);
      }
      if (ratingFilter === "HIGH") {
        filteredRows = filteredRows.filter(r => r.rating > 4);
      }
    }

    if (growthFilter !== "ALL") {
      if (growthFilter === "POS") {
        filteredRows = filteredRows.filter(r => r.growth > 0);
      }
      if (growthFilter === "NEG") {
        filteredRows = filteredRows.filter(r => r.growth < 0);
      }
    }

    let html = `
      <section class="panel">
        <div class="panel-head" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          
          <h3>Growth Report</h3>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">

            <input 
              id="searchBox"
              placeholder="Search style / SKU"
              style="padding:4px 6px;font-size:12px;width:160px;"
              value="${searchText}"
            />

            <select id="brandFilter" style="padding:3px 6px;font-size:12px;width:140px;">
              <option value="ALL">All Brands</option>
              ${brands.map(b=>`<option value="${b}">${b}</option>`).join("")}
            </select>

            <!-- ✅ NEW RATING FILTER -->
            <select id="ratingFilter" style="padding:3px 6px;font-size:12px;width:150px;">
              <option value="ALL">All Ratings</option>
              <option value="LOW">Below 3</option>
              <option value="MID">Between 3-4</option>
              <option value="HIGH">Above 4</option>
            </select>

            <!-- ✅ NEW GROWTH FILTER -->
            <select id="growthFilter" style="padding:3px 6px;font-size:12px;width:140px;">
              <option value="ALL">All Growth</option>
              <option value="POS">Positive</option>
              <option value="NEG">Negative</option>
            </select>

            <select id="viewMode" style="padding:3px 6px;font-size:12px;width:150px;">
              <option value="none">No Previous</option>
              <option value="prev1">${months.prev1} Day-wise</option>
              <option value="prev2">${months.prev2} Day-wise</option>
            </select>

          </div>
        </div>

        <div style="padding:6px 12px;font-size:12px;color:#666;">
          Showing ${Math.min(LIMIT, filteredRows.length)} of ${filteredRows.length}
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

    filteredRows.slice(0,LIMIT).forEach(r=>{

      const projColor = r.projection > r.m1 ? "green" : "red";
      const growthColor =
        r.growth > 0 ? "green" :
        r.growth < 0 ? "red" : "gray";

      html += `<tr>
        <td>
          <a href="https://www.myntra.com/${r.style_id}" target="_blank">
            ${r.style_id}
          </a>
        </td>
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

    /* ✅ LOAD MORE (ADDED) */
    if (filteredRows.length > LIMIT) {
      html += `<button id="loadMoreGrowth" class="load-more">Load More</button>`;
    }

    html += `</section>`;

    root.innerHTML = html;

    /* ---------- BIND ---------- */

    document.getElementById("viewMode").value = viewMode;
    document.getElementById("brandFilter").value = brandFilter;
    document.getElementById("ratingFilter").value = ratingFilter;
    document.getElementById("growthFilter").value = growthFilter;

    document.getElementById("viewMode").onchange = e=>{
      viewMode = e.target.value;
      window.renderGrowDegrowTab();
    };

    document.getElementById("brandFilter").onchange = e=>{
      brandFilter = e.target.value;
      window.renderGrowDegrowTab();
    };

    document.getElementById("ratingFilter").onchange = e=>{
      ratingFilter = e.target.value;
      window.renderGrowDegrowTab();
    };

    document.getElementById("growthFilter").onchange = e=>{
      growthFilter = e.target.value;
      window.renderGrowDegrowTab();
    };

    document.getElementById("searchBox").oninput = e=>{
      searchText = e.target.value;
      window.renderGrowDegrowTab();
    };

    const more = document.getElementById("loadMoreGrowth");
    if (more) {
      more.onclick = () => {
        LIMIT += 100;
        window.renderGrowDegrowTab();
      };
    }
  };
}