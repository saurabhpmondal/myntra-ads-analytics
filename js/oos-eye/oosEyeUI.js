import { buildOOSEyeData } from "./oosEyeEngine.js";

let DATA = null;

let BRAND = "ALL";
let SEVERITY = "ALL";
let SEARCH = "";
let LIMIT = 100;

function fmt(v){

  return Number(v || 0)
    .toLocaleString("en-IN");
}

export function initOOSEyeTab(){

  window.renderOOSEyeTab =
    async () => {

      const root =
        document.getElementById(
          "ooseye"
        );

      root.innerHTML = `
        <section class="panel">
          <div class="loading">
            Loading OOS Eye...
          </div>
        </section>
      `;

      DATA =
        await buildOOSEyeData();

      const {
        rows,
        kpis
      } = DATA;

      const brands =
        Array.from(
          new Set(
            rows
              .map(
                r => r.brand
              )
              .filter(Boolean)
          )
        ).sort();

      let filteredRows =
        [...rows];

      if(
        BRAND !== "ALL"
      ){

        filteredRows =
          filteredRows.filter(
            r =>
              r.brand === BRAND
          );
      }

      if(
        SEVERITY !== "ALL"
      ){

        filteredRows =
          filteredRows.filter(
            r =>
              r.severityFlag ===
              SEVERITY
          );
      }

      if(
        SEARCH
      ){

        const s =
          SEARCH.toLowerCase();

        filteredRows =
          filteredRows.filter(
            r =>

              String(
                r.style_id
              )
              .toLowerCase()
              .includes(s)

              ||

              String(
                r.erp_sku
              )
              .toLowerCase()
              .includes(s)
          );
      }

      let html = `

      <section class="panel">

        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(5,1fr);
            gap:12px;
            margin-bottom:16px;
          "
        >

          <div class="summary-card">

            <div class="label">
              Total OOS
            </div>

            <div class="value">
              ${fmt(
                kpis.totalOOS
              )}
            </div>

          </div>

          <div class="summary-card">

            <div class="label">
              OOS > 3
            </div>

            <div class="value">
              ${fmt(
                kpis.oos3Plus
              )}
            </div>

          </div>

          <div class="summary-card">

            <div class="label">
              OOS > 7
            </div>

            <div class="value">
              ${fmt(
                kpis.oos7Plus
              )}
            </div>

          </div>

          <div class="summary-card">

            <div class="label">
              Critical
            </div>

            <div class="value">
              ${fmt(
                kpis.criticalStyles
              )}
            </div>

          </div>

          <div class="summary-card">

            <div class="label">
              Est Lost Units
            </div>

            <div class="value">
              ${fmt(
                kpis.estimatedLostUnits
              )}
            </div>

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
            OOS Eye
          </h3>

          <div
            style="
              display:grid;
              grid-template-columns:
                220px
                180px
                180px;
              gap:8px;
            "
          >

            <input
              id="oosSearch"
              placeholder="
                Search Style / ERP
              "
              value="${SEARCH}"
            />

            <select
              id="oosBrand"
            >

              <option value="ALL">
                All Brands
              </option>

              ${
                brands.map(
                  b => `
                    <option value="${b}">
                      ${b}
                    </option>
                  `
                ).join("")
              }

            </select>

            <select
              id="oosSeverity"
            >

              <option value="ALL">
                All Severity
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>

            </select>

          </div>

        </div>

        <div
          style="
            padding:8px 0;
            color:#666;
            font-size:12px;
          "
        >

          Showing
          ${Math.min(
            LIMIT,
            filteredRows.length
          )}
          of
          ${filteredRows.length}

        </div>

        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                <th>Style</th>
                <th>ERP SKU</th>
                <th>Launch Date</th>
                <th>Brand</th>
                <th>Launch Age</th>

                <th>Seller</th>
                <th>SJIT</th>
                <th>SOR</th>
                <th>Total</th>

                <th>OOS Snapshots</th>

                <th>30D Sales</th>
                <th>60D Sales</th>
                <th>90D Sales</th>

                <th>DRR</th>

                <th>Sales Loss</th>

                <th>Severity</th>

              </tr>

            </thead>

            <tbody>
      `;

      filteredRows
        .slice(0,LIMIT)
        .forEach(r=>{

          let color =
            "#666";

          if(
            r.severityFlag ===
            "CRITICAL"
          ){

            color =
              "#dc2626";

          }else if(
            r.severityFlag ===
            "HIGH"
          ){

            color =
              "#ea580c";

          }else if(
            r.severityFlag ===
            "MEDIUM"
          ){

            color =
              "#ca8a04";
          }

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

              <td>
                ${r.erp_sku || ""}
              </td>

              <td>
                ${r.launchDate}
              </td>

              <td>
                ${r.brand}
              </td>

              <td>
                ${r.launchAge}
              </td>

              <td>
                ${fmt(
                  r.sellerStock
                )}
              </td>

              <td>
                ${fmt(
                  r.sjitStock
                )}
              </td>

              <td>
                ${fmt(
                  r.sorStock
                )}
              </td>

              <td>
                ${fmt(
                  r.totalStock
                )}
              </td>

              <td>
                ${r.oosSnapshots}
              </td>

              <td>
                ${fmt(
                  r.sales30d
                )}
              </td>

              <td>
                ${fmt(
                  r.sales60d
                )}
              </td>

              <td>
                ${fmt(
                  r.sales90d
                )}
              </td>

              <td>
                ${r.drr}
              </td>

              <td>
                ${r.salesLoss}
              </td>

              <td
                style="
                  color:${color};
                  font-weight:700;
                "
              >

                ${r.severityFlag}

              </td>

            </tr>

          `;
        });

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
            id="oosMore"
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
          "oosBrand"
        )
        .value = BRAND;

      document
        .getElementById(
          "oosSeverity"
        )
        .value = SEVERITY;

      document
        .getElementById(
          "oosBrand"
        )
        .onchange = e=>{

          BRAND =
            e.target.value;

          window
            .renderOOSEyeTab();
        };

      document
        .getElementById(
          "oosSeverity"
        )
        .onchange = e=>{

          SEVERITY =
            e.target.value;

          window
            .renderOOSEyeTab();
        };

      document
        .getElementById(
          "oosSearch"
        )
        .oninput = e=>{

          SEARCH =
            e.target.value;

          window
            .renderOOSEyeTab();
        };

      const more =
        document
          .getElementById(
            "oosMore"
          );

      if(more){

        more.onclick =
          ()=>{

            LIMIT += 100;

            window
              .renderOOSEyeTab();
          };
      }
    };
}