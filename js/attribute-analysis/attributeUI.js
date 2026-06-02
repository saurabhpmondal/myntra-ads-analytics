import {
  buildAttributeData
}
from "./attributeEngine.js";

let DATA = null;

let SEARCH = "";

let BRAND = "ALL";

let ERP_STATUS = "ALL";

let ATTRIBUTE = "ALL";

let DAYS = 60;

let LIMIT = 100;

const EXPANDED = {};

function fmt(v){

  return Number(v || 0)
    .toLocaleString(
      "en-IN"
    );
}

function exportCSV(
  rows
){

  const headers = [

    "Attribute",
    "Value",
    "Styles Sold",
    "Sold Units",
    "Total Value",
    "Contribution %"

  ];

  const csv = [

    headers.join(","),

    ...rows.map(r=>

      [

        r.attribute,

        `"${r.value}"`,

        r.stylesSold,

        r.soldUnits,

        r.totalValue,

        r.contribution

      ].join(",")

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
    "attribute-analysis.csv";

  a.click();

  URL.revokeObjectURL(
    url
  );
}

export function initAttributeTab(){

  window.renderAttributeTab =
    async ()=>{

      const root =
        document.getElementById(
          "attributeanalysis"
        );

      root.innerHTML = `
        <section class="panel">
          <div class="loading">
            Loading Attribute Analysis...
          </div>
        </section>
      `;

      DATA =
        await buildAttributeData(
          DAYS
        );

      let {
        rows,
        kpis
      } = DATA;

      const brands =
        Array.from(
          new Set(

            rows.flatMap(
              r=>
                r.brands || []
            )

          )
        )
        .filter(Boolean)
        .sort();

      const statuses =
        Array.from(
          new Set(

            rows.flatMap(
              r=>
                r.erpStatuses || []
            )

          )
        )
        .filter(Boolean)
        .sort();

      let filteredRows =
        [...rows];

      if(
        ATTRIBUTE !==
        "ALL"
      ){

        filteredRows =
          filteredRows.filter(
            r=>

              r.attribute ===
              ATTRIBUTE
          );
      }

      if(
        BRAND !==
        "ALL"
      ){

        filteredRows =
          filteredRows.filter(
            r=>

              (
                r.brands || []
              ).includes(
                BRAND
              )
          );
      }

      if(
        ERP_STATUS !==
        "ALL"
      ){

        filteredRows =
          filteredRows.filter(
            r=>

              (
                r.erpStatuses
                || []
              ).includes(
                ERP_STATUS
              )
          );
      }

      if(
        SEARCH
      ){

        const s =
          SEARCH
            .toLowerCase();

        filteredRows =
          filteredRows.filter(
            r=>{

              const valueMatch =

                String(
                  r.value || ""
                )
                .toLowerCase()
                .includes(s);

              const erpMatch =

                (
                  r.erpSkus
                  || []
                )

                .some(
                  x=>

                    String(x)
                    .toLowerCase()
                    .includes(s)
                );

              const styleMatch =

                (
                  r.styleIds
                  || []
                )

                .some(
                  x=>

                    String(x)
                    .toLowerCase()
                    .includes(s)
                );

              return (

                valueMatch

                ||

                erpMatch

                ||

                styleMatch

              );
            }
          );
      }

      let html = `

      <section class="panel">

        <div class="kpi-grid">

          <div class="kpi-card">
            <span>
              Attributes Found
            </span>
            <strong>
              ${fmt(
                kpis.attributesFound
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Styles Sold
            </span>
            <strong>
              ${fmt(
                kpis.stylesSold
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Units Sold
            </span>
            <strong>
              ${fmt(
                kpis.unitsSold
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Sales Value
            </span>
            <strong>
              ${fmt(
                kpis.salesValue
              )}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Top Attribute
            </span>
            <strong
              style="
                font-size:14px;
              "
            >
              ${kpis.topAttribute}
            </strong>
          </div>

          <div class="kpi-card">
            <span>
              Top Units
            </span>
            <strong>
              ${fmt(
                kpis.topUnits
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

          <h3>
            Attribute Analysis
          </h3>

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
              id="attSearch"
              placeholder="
                Search ERP / Style
              "
              value="${SEARCH}"
            />

            <select
              id="attBrand"
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
              id="attStatus"
            >

              <option value="ALL">
                All ERP Status
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
              id="attAttribute"
            >

              <option value="ALL">
                All Attributes
              </option>

              <option value="COLOR">
                Color
              </option>

              <option value="FABRIC">
                Fabric
              </option>

              <option value="WORK">
                Work
              </option>

            </select>

            <select
              id="attDays"
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

            <button
              id="attExport"
              class="tab-btn"
            >
              Export
            </button>

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
                  Expand
                </th>

                <th>
                  Attribute
                </th>

                <th>
                  Value
                </th>

                <th>
                  Styles Sold
                </th>

                <th>
                  Sold Units
                </th>

                <th>
                  Total Value
                </th>

                <th>
                  Contribution %
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

          const key =
            `${r.attribute}|${r.value}`;

          const open =
            EXPANDED[key];

          html += `

            <tr>

              <td>

                <button
                  class="toggle-row"
                  data-key="${key}"
                >

                  ${
                    open
                      ? "▼"
                      : "▶"
                  }

                </button>

              </td>

              <td>
                ${r.attribute}
              </td>

              <td>
                ${r.value}
              </td>

              <td>
                ${fmt(
                  r.stylesSold
                )}
              </td>

              <td>
                ${fmt(
                  r.soldUnits
                )}
              </td>

              <td>
                ${fmt(
                  r.totalValue
                )}
              </td>

              <td>
                ${r.contribution}%
              </td>

            </tr>

          `;

          if(
            open
          ){

            r.children
              .forEach(c=>{

                html += `

                  <tr
                    style="
                      background:#fafafa;
                    "
                  >

                    <td></td>

                    <td>
                      ↳ Detail
                    </td>

                    <td>
                      ${c.value}
                    </td>

                    <td>
                      ${fmt(
                        c.stylesSold
                      )}
                    </td>

                    <td>
                      ${fmt(
                        c.soldUnits
                      )}
                    </td>

                    <td>
                      ${fmt(
                        c.totalValue
                      )}
                    </td>

                    <td>
                      ${c.contribution}%
                    </td>

                  </tr>

                `;
              });
          }
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
            id="attMore"
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
          "attBrand"
        )
        .value =
        BRAND;

      document
        .getElementById(
          "attStatus"
        )
        .value =
        ERP_STATUS;

      document
        .getElementById(
          "attAttribute"
        )
        .value =
        ATTRIBUTE;

      document
        .getElementById(
          "attDays"
        )
        .value =
        DAYS;

      document
        .getElementById(
          "attBrand"
        )
        .onchange = e=>{

          BRAND =
            e.target.value;

          window
            .renderAttributeTab();
        };

      document
        .getElementById(
          "attStatus"
        )
        .onchange = e=>{

          ERP_STATUS =
            e.target.value;

          window
            .renderAttributeTab();
        };

      document
        .getElementById(
          "attAttribute"
        )
        .onchange = e=>{

          ATTRIBUTE =
            e.target.value;

          window
            .renderAttributeTab();
        };

      document
        .getElementById(
          "attDays"
        )
        .onchange = e=>{

          DAYS =
            Number(
              e.target.value
            );

          LIMIT = 100;

          window
            .renderAttributeTab();
        };

      document
        .getElementById(
          "attSearch"
        )
        .oninput = e=>{

          SEARCH =
            e.target.value;

          window
            .renderAttributeTab();
        };

      document
        .getElementById(
          "attExport"
        )
        .onclick = ()=>{

          exportCSV(
            filteredRows
          );
        };

      document
        .querySelectorAll(
          ".toggle-row"
        )
        .forEach(btn=>{

          btn.onclick =
            ()=>{

              const key =
                btn.dataset.key;

              EXPANDED[
                key
              ] =

                !EXPANDED[
                  key
                ];

              window
                .renderAttributeTab();
            };
        });

      const more =
        document.getElementById(
          "attMore"
        );

      if(
        more
      ){

        more.onclick =
          ()=>{

            LIMIT += 100;

            window
              .renderAttributeTab();
          };
      }
    };
}