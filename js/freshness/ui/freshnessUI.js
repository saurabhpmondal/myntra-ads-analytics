import {

  getFreshnessData

} from "../data/freshnessFetcher.js";

import {

  parseFreshnessData

} from "../data/freshnessParser.js";

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

      const report =
        buildLaunchContributionReport(
          parsedData
        );

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

                  ${report.brands.map(
                    brand => `
                      <th>
                        ${brand}
                      </th>
                    `
                  ).join("")}

                </tr>

                <tr>

                  ${report.brands.map(
                    () => `
                      <th>
                        Sold Units
                        (Share%)
                      </th>
                    `
                  ).join("")}

                </tr>

              </thead>

              <tbody>

                ${report.rows.map(r => `

                  <tr>

                    <td>
                      ${r.bucket}
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
                        r.sales
                      )}
                    </td>

                    <td>
                      ${fmt(
                        r.share
                      )}%
                    </td>

                    ${report.brands.map(
                      brand => {

                        const b =
                          r.brands[
                            brand
                          ];

                        return `
                          <td>

                            ${fmt(
                              b.qty
                            )}

                            <br>

                            <span
                              style="
                                color:#666;
                                font-size:11px;
                              "
                            >
                              (
                              ${fmt(
                                b.share
                              )}%
                              )
                            </span>

                          </td>
                        `;
                      }
                    ).join("")}

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
                      report.totals.styles
                    )}
                  </td>

                  <td>
                    ${fmt(
                      report.totals.sales
                    )}
                  </td>

                  <td>
                    100%
                  </td>

                  ${report.brands.map(
                    brand => {

                      const b =
                        report.totals
                          .brands[
                            brand
                          ];

                      return `
                        <td>

                          ${fmt(
                            b.qty
                          )}

                          <br>

                          <span
                            style="
                              color:#666;
                              font-size:11px;
                            "
                          >
                            (
                            ${fmt(
                              b.share
                            )}%
                            )
                          </span>

                        </td>
                      `;
                    }
                  ).join("")}

                </tr>

              </tbody>

            </table>

          </div>

        </section>
      `;
    };
}