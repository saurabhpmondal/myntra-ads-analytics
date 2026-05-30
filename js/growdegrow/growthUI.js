import { buildGrowthData } from "./growthEngine.js";

let DATA = null;

let viewMode = "none";

let brandFilter = "ALL";

let searchText = "";

let ratingFilter = "ALL";

let growthFilter = "ALL";

let LIMIT = 100;

/* ✅ SEARCH DEBOUNCE */
let SEARCH_TIMER = null;

import {
  buildGrowthKPIs,
  renderGrowthKPIs
} from "./growthKPI.js";

function fmtPct(v){

  if(v === null){
    return "NEW";
  }

  return `${Number(v || 0).toFixed(2)}%`;
}

function raw(v){

  return Number(v || 0);
}

function exportCSV(
  rows,
  days,
  prev1DaysArr,
  prev2DaysArr,
  months
){

  const headers = [

    "Style",
    "ERP SKU",
    "Brand",
    "Rating",
    "Status",

    months.prev2,

    ...(viewMode==="prev2"
      ? prev2DaysArr.map(
          d => `${months.prev2}-${d}`
        )
      : []),

    months.prev1,

    ...(viewMode==="prev1"
      ? prev1DaysArr.map(
          d => `${months.prev1}-${d}`
        )
      : []),

    months.current,

    "% Growth",
    "DRR",
    "Projection",

    ...days.map(d => `${d}`)
  ];

  const csv = [

    headers.join(","),

    ...rows.map(r => [

      `"${r.style_id}"`,
      `"${r.erp_sku}"`,
      `"${r.brand}"`,

      raw(r.rating),

      `"${r.status}"`,

      raw(r.m2),

      ...(viewMode==="prev2"
        ? prev2DaysArr.map(
            d => raw(r.prev2Days[d] || 0)
          )
        : []),

      raw(r.m1),

      ...(viewMode==="prev1"
        ? prev1DaysArr.map(
            d => raw(r.prev1Days[d] || 0)
          )
        : []),

      raw(r.m0),

      r.growth === null
        ? "NEW"
        : raw(r.growth),

      Number(r.drr || 0).toFixed(2),

      Math.ceil(r.projection || 0),

      ...days.map(
        d => raw(r.days[d] || 0)
      )

    ].join(","))

  ].join("\n");

  const blob = new Blob(
    [csv],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `growth-report.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function initGrowDegrowTab(){

  window.renderGrowDegrowTab = async () => {

    const root =
      document.getElementById(
        "growdegrow"
      );

    root.innerHTML = `
      <section class="panel">
        <div class="loading">
          Loading Growth Report...
        </div>
      </section>
    `;

    if(!DATA){

      DATA =
        await buildGrowthData();
    }

    const {
      rows,
      days,
      prev1DaysArr,
      prev2DaysArr,
      months
    } = DATA;

    const brands = Array.from(
      new Set(
        rows
          .map(r =>
            (r.brand || "")
              .trim()
          )
          .filter(Boolean)
      )
    ).sort();

    let filteredRows = rows;

    /* ---------- BRAND ---------- */

    if (brandFilter !== "ALL") {

      filteredRows =
        filteredRows.filter(
          r => r.brand === brandFilter
        );
    }

    /* ---------- SEARCH ---------- */

    if (searchText) {

      const s =
        searchText.toLowerCase();

      filteredRows =
        filteredRows.filter(r =>

          String(r.style_id)
            .toLowerCase()
            .includes(s)

          ||

          String(r.erp_sku)
            .toLowerCase()
            .includes(s)
        );
    }

    /* ---------- RATING ---------- */

    if (ratingFilter !== "ALL") {

      if (ratingFilter === "LOW") {

        filteredRows =
          filteredRows.filter(
            r => r.rating < 3
          );
      }

      if (ratingFilter === "MID") {

        filteredRows =
          filteredRows.filter(
            r =>
              r.rating >= 3 &&
              r.rating <= 4
          );
      }

      if (ratingFilter === "HIGH") {

        filteredRows =
          filteredRows.filter(
            r => r.rating > 4
          );
      }
    }

    /* ---------- GROWTH ---------- */

    if (growthFilter !== "ALL") {

      if (growthFilter === "POS") {

        filteredRows =
          filteredRows.filter(
            r => r.growth > 0
          );
      }

      if (growthFilter === "NEG") {

        filteredRows =
          filteredRows.filter(
            r => r.growth < 0
          );
      }

      if (growthFilter === "NEW") {

        filteredRows =
          filteredRows.filter(
            r => r.isNewGrowth
          );
      }
    }

    let html = `

      <section class="panel">

        <div
          class="panel-head"
          style="
            display:flex;
            justify-content:
              space-between;
            align-items:center;
            gap:10px;
            flex-wrap:wrap;
          "
        >

          <h3>
            Growth Report
          </h3>

          <div
            style="
              display:grid;
              grid-template-columns:
                180px
                150px
                150px
                140px
                170px
                150px;
              gap:8px;
              align-items:end;
            "
          >

            <div>

              <label
                style="
                  font-size:12px;
                  color:#666;
                "
              >
                Search
              </label>

              <input
                id="searchBox"
                placeholder="
                  Search style / SKU
                "
                style="
                  padding:4px 6px;
                  font-size:12px;
                "
                value="${searchText}"
              />

            </div>

            <div>

              <label
                style="
                  font-size:12px;
                  color:#666;
                "
              >
                Brand
              </label>

              <select
                id="brandFilter"
                style="
                  padding:3px 6px;
                  font-size:12px;
                "
              >

                <option value="ALL">
                  All Brands
                </option>

                ${
                  brands.map(b=>`
                    <option value="${b}">
                      ${b}
                    </option>
                  `).join("")
                }

              </select>

            </div>

            <div>

              <label
                style="
                  font-size:12px;
                  color:#666;
                "
              >
                Rating
              </label>

              <select
                id="ratingFilter"
                style="
                  padding:3px 6px;
                  font-size:12px;
                "
              >

                <option value="ALL">
                  All Ratings
                </option>

                <option value="LOW">
                  Below 3
                </option>

                <option value="MID">
                  Between 3-4
                </option>

                <option value="HIGH">
                  Above 4
                </option>

              </select>

            </div>

            <div>

              <label
                style="
                  font-size:12px;
                  color:#666;
                "
              >
                Growth
              </label>

              <select
                id="growthFilter"
                style="
                  padding:3px 6px;
                  font-size:12px;
                "
              >

                <option value="ALL">
                  All Growth
                </option>

                <option value="POS">
                  Positive
                </option>

                <option value="NEG">
                  Negative
                </option>

                <option value="NEW">
                  NEW
                </option>

              </select>

            </div>

            <div>

              <label
                style="
                  font-size:12px;
                  color:#666;
                "
              >
                Previous View
              </label>

              <select
                id="viewMode"
                style="
                  padding:3px 6px;
                  font-size:12px;
                "
              >

                <option value="none">
                  No Previous
                </option>

                <option value="prev1">
                  ${months.prev1} Day-wise
                </option>

                <option value="prev2">
                  ${months.prev2} Day-wise
                </option>

              </select>

            </div>

            <div>

              <label
                style="
                  font-size:12px;
                  color:#666;
                "
              >
                Export
              </label>

              <button
                id="growthExport"
                class="load-more"
                style="
                  width:100%;
                "
              >
                Export CSV
              </button>

            </div>

          </div>

        </div>

        <div
          style="
            padding:6px 12px;
            font-size:12px;
            color:#666;
          "
        >

          Showing
          ${Math.min(LIMIT, filteredRows.length)}
          of
          ${filteredRows.length}

        </div>

        <div
          class="table-wrap"
          style="overflow:auto;"
        >

          <table>

            <thead>

              <tr>

                <th>Style</th>
                <th>ERP SKU</th>
                <th>Brand</th>
                <th>Rating</th>
                <th>Status</th>

                <th>${months.prev2}</th>

                ${
                  viewMode==="prev2"

                  ? prev2DaysArr.map(
                      d=>`
                        <th>
                          ${months.prev2}-${d}
                        </th>
                      `
                    ).join("")

                  : ""
                }

                <th>${months.prev1}</th>

                ${
                  viewMode==="prev1"

                  ? prev1DaysArr.map(
                      d=>`
                        <th>
                          ${months.prev1}-${d}
                        </th>
                      `
                    ).join("")

                  : ""
                }

                <th>${months.current}</th>

                <th>% Growth</th>

                <th>DRR</th>

                <th>Projection</th>

                ${
                  days.map(
                    d=>`
                      <th>${d}</th>
                    `
                  ).join("")
                }

              </tr>

            </thead>

            <tbody>
    `;

    filteredRows
      .slice(0,LIMIT)
      .forEach(r=>{

      const projColor =
        r.projection > r.m1
          ? "green"
          : "red";

      const growthColor =

        r.isNewGrowth
          ? "#2563eb"

        : r.growth > 0
          ? "green"

        : r.growth < 0
          ? "red"

        : "gray";

      html += `

        <tr>

          <td>

            <a
              href="
                https://www.myntra.com/${r.style_id}
              "
              target="_blank"
            >

              ${r.style_id}

            </a>

          </td>

          <td>${r.erp_sku}</td>

          <td>${r.brand}</td>

          <td>${r.rating || ""}</td>

          <td>${r.status}</td>

          <td>${r.m2}</td>

          ${
            viewMode==="prev2"

            ? prev2DaysArr.map(d=>`
                <td>
                  ${r.prev2Days[d]||0}
                </td>
              `).join("")

            : ""
          }

          <td>${r.m1}</td>

          ${
            viewMode==="prev1"

            ? prev1DaysArr.map(d=>`
                <td>
                  ${r.prev1Days[d]||0}
                </td>
              `).join("")

            : ""
          }

          <td>${r.m0}</td>

          <td
            style="
              color:${growthColor}
            "
          >

            ${fmtPct(r.growth)}

          </td>

          <td>
            ${Number(r.drr || 0).toFixed(2)}
          </td>

          <td
            style="
              color:${projColor}
            "
          >

            ${Math.ceil(r.projection)}

          </td>

          ${
            days.map((d,i)=>{

              const val =
                r.days[d] || 0;

              const prev =
                i > 0
                  ? (r.days[
                      days[i-1]
                    ] || 0)
                  : null;

              let color = "";

              if (prev !== null) {

                if (val > prev) {
                  color = "green";
                }

                else if (val < prev) {
                  color = "red";
                }
              }

              return `
                <td
                  style="
                    color:${color}
                  "
                >
                  ${val}
                </td>
              `;
            }).join("")
          }

        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    if (filteredRows.length > LIMIT) {

      html += `
        <button
          id="loadMoreGrowth"
          class="load-more"
        >
          Load More
        </button>
      `;
    }

    html += `
      </section>
    `;

    root.innerHTML = html;

    document.getElementById(
      "viewMode"
    ).value = viewMode;

    document.getElementById(
      "brandFilter"
    ).value = brandFilter;

    document.getElementById(
      "ratingFilter"
    ).value = ratingFilter;

    document.getElementById(
      "growthFilter"
    ).value = growthFilter;

    document.getElementById(
      "viewMode"
    ).onchange = e=>{

      viewMode =
        e.target.value;

      window.renderGrowDegrowTab();
    };

    document.getElementById(
      "brandFilter"
    ).onchange = e=>{

      brandFilter =
        e.target.value;

      window.renderGrowDegrowTab();
    };

    document.getElementById(
      "ratingFilter"
    ).onchange = e=>{

      ratingFilter =
        e.target.value;

      window.renderGrowDegrowTab();
    };

    document.getElementById(
      "growthFilter"
    ).onchange = e=>{

      growthFilter =
        e.target.value;

      window.renderGrowDegrowTab();
    };

    /* ✅ 300ms DEBOUNCE */

    document.getElementById(
      "searchBox"
    ).oninput = e=>{

      clearTimeout(
        SEARCH_TIMER
      );

      SEARCH_TIMER =
        setTimeout(()=>{

          searchText =
            e.target.value;

          window.renderGrowDegrowTab();

        }, 300);
    };

    document.getElementById(
      "growthExport"
    ).onclick = ()=>{

      exportCSV(
        filteredRows,
        days,
        prev1DaysArr,
        prev2DaysArr,
        months
      );
    };

    const more =
      document.getElementById(
        "loadMoreGrowth"
      );

    if (more) {

      more.onclick = () => {

        LIMIT += 100;

        window.renderGrowDegrowTab();
      };
    }
  };
}

