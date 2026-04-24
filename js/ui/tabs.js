// FILE: js/ui/tabs.js

import { renderDashboard } from "../dashboard/dashboardPage.js";

/* -------------------------- */
/* INIT TABS */
/* -------------------------- */

export function initTabs() {

  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(btn => {

    btn.onclick = () => {

      tabs.forEach(x => x.classList.remove("active"));
      btn.classList.add("active");

      const name = btn.textContent.trim();

      routeTab(name);
    };
  });
}

/* -------------------------- */
/* ROUTER */
/* -------------------------- */

function routeTab(name) {

  const page = document.querySelector(".page-wrap");

  if (!page) return;

  if (name === "Dashboard") {
    renderDashboard();
    return;
  }

  page.innerHTML = `
    <section class="panel-card">
      <div class="panel-head">
        <h3>${name}</h3>
      </div>

      <div style="
        min-height:300px;
        display:grid;
        place-items:center;
        color:#64748b;
        font-weight:700;
        font-size:18px;
      ">
        ${name} Module Ready For Build
      </div>
    </section>
  `;
}