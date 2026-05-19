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

                  <th>
                    Launch Bucket
                  </th>

                  <th>
                    Launch Styles
                  </th>

                  <th>
                    Sold Units
                  </th>

                  <th>
                    Share %
                  </th>

                  <th>
                    Top Brands
                  </th>

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

                    <td>

                      ${r.brands.map(b => `
                        <div
                          style="
                            margin-bottom:4px;
                          "
                        >
                          <b>
                            ${b.brand}
                          </b>

                          :
                          ${fmt(b.qty)}

                          (${fmt(b.share)}%)
                        </div>
                      `).join("")}

                    </td>

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

                  <td>
                    —
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </section>
      `;
    };
}