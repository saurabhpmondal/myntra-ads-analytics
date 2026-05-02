import { buildSalesData } from "../sales/salesEngine.js";

/* ---------------------------- */
/* Utils */
/* ---------------------------- */

function num(v) {
  return Number(v || 0);
}

function txt(v) {
  return String(v || "").trim();
}

function monthNum(v) {
  const map = {
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,
    JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12
  };
  return map[String(v).toUpperCase()] || Number(v);
}

/* ---------------------------- */
/* Build Report */
/* ---------------------------- */

function buildGrowthReport() {

  // SAME SOURCE AS SALES TAB (NO NEW DATA)
  const salesRows = window.SALES_ROWS || [];
  const returnRows = window.RETURN_ROWS || [];
  const masterRows = window.MASTER_ROWS || [];

  const { rows } = buildSalesData(
    salesRows,
    returnRows,
    masterRows,
    {} // no filters
  );

  /* -------- detect months -------- */

  const monthSet = new Set();

  salesRows.forEach(r => {
    const y = Number(r.year);
    const m = monthNum(r.month);
    if (y && m) monthSet.add(y * 100 + m);
  });

  const months = Array.from(monthSet).sort((a,b)=>b-a);

  const m0 = months[0]; // current
  const m1 = months[1]; // prev
  const m2 = months[2]; // prev-2

  function matchMonth(r, m) {
    if (!m) return false;
    const y = Number(r.year);
    const mo = monthNum(r.month);
    return (y * 100 + mo) === m;
  }

  /* -------- aggregation -------- */

  const map = {};

  salesRows.forEach(r => {

    const style = txt(r.style_id);
    if (!style) return;

    if (!map[style]) {
      map[style] = {
        style_id: style,
        m0:0,
        m1:0,
        m2:0,
        days:{}
      };
    }

    const qty = num(r.qty || 1);
    const day = num(r.date);

    if (matchMonth(r, m0)) {
      map[style].m0 += qty;
      if (day) {
        map[style].days[day] = (map[style].days[day] || 0) + qty;
      }
    }

    if (matchMonth(r, m1)) map[style].m1 += qty;
    if (matchMonth(r, m2)) map[style].m2 += qty;
  });

  /* -------- master mapping -------- */

  const masterMap = {};
  masterRows.forEach(r=>{
    masterMap[txt(r.style_id)] = r;
  });

  const out = Object.values(map).map(r=>{
    const m = masterMap[r.style_id] || {};
    return {
      ...r,
      erp_sku: txt(m.erp_sku),
      status: txt(m.status)
    };
  });

  /* -------- sorting -------- */

  out.sort((a,b)=>b.m0 - a.m0);

  /* -------- detect max day -------- */

  let maxDay = 0;

  out.forEach(r=>{
    Object.keys(r.days).forEach(d=>{
      if (+d > maxDay) maxDay = +d;
    });
  });

  const days = [];
  for (let i=1;i<=maxDay;i++) days.push(i);

  return { rows: out, days };
}

/* ---------------------------- */
/* UI */
/* ---------------------------- */

export function initGrowDegrowTab() {

  window.renderGrowDegrowTab = () => {

    const root = document.getElementById("growdegrow");

    const { rows, days } = buildGrowthReport();

    let html = `
      <section class="panel">
        <div class="panel-head">
          <h3>Growth Report</h3>
        </div>

        <div class="table-wrap" style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Style ID</th>
                <th>ERP SKU</th>
                <th>Status</th>
                <th>M-2</th>
                <th>M-1</th>
                <th>Current</th>
                ${days.map(d=>`<th>${d}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
    `;

    const show = rows.slice(0, 50);

    if (!show.length) {
      html += `<tr><td colspan="100%">No data</td></tr>`;
    } else {

      show.forEach(r=>{

        html += `<tr>
          <td>${r.style_id}</td>
          <td>${r.erp_sku}</td>
          <td>${r.status}</td>
          <td>${r.m2}</td>
          <td>${r.m1}</td>
          <td>${r.m0}</td>
        `;

        days.forEach((d,i)=>{

          const v = r.days[d] || 0;
          const prev = r.days[d-1] || 0;

          let color = "";

          if (i > 0) {
            color = v > prev ? "green" : "red";
          }

          html += `<td style="color:${color}">${v}</td>`;
        });

        html += `</tr>`;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </section>
    `;

    root.innerHTML = html;
  };
}