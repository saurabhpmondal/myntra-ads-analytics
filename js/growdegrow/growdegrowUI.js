import { buildGrowDegrow } from "./growdegrowEngine.js";

export function initGrowDegrowTab() {

  window.renderGrowDegrowTab = () => {

    const root = document.getElementById("growdegrow");

    root.innerHTML =
      `<section class="panel"><div class="loading">Loading...</div></section>`;

    const sales = window.SJIT_SALES || [];

    if (!sales.length) {
      root.innerHTML =
        `<section class="panel"><div class="loading">No sales data</div></section>`;
      return;
    }

    const data = buildGrowDegrow(sales);

    const show = data.rows.slice(0, 50);

    let html = `
      <section class="panel">
        <div class="panel-head">
          <h3>Grow / Degrow (Style × Day)</h3>
        </div>

        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                ${data.days.map(d => `<th>${d}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
    `;

    if (!show.length) {
      html += `<tr><td colspan="100%">No data</td></tr>`;
    } else {

      show.forEach(r => {
        html += `<tr>
          <td>
            <a href="https://www.myntra.com/${r.style_id}" target="_blank">
              ${r.style_id}
            </a>
          </td>
        `;

        data.days.forEach(d => {
          html += `<td>${r.daily[d] || ""}</td>`;
        });

        html += `</tr>`;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
    `;

    if (data.rows.length > 50) {
      html += `<button id="growMore" class="load-more">Load More</button>`;
    }

    html += `</section>`;

    root.innerHTML = html;

    const more = document.getElementById("growMore");

    if (more) {
      more.onclick = () => {
        window.GROW_LIMIT = (window.GROW_LIMIT || 50) + 50;
        window.renderGrowDegrowTab();
      };
    }
  };
}