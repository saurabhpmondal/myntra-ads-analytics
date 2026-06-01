import {
  buildLaunchTrackerData
}
from "./launchTrackerEngine.js";

let DATA = null;

let BRAND = "ALL";
let ERP_STATUS = "ALL";

let SALES_FILTER = "ALL";
let ADS_FILTER = "ALL";

let SEARCH = "";

let DAYS = 60;

let LIMIT = 100;

function fmt(v){

  return Number(v || 0)
    .toLocaleString("en-IN");
}

export function initLaunchTrackerTab(){

  window.renderLaunchTrackerTab =
    async ()=>{

      const root =
        document.getElementById(
          "launchtracker"
        );

      root.innerHTML = `
        <section class="panel">
          <div class="loading">
            Loading Launch Tracker...
          </div>
        </section>
      `;

      DATA =
        await buildLaunchTrackerData(
          DAYS
        );

      const {
        rows,
        kpis
      } = DATA;

      const brands =
        Array.from(
          new Set(
            rows
              .map(
                r=>r.brand
              )
              .filter(Boolean)
          )
        ).sort();

      const statuses =
        Array.from(
          new Set(
            rows
              .map(
                r=>
                  r.erp_status
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
            r=>
              r.brand === BRAND
          );
      }

      if(
        ERP_STATUS !== "ALL"
      ){

        filteredRows =
          filteredRows.filter(
            r=>

              r.erp_status ===
              ERP_STATUS
          );
      }

      if(
        SALES_FILTER ===
        "SOLD"
      ){

        filteredRows =
          filteredRows.filter(
            r=>

              r.salesUnits > 0
          );
      }

      if(
        SALES_FILTER ===
        "NOSALES"
      ){

        filteredRows =
          filteredRows.filter(
            r=>

              r.salesUnits === 0
          );
      }

      if(
        ADS_FILTER ===
        "SPENT"
      ){

        filteredRows =
          filteredRows.filter(
            r=>

              r.adsSpend > 0
          );
      }

      if(
        ADS_FILTER ===
        "NOSPEND"
      ){

        filteredRows =
          filteredRows.filter(
            r=>

              r.adsSpend === 0
          );
      }

      if(
        SEARCH
      ){

        const s =
          SEARCH.toLowerCase();

        filteredRows =
          filteredRows.filter(
            r=>

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

        <div class="kpi-grid">

          <div class="kpi-card">
            <span>
              Total Launches
            </span>
            <strong>
              ${fmt(
                kpis.totalLaunches
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Sold Launches
            </span>
            <strong>
              ${fmt(
                kpis.soldLaunches
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Unsold Launches
            </span>
            <strong>
              ${fmt(
                kpis.unsoldLaunches
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Ad Spend
            </span>
            <strong>
              ${fmt(
                kpis.totalAdSpend
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Ads No Sales
            </span>
            <strong>
              ${fmt(
                kpis.adsNoSales
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Low Stock
            </span>
            <strong>
              ${fmt(
                kpis.lowStockLaunches
              )}
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

        <div
  style="
    display:flex;
    align-items:center;
    gap:10px;
  "
>

  <h3>
    Launch Tracker
  </h3>

  <button
    id="ltExport"
    class="tab-btn"
  >
    Export CSV
  </button>

</div>

          <div
            style="
              display:grid;
              grid-template-columns:
                220px
                180px
                180px
                150px
                150px
                150px;
              gap:8px;
            "
          >

            <input
              id="ltSearch"
              placeholder="
                Search Style / ERP
              "
              value="${SEARCH}"
            />

            <select
              id="ltBrand"
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
              id="ltStatus"
            >

              <option value="ALL">
                All Status
              </option>

              ${
                statuses.map(
                  s=>`
                  <option value="${s}">
                    ${s}
                  </option>
                `
                ).join("")
              }

            </select>

            <select
              id="ltDays"
            >

              <option value="30">
                30 Days
              </option>

              <option value="45">
                45 Days
              </option>

              <option value="60">
                60 Days
              </option>

              <option value="90">
                90 Days
              </option>

              <option value="120">
                120 Days
              </option>

            </select>

            <select
              id="ltSales"
            >

              <option value="ALL">
                All Sales
              </option>

              <option value="SOLD">
                Sold
              </option>

              <option value="NOSALES">
                No Sales
              </option>

            </select>

            <select
              id="ltAds"
            >

              <option value="ALL">
                All Ads
              </option>

              <option value="SPENT">
                Spent
              </option>

              <option value="NOSPEND">
                No Spend
              </option>

            </select>

          </div>

        </div>

        <div
          style="
            padding:8px 12px;
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

                <th>
                  Style ID
                </th>

                <th>
                  ERP SKU
                </th>

                <th>
                  ERP Status
                </th>

                <th>
                  Brand
                </th>

                <th>
                  Launch Date
                </th>

                <th>
                  Launch Age
                </th>

                <th>
                  Sales Units
                </th>

                <th>
                  Revenue
         </th>
                <th>
                  Ad Spend
                </th>

                <th>
                  ROAS
                </th>

                <th>
                  Impressions
                </th>

                <th>
                  Clicks
                </th>

                <th>
                  Rating
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Status
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
        .forEach(r=>{

          let color =
            "#16a34a";

          if(
            r.launchStatus ===
            "ADS NO SALES"
          ){

            color =
              "#dc2626";
          }

          else if(
            r.launchStatus ===
            "NO SALES"
          ){

            color =
              "#ea580c";
          }

          else if(
            r.launchStatus ===
            "LOW STOCK"
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
                ${r.erp_sku}
              </td>

              <td>
                ${r.erp_status}
              </td>

              <td>
                ${r.brand}
              </td>

              <td>
                ${r.launchDate}
              </td>

              <td>
                ${r.launchAge}
              </td>

              <td>
                ${fmt(
                  r.salesUnits
                )}
              </td>

              <td>
                ${fmt(
                  r.salesRevenue
                )}
              </td>

              <td>
                ${fmt(
                  r.adsSpend
                )}
              </td>

              <td>
                ${r.roas}
              </td>

              <td>
                ${fmt(
                  r.impressions
                )}
              </td>

              <td>
                ${fmt(
                  r.clicks
                )}
              </td>

              <td>
                ${r.rating}
              </td>

              <td>
                ${fmt(
                  r.currentStock
                )}
              </td>

              <td
                style="
                  color:${color};
                  font-weight:700;
                "
              >

                ${r.launchStatus}

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
            id="ltMore"
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
          "ltBrand"
        )
        .value = BRAND;

      document
        .getElementById(
          "ltStatus"
        )
        .value = ERP_STATUS;

      document
        .getElementById(
          "ltDays"
        )
        .value = DAYS;

      document
        .getElementById(
          "ltSales"
        )
        .value = SALES_FILTER;

      document
        .getElementById(
          "ltAds"
        )
        .value = ADS_FILTER;

      document
        .getElementById(
          "ltBrand"
        )
        .onchange = e=>{

          BRAND =
            e.target.value;

          window
            .renderLaunchTrackerTab();
        };

      document
        .getElementById(
          "ltStatus"
        )
        .onchange = e=>{

          ERP_STATUS =
            e.target.value;

          window
            .renderLaunchTrackerTab();
        };

      document
        .getElementById(
          "ltDays"
        )
        .onchange = e=>{

          DAYS =
            Number(
              e.target.value
            );

          LIMIT = 100;

          window
            .renderLaunchTrackerTab();
        };

      document
        .getElementById(
          "ltSales"
        )
        .onchange = e=>{

          SALES_FILTER =
            e.target.value;

          window
            .renderLaunchTrackerTab();
        };

      document
        .getElementById(
          "ltAds"
        )
        .onchange = e=>{

          ADS_FILTER =
            e.target.value;

          window
            .renderLaunchTrackerTab();
        };

      document
        .getElementById(
          "ltSearch"
        )
        .oninput = e=>{

          SEARCH =
            e.target.value;

          window
            .renderLaunchTrackerTab();
        };

const exportBtn =
  document.getElementById(
    "ltExport"
  );

if(exportBtn){

  exportBtn.onclick =
    ()=>{

      const headers = [

        "Style ID",
        "ERP SKU",
        "ERP Status",
        "Brand",
        "Launch Date",
        "Launch Age",
        "Sales Units",
        "Sales Revenue",
        "Ad Spend",
        "ROAS",
        "Impressions",
        "Clicks",
        "Rating",
        "Current Stock",
        "Launch Status"

      ];

      const csvRows = [

        headers.join(",")

      ];

      filteredRows.forEach(r=>{

        csvRows.push([

          r.style_id,

          r.erp_sku,

          r.erp_status,

          r.brand,

          r.launchDate,

          r.launchAge,

          r.salesUnits,

          r.salesRevenue,

          r.adsSpend,

          r.roas,

          r.impressions,

          r.clicks,

          r.rating,

          r.currentStock,

          r.launchStatus

        ].join(","));
      });

      const blob =
        new Blob(

          [
            csvRows.join("\n")
          ],

          {
            type:
              "text/csv;charset=utf-8;"
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
        "launch-tracker-export.csv";

      document.body
        .appendChild(a);

      a.click();

      document.body
        .removeChild(a);

      URL.revokeObjectURL(
        url
      );
    };
}

      const more =
        document.getElementById(
          "ltMore"
        );

      if(
        more
      ){

        more.onclick =
          ()=>{

            LIMIT += 100;

            window
              .renderLaunchTrackerTab();
          };
      }
    };
}