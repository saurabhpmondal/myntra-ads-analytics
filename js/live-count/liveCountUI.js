import {
  buildLiveCountData
}
from "./liveCountEngine.js";

let DATA = null;

let BRAND = "ALL";

let STATUS = "ALL";

let DAYS = "30";

let LIMIT = 100;

function fmt(v){

  return Number(
    v || 0
  ).toLocaleString(
    "en-IN"
  );
}

function exportCSV(
  rows,
  fileName
){

  if(
    !rows.length
  ){

    return;
  }

  const headers =
    Object.keys(
      rows[0]
    );

  const csv = [

    headers.join(","),

    ...rows.map(row=>

      headers.map(
        h=>

          `"${String(
            row[h] ?? ""
          ).replaceAll(
            '"',
            '""'
          )}"`
      ).join(",")

    )

  ].join("\n");

  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const a =
    document.createElement(
      "a"
    );

  a.href = url;

  a.download =
    fileName;

  a.click();

  URL.revokeObjectURL(
    url
  );
}

export function initLiveCountTab(){

  window.renderLiveCountTab =
    async ()=>{

      const root =
        document.getElementById(
          "livecount"
        );

      root.innerHTML = `
        <section class="panel">
          <div class="loading">
            Loading Live Count...
          </div>
        </section>
      `;

      DATA =
        await buildLiveCountData(
          DAYS === "ALL"
            ? "ALL"
            : Number(
                DAYS
              )
        );

      const {

        summaryRows,

        brands,

        kpis,

        liveRows,

        nonLiveRows

      } = DATA;

      let filteredRows =
        [...summaryRows];

      if(
        BRAND !==
        "ALL"
      ){

        filteredRows =
          filteredRows.map(
            row=>({

              date:
                row.date,

              [BRAND]:
                row[
                  BRAND
                ],

              totalLive:
                row.totalLive
            })
          );
      }

      let html = `

      <section class="panel">

        <div class="kpi-grid">

          <div class="kpi-card">
            <span>
              Total Live
            </span>
            <strong>
              ${fmt(
                kpis.totalLive
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Total Non Live
            </span>
            <strong>
              ${fmt(
                kpis.totalNonLive
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Live %
            </span>
            <strong>
              ${kpis.livePercent}%
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Brands
            </span>
            <strong>
              ${fmt(
                kpis.brandsTracked
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Biggest Gainer
            </span>
            <strong
              style="
                font-size:14px;
              "
            >
              ${kpis.biggestGainer}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Biggest Decliner
            </span>
            <strong
              style="
                font-size:14px;
              "
            >
              ${kpis.biggestDecliner}
            </strong>
          </div>

        </div>

        <div
          class="panel-head"
          style="
            display:flex;
            justify-content:
              space-between;
            gap:12px;
            flex-wrap:wrap;
          "
        >

          <h3>
            Live Count
          </h3>

          <div
            style="
              display:grid;
              grid-template-columns:
                180px
                180px
                180px
                180px
                180px;
              gap:8px;
            "
          >

            <select
              id="lcBrand"
            >

              <option value="ALL">
                All Brands
              </option>

              ${
                brands.map(
                  b=>`
                  <option value="${b}">
                    ${b}
                  </option>
                `
                ).join("")
              }

            </select>

            <select
              id="lcDays"
            >

              <option value="7">
                Last 7 Days
              </option>

              <option value="15">
                Last 15 Days
              </option>

              <option value="30">
                Last 30 Days
              </option>

              <option value="ALL">
                All Dates
              </option>

            </select>

            <select
              id="lcStatus"
            >

              <option value="ALL">
                All Status
              </option>

              <option value="LIVE">
                Live
              </option>

              <option value="NON LIVE">
                Non Live
              </option>

            </select>

            <button
              id="exportLive"
              class="tab-btn"
            >
              Export Live
            </button>

            <button
              id="exportNonLive"
              class="tab-btn"
            >
              Export Non Live
            </button>

          </div>

        </div>

        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                <th>
                  Date
                </th>
      `;

      if(
        BRAND ===
        "ALL"
      ){

        brands.forEach(
          brand=>{

            html += `
              <th>
                ${brand}
              </th>
            `;
          }
        );

      }else{

        html += `
          <th>
            ${BRAND}
          </th>
        `;
      }

      html += `

                <th>
                  Total Live
                </th>

              </tr>

            </thead>

            <tbody>
      `;

      filteredRows
        .slice(
          0,
          LIMIT
        )
        .forEach(
          (
            row,
            index
          )=>{

            const prev =
              filteredRows[
                index - 1
              ];

            html += `
              <tr>

                <td>
                  ${row.date}
                </td>
            `;

            if(
              BRAND ===
              "ALL"
            ){

              brands.forEach(
                brand=>{

                  let color =
                    "";

                  if(
                    prev
                  ){

                    const current =
                      row[
                        brand
                      ] || 0;

                    const previous =
                      prev[
                        brand
                      ] || 0;

                    if(
                      current >
                      previous
                    ){

                      color =
                        "#16a34a";

                    }else if(
                      current <
                      previous
                    ){

                      color =
                        "#dc2626";
                    }
                  }

                  html += `
                    <td
                      style="
                        color:${color};
                        font-weight:700;
                      "
                    >
                      ${
                        fmt(
                          row[
                            brand
                          ]
                        )
                      }
                    </td>
                  `;
                }
              );

            }else{

              html += `
                <td>
                  ${
                    fmt(
                      row[
                        BRAND
                      ]
                    )
                  }
                </td>
              `;
            }

            html += `

              <td>
                ${fmt(
                  row.totalLive
                )}
              </td>

              </tr>
            `;
          }
        );

      html += `
            </tbody>
          </table>
        </div>
      `;

      if(
        filteredRows.length >
        LIMIT
      ){

        html += `
          <button
            id="lcMore"
            class="load-more"
          >
            Load More
          </button>
        `;
      }

      html += `
      </section>
      `;

      root.innerHTML =
        html;

      document
        .getElementById(
          "lcBrand"
        )
        .value =
        BRAND;

      document
        .getElementById(
          "lcDays"
        )
        .value =
        DAYS;

      document
        .getElementById(
          "lcStatus"
        )
        .value =
        STATUS;

      document
        .getElementById(
          "lcBrand"
        )
        .onchange = e=>{

          BRAND =
            e.target.value;

          window
            .renderLiveCountTab();
        };

      document
        .getElementById(
          "lcDays"
        )
        .onchange = e=>{

          DAYS =
            e.target.value;

          LIMIT = 100;

          window
            .renderLiveCountTab();
        };

      document
        .getElementById(
          "exportLive"
        )
        .onclick = ()=>{

          exportCSV(
            liveRows,
            "live-styles.csv"
          );
        };

      document
        .getElementById(
          "exportNonLive"
        )
        .onclick = ()=>{

          exportCSV(
            nonLiveRows,
            "non-live-styles.csv"
          );
        };

      const more =
        document.getElementById(
          "lcMore"
        );

      if(
        more
      ){

        more.onclick =
          ()=>{

            LIMIT += 100;

            window
              .renderLiveCountTab();
          };
      }
    };
}