// FILE: js/core/app.js

import { CONFIG } from "./config.js";
import { setReportData } from "./state.js";
import { fetchCSV } from "../data/fetcher.js";
import { initConsole, log } from "../ui/console.js";
import { initTabs } from "../ui/tabs.js";
import { renderDashboard } from "../dashboard/dashboardPage.js";

/* -------------------------- */
/* BOOT */
/* -------------------------- */

document.addEventListener("DOMContentLoaded", bootApp);

async function bootApp() {

  try {

    initConsole();
    log("INFO", "App boot started");

    fillFilters();

    bindActions();

    initTabs();

    await loadCDR();

    renderDashboard();

    log("SUCCESS", "App ready");

  } catch (err) {

    console.error(err);
    log("ERROR", err.message);
  }
}

/* -------------------------- */
/* FILTERS */
/* -------------------------- */

function fillFilters() {

  const yearEl = document.getElementById("yearFilter");
  const monthEl = document.getElementById("monthFilter");

  if (yearEl) {
    yearEl.innerHTML = `
      <option>2026</option>
      <option>2025</option>
    `;
  }

  if (monthEl) {

    const months = [
      "January","February","March","April",
      "May","June","July","August",
      "September","October","November","December"
    ];

    monthEl.innerHTML = months.map(m =>
      `<option>${m}</option>`
    ).join("");

    monthEl.value = months[new Date().getMonth()];
  }
}

/* -------------------------- */
/* ACTIONS */
/* -------------------------- */

function bindActions() {

  const refreshBtn = document.getElementById("refreshBtn");
  const applyBtn = document.getElementById("applyBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadCDR);
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", async () => {
      await loadCDR();
      renderDashboard();
    });
  }
}

/* -------------------------- */
/* DATA */
/* -------------------------- */

async function loadCDR() {

  log("INFO", "Loading CDR...");

  const rows = await fetchCSV(CONFIG.REPORT_URLS.CDR);

  setReportData("cdr", rows);

  log("SUCCESS", `CDR rows: ${rows.length}`);
}