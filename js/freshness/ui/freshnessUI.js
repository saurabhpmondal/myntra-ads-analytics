import {

  getFreshnessData

} from "../data/freshnessFetcher.js";

import {

  parseFreshnessData

} from "../data/freshnessParser.js";

import {

  buildFreshnessMatrix

} from "../engine/freshnessEngine.js";

import {

  buildLaunchContributionReport

} from "../reports/launchContributionReport.js";

function fmt(n) {

  return Number(n || 0)
    .toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );
}

export function initFreshnessTab() {

  window.renderFreshnessTab =
    async function () {

      const root =
        document.getElementById(
          "freshness"
        );

      root.innerHTML = `
        <section class="panel">
          <div class="loading">
            Loading Freshness Report...
          </div>
        </section>
      `;

      const rawData =
        await getFreshnessData();

      const parsedData =
        parseFreshnessData(
          rawData
        );

      const matrix =
        buildFreshnessMatrix(
          parsedData
        );

      const report =
        buildLaunchContributionReport(
          matrix
        );

      const grandTotalStyles =
        report.rows.reduce(
          (s,r)=>
            s + r.launchStyles,
          0
        );

      const grandTotalSales =
        report.rows.reduce(
          (s,r)=>
            s + r.soldQty,
          0
        );

      const brandTotals = {};

      report.brands.forEach(b => {

        brandTotals[b] = 0;
      });

      report.rows.forEach(r => {

        report.brands.forEach(b => {

          const qty =
            r.brands[b]?.qty || 0;

          brandTotals[b] += qty;
        });
      });

      root.innerHTML = `

        <section class="panel">

          <div class="panel-head">
            <h3>
              Freshness Contribution
            </h3>
          </div>

          <div class="table-wrap">

            <table>

              <thead>

                <tr>

                  <th rowspan="2">
                    Launch Period
                  </th>

                  <th rowspan="2">
                    Launch Styles
                  </th>

                  <th rowspan="2">
                    Sold Qty
                  </th>

                  <th rowspan="2">
                    Share (%)
                  </th>

                  ${report.brands.map(b => `
                    <th colspan="1">
                      ${b}
                    </th>
                  `).join("")}

                </tr>

                <tr>

                  ${report.brands.map(() => `
                    <th>
                      Sold Units (Share%)
                    </th>
                  `).join("")}

                </tr>

              </thead>

              <tbody>

                ${report.rows.map(r => `

                  <tr>

                    <td>
                      ${r.label}
                    </td>

                    <td>
                      ${fmt(
                        r.launchStyles
                      )}
                    </td>

                    <td
                      style="
                        font-weight:700;
                      "
                    >
                      ${fmt(
                        r.soldQty
                      )}
                    </td>

                    <td>
                      ${fmt(
                        r.share
                      )}%
                    </td>

                    ${report.brands.map(b => {

                      const qty =
                        r.brands[b]?.qty || 0;

                      const share =
                        r.brands[b]?.share || 0;

                      return `
                        <td>
                          ${fmt(qty)}
                          (${fmt(share)}%)
                        </td>
                      `;
                    }).join("")}

                  </tr>

                `).join("")}

                <tr
                  style="
                    font-weight:700;
                    background:#f5f5f5;
                  "
                >

                  <td>
                    Total
                  </td>

                  <td>
                    ${fmt(
                      grandTotalStyles
                    )}
                  </td>

                  <td>
                    ${fmt(
                      grandTotalSales
                    )}
                  </td>

                  <td>
                    100%
                  </td>

                  ${report.brands.map(b => {

                    const qty =
                      brandTotals[b];

                    const share =
                      grandTotalSales
                        ? (
                            qty /
                            grandTotalSales
                          ) * 100
                        : 0;

                    return `
                      <td>
                        ${fmt(qty)}
                        (${fmt(share)}%)
                      </td>
                    `;
                  }).join("")}

                </tr>

              </tbody>

            </table>

          </div>

        </section>
      `;
    };
}