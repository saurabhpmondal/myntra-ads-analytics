import { SHEETS } from "../config/sheets.js";
import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { buildSORDebug } from "./sorEngine.js";

let READY = false;

let SALES = [];
let RETURNS = [];
let TRAFFIC = [];
let STOCK = [];
let MASTER = [];

let QUERY = "";

let LIMIT = 50;

let SORT = "sales";

let TIMER = null;

let SALES_DAYS = 30;
let COVER_DAYS = 45;
let RECALL_DAYS = 60;

async function ensureData() {

  if (READY) return;

  const files = await Promise.all([

    fetchCSV(SHEETS.SALES),

    fetchCSV(SHEETS.RETURNS),

    fetchCSV(SHEETS.TRAFFIC),

    fetchCSV(SHEETS.SOR_STOCK),

    fetchCSV(SHEETS.PRODUCT_MASTER)

  ]);

  SALES =
    parseCSV(files[0]);

  RETURNS =
    parseCSV(files[1]);

  TRAFFIC =
    parseCSV(files[2]);

  STOCK =
    parseCSV(files[3]);

  MASTER =
    parseCSV(files[4]);

  READY = true;
}

function fmt(n) {

  return Number(
    n || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2
    }
  );
}

function raw(n) {

  return Number(n || 0);
}

function sortRows(rows) {

  const out = [...rows];

  if (SORT === "sales") {

    out.sort(
      (a, b) =>
        b.net - a.net
    );
  }

  if (SORT === "projection") {

    out.sort(
      (a, b) =>
        b.projectionQty -
        a.projectionQty
    );
  }

  if (SORT === "ship") {

    out.sort(
      (a, b) =>
        b.shipmentQty -
        a.shipmentQty
    );
  }

  if (SORT === "recall") {

    out.sort(
      (a, b) =>
        b.recallQty -
        a.recallQty
    );
  }

  return out;
}

function exportCSV(rows) {

  const headers = [

    "Style ID",
    "ERP SKU",
    "ERP Status",
    "Brand",
    "Launch Date",
    "Rating",
    "Gross",
    "Return %",
    "Net",
    "DRR",
    "SOR Stock",
    "SC",
    "Projection Qty",
    "Shipment Qty",
    "Recall Qty"
  ];

  const csv = [

    headers.join(","),

    ...rows.map(r => [

      `"${r.style_id}"`,

      `"${r.erp_sku}"`,

      `"${r.status}"`,

      `"${r.brand}"`,

      `"${r.launch_date}"`,

      raw(r.rating),

      raw(r.gross),

      Number(
        r.returnPct || 0
      ).toFixed(2),

      raw(r.net),

      Number(
        r.drr || 0
      ).toFixed(2),

      raw(r.stock),

      Number(r.sc) >= 999999
        ? 999999
        : raw(r.sc),

      raw(r.projectionQty),

      raw(r.shipmentQty),

      raw(r.recallQty)

    ].join(","))

  ].join("\n");

  const blob = new Blob(
    [csv],
    {
      type:
        "text/csv;charset=utf-8;"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `sor-planner.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function initSORTab() {

  window.renderSORTab =
    async function () {

    const root =
      document.getElementById(
        "sor"
      );

    root.innerHTML =
      `
        <section class="panel">
          <div class="loading">
            Loading SOR Planner...
          </div>
        </section>
      `;

    await ensureData();

    const data =
      buildSORDebug(
        {
          salesRows: SALES,
          returnRows: RETURNS,
          trafficRows: TRAFFIC,
          stockRows: STOCK,
          masterRows: MASTER
        },
        {
          salesDays: SALES_DAYS,
          coverDays: COVER_DAYS,
          recallDays: RECALL_DAYS
        }
      );

    let rows =
      [...data.rows];

    if (QUERY) {

      const q =
        QUERY.toLowerCase();

      rows =
        rows.filter(r =>

          String(
            r.style_id || ""
          )
          .toLowerCase()
          .includes(q)

          ||

          String(
            r.erp_sku || ""
          )
          .toLowerCase()
          .includes(q)

          ||

          String(
            r.brand || ""
          )
          .toLowerCase()
          .includes(q)
        );
    }

    rows =
      sortRows(rows);

    const show =
      rows.slice(
        0,
        LIMIT
      );

    root.innerHTML = `

      <section class="panel">

        <div
          style="
            padding:16px;
            display:grid;
            gap:12px;
            grid-template-columns:
              120px
              140px
              140px
              130px
              220px
              140px;
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
              Sales Days
            </label>

            <select id="salesDays">

              <option value="30">
                30
              </option>

              <option value="45">
                45
              </option>

              <option value="60">
                60
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
              Target Cover
            </label>

            <select id="coverDays">

              <option value="45">
                45
              </option>

              <option value="60">
                60
              </option>

              <option value="90">
                90
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
              Recall Trigger
            </label>

            <select id="recallDays">

              <option value="60">
                60
              </option>

              <option value="90">
                90
              </option>

              <option value="120">
                120
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
              Sort
            </label>

            <select id="sorSort">

              <option value="sales">
                Sales
              </option>

              <option value="projection">
                Projection
              </option>

              <option value="ship">
                Shipment
              </option>

              <option value="recall">
                Recall
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
              Search
            </label>

            <input
              id="sorSearch"
              value="${QUERY}"
              placeholder="
                Style / ERP SKU / Brand
              "
              style="
                max-width:220px;
              "
            >

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
              id="sorExport"
              class="load-more"
              style="
                width:100%;
              "
            >
              Export CSV
            </button>

          </div>

        </div>

        <div class="table-wrap">

          <table>

            <thead>

              <tr>

                <th>Style ID</th>

                <th>ERP SKU</th>

                <th>ERP Status</th>

                <th>Brand</th>

                <th>Launch Date</th>

                <th>Rating</th>

                <th>Gross</th>

                <th>Return %</th>

                <th>Net</th>

                <th>DRR</th>

                <th>SOR Stock</th>

                <th>SC</th>

                <th>Projection</th>

                <th>Shipment</th>

                <th>Recall</th>

              </tr>

            </thead>

            <tbody>

              ${
                show.map(r => `

                  <tr>

                    <td>
                      ${r.style_id}
                    </td>

                    <td>
                      ${r.erp_sku}
                    </td>

                    <td>
                      ${r.status}
                    </td>

                    <td>
                      ${r.brand}
                    </td>

                    <td>
                      ${r.launch_date}
                    </td>

                    <td>
                      ${fmt(r.rating)}
                    </td>

                    <td>
                      ${fmt(r.gross)}
                    </td>

                    <td>
                      ${fmt(r.returnPct)}%
                    </td>

                    <td>
                      ${fmt(r.net)}
                    </td>

                    <td>
                      ${fmt(r.drr)}
                    </td>

                    <td>
                      ${fmt(r.stock)}
                    </td>

                    <td>

                      ${
                        Number(r.sc) >= 999999

                          ? "∞"

                          : fmt(r.sc)
                      }

                    </td>

                    <td>
                      ${fmt(r.projectionQty)}
                    </td>

                    <td>
                      ${fmt(r.shipmentQty)}
                    </td>

                    <td>
                      ${fmt(r.recallQty)}
                    </td>

                  </tr>

                `).join("")
              }

            </tbody>

          </table>

        </div>

        ${
          rows.length > LIMIT

            ? `
              <button
                id="sorMore"
                class="load-more"
              >
                Load More
              </button>
            `

            : ""
        }

      </section>
    `;

    document.getElementById(
      "salesDays"
    ).value = SALES_DAYS;

    document.getElementById(
      "coverDays"
    ).value = COVER_DAYS;

    document.getElementById(
      "recallDays"
    ).value = RECALL_DAYS;

    document.getElementById(
      "sorSort"
    ).value = SORT;

    document.getElementById(
      "salesDays"
    ).onchange = e => {

      SALES_DAYS =
        Number(
          e.target.value
        );

      LIMIT = 50;

      window.renderSORTab();
    };

    document.getElementById(
      "coverDays"
    ).onchange = e => {

      COVER_DAYS =
        Number(
          e.target.value
        );

      LIMIT = 50;

      window.renderSORTab();
    };

    document.getElementById(
      "recallDays"
    ).onchange = e => {

      RECALL_DAYS =
        Number(
          e.target.value
        );

      LIMIT = 50;

      window.renderSORTab();
    };

    document.getElementById(
      "sorSort"
    ).onchange = e => {

      SORT =
        e.target.value;

      LIMIT = 50;

      window.renderSORTab();
    };

    document.getElementById(
      "sorSearch"
    ).oninput = e => {

      clearTimeout(TIMER);

      TIMER =
        setTimeout(() => {

          QUERY =
            e.target.value.trim();

          LIMIT = 50;

          window.renderSORTab();

        }, 300);
    };

    document.getElementById(
      "sorExport"
    ).onclick = () => {

      exportCSV(rows);
    };

    const more =
      document.getElementById(
        "sorMore"
      );

    if (more) {

      more.onclick = () => {

        LIMIT += 50;

        window.renderSORTab();
      };
    }
  };
}