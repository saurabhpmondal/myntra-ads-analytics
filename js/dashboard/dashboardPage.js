// FILE: js/dashboard/dashboardPage.js

export function renderDashboard() {

  const page = document.querySelector(".page-wrap");

  if (!page) {
    console.error("page-wrap not found");
    return;
  }

  page.innerHTML = `
    <section class="cards-grid">

      ${card("Spend", "₹12,45,000", true)}
      ${card("Revenue", "₹38,22,000")}
      ${card("ROI", "3.07")}
      ${card("Clicks", "18,420")}
      ${card("Units", "1,245")}
      ${card("Impressions", "8,42,300")}

    </section>

    <section class="panel-card">
      <div class="panel-head">
        <h3>Daily Trend</h3>
      </div>

      <div style="display:grid;gap:10px;">

        ${trend("2026-04-20","₹42,000","₹1,24,000")}
        ${trend("2026-04-21","₹39,000","₹1,18,000")}
        ${trend("2026-04-22","₹44,000","₹1,31,000")}
        ${trend("2026-04-23","₹41,000","₹1,22,000")}
        ${trend("2026-04-24","₹45,000","₹1,35,000")}

      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <h3>Performance Summary</h3>
      </div>

      <div style="overflow:auto;">

        <table style="width:100%;min-width:900px;">

          <thead>
            <tr>
              <th>Date</th>
              <th>Campaign</th>
              <th>Spend</th>
              <th>Revenue</th>
              <th>ROI</th>
            </tr>
          </thead>

          <tbody>

            <tr>
              <td>2026-04-24</td>
              <td>Summer Tshirts</td>
              <td>₹12,000</td>
              <td>₹42,000</td>
              <td>3.50</td>
            </tr>

            <tr>
              <td>2026-04-24</td>
              <td>Jeans Push</td>
              <td>₹8,000</td>
              <td>₹19,000</td>
              <td>2.38</td>
            </tr>

          </tbody>

        </table>

      </div>
    </section>
  `;
}

function card(label, value, primary = false) {

  return `
    <div class="kpi-card ${primary ? "primary" : ""}">
      <span class="kpi-label">${label}</span>
      <strong class="kpi-value">${value}</strong>
    </div>
  `;
}

function trend(date, spend, revenue) {

  return `
    <div style="
      display:grid;
      grid-template-columns:130px 1fr 1fr;
      gap:12px;
      font-size:14px;
    ">
      <div><b>${date}</b></div>
      <div>Spend: ${spend}</div>
      <div>Revenue: ${revenue}</div>
    </div>
  `;
}