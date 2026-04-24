// FILE: js/core/app.js

/* ---------------------------------- */
/* STABLE V1 APP SHELL
/* UI structure locked
/* ---------------------------------- */

document.addEventListener("DOMContentLoaded", initApp);

/* ---------------------------------- */
/* INIT */
/* ---------------------------------- */

function initApp() {

  setProgress(15, "Initializing filters...");

  buildYearFilter();
  buildMonthFilter();
  buildDayFilters();

  bindActions();

  setProgress(55, "Loading dashboard shell...");

  renderDashboardShell();

  setProgress(100, "Ready");

  setTimeout(() => {
    setProgress(0, "");
  }, 600);
}

/* ---------------------------------- */
/* FILTER BUILDERS */
/* ---------------------------------- */

function buildYearFilter() {

  const el = document.getElementById("yearFilter");

  if (!el) return;

  const years = [2026, 2025, 2024];

  el.innerHTML = years.map(y =>
    `<option value="${y}">${y}</option>`
  ).join("");
}

function buildMonthFilter() {

  const el = document.getElementById("monthFilter");

  if (!el) return;

  const months = [
    "JAN","FEB","MAR","APR","MAY","JUN",
    "JUL","AUG","SEP","OCT","NOV","DEC"
  ];

  el.innerHTML = months.map(m =>
    `<option value="${m}">${m}</option>`
  ).join("");

  el.value = months[new Date().getMonth()];
}

function buildDayFilters() {

  const from = document.getElementById("dayFromFilter");
  const to = document.getElementById("dayToFilter");

  if (!from || !to) return;

  let html = `<option value="">All</option>`;

  for (let i = 1; i <= 31; i++) {
    html += `<option value="${i}">${i}</option>`;
  }

  from.innerHTML = html;
  to.innerHTML = html;
}

/* ---------------------------------- */
/* ACTIONS */
/* ---------------------------------- */

function bindActions() {

  const applyBtn = document.getElementById("applyBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  if (applyBtn) {
    applyBtn.onclick = handleApply;
  }

  if (refreshBtn) {
    refreshBtn.onclick = handleRefresh;
  }

  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(tab => {
    tab.onclick = () => switchTab(tab);
  });
}

function handleApply() {

  setProgress(45, "Applying filters...");

  setTimeout(() => {
    renderDashboardShell();
    setProgress(100, "Filters Applied");
    resetProgress();
  }, 400);
}

function handleRefresh() {

  setProgress(40, "Refreshing app...");

  setTimeout(() => {
    renderDashboardShell();
    setProgress(100, "Refreshed");
    resetProgress();
  }, 500);
}

function switchTab(tab) {

  document.querySelectorAll(".tab")
    .forEach(x => x.classList.remove("active"));

  tab.classList.add("active");

  const name = tab.textContent.trim();

  if (name === "Dashboard") {
    renderDashboardShell();
    return;
  }

  renderPlaceholder(name);
}

/* ---------------------------------- */
/* DASHBOARD LOCKED STRUCTURE */
/* ---------------------------------- */

function renderDashboardShell() {

  const root = document.getElementById("contentArea");

  if (!root) return;

  root.innerHTML = `

    <section class="kpi-grid">

      ${kpi("Spend","₹0",true)}
      ${kpi("Impressions","0")}
      ${kpi("Clicks","0")}
      ${kpi("Units Sold","0")}
      ${kpi("Revenue","₹0")}
      ${kpi("ROI","0.00")}

    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">Daily Trend</div>
          <div class="panel-sub">Spend vs Revenue</div>
        </div>
      </div>

      <div class="chart-box">
        Live chart connects in next update
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">Daily Summary</div>
          <div class="panel-sub">1 day = 1 row</div>
        </div>
      </div>

      <div class="empty">
        Live CDR data connects next update
      </div>
    </section>
  `;
}

function renderPlaceholder(name) {

  const root = document.getElementById("contentArea");

  if (!root) return;

  root.innerHTML = `
    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">${name}</div>
          <div class="panel-sub">Stable layout locked</div>
        </div>
      </div>

      <div class="empty">
        ${name} module activates after Dashboard lock
      </div>
    </section>
  `;
}

/* ---------------------------------- */
/* HELPERS */
/* ---------------------------------- */

function kpi(label, value, primary = false) {
  return `
    <div class="kpi-card ${primary ? "primary" : ""}">
      <span class="kpi-label">${label}</span>
      <strong class="kpi-value">${value}</strong>
    </div>
  `;
}

function setProgress(percent, text) {

  const bar = document.getElementById("topLoaderBar");
  const status = document.getElementById("statusText");

  if (bar) bar.style.width = percent + "%";
  if (status && text) status.textContent = text;
}

function resetProgress() {
  setTimeout(() => {
    setProgress(0, "");
  }, 500);
}