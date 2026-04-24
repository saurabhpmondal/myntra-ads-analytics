// FILE: js/core/app.js

import { CONFIG } from "./config.js";
import {
  state,
  setReportData,
  setMeta,
  setLoading
} from "./state.js";

import { fetchCSV } from "../data/fetcher.js";
import { initConsole, log } from "../ui/console.js";
import { initTabs, activateTab } from "../ui/tabs.js";
import { renderDashboard } from "../dashboard/dashboardPage.js";

/* ---------------------------------- */
/* Boot App */
/* ---------------------------------- */

document.addEventListener("DOMContentLoaded", initApp);

/* ---------------------------------- */
/* Init */
/* ---------------------------------- */

async function initApp() {

  try {

    initConsole();

    log("INFO", `${CONFIG.APP_NAME} v${CONFIG.VERSION}`);

    bindHeaderActions();

    initTabs();

    await loadInitialData();

    activateTab("dashboard");

    state.appReady = true;

    log("SUCCESS", "Application ready");

  } catch (error) {

    console.error(error);

    log("ERROR", error.message);
  }
}

/* ---------------------------------- */
/* Header Buttons */
/* ---------------------------------- */

function bindHeaderActions() {

  const refreshBtn = document.getElementById("refreshBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshApp);
  }
}

/* ---------------------------------- */
/* Initial Data Load */
/* Dashboard first priority
/* ---------------------------------- */

async function loadInitialData() {

  setLoading(true);

  log("INFO", "Loading CDR report...");

  const cdrRows = await fetchCSV(CONFIG.REPORT_URLS.CDR);

  setReportData("cdr", cdrRows);

  setMeta({
    cdrLoaded: true,
    lastRefreshAt: new Date().toISOString()
  });

  log("SUCCESS", `CDR Loaded (${cdrRows.length} rows)`);

  renderDashboard();

  /* Background load */
  loadSecondaryReports();

  setLoading(false);
}

/* ---------------------------------- */
/* Lazy Load Other Reports */
/* ---------------------------------- */

async function loadSecondaryReports() {

  log("INFO", "Loading CPR report...");

  const cprRows = await fetchCSV(CONFIG.REPORT_URLS.CPR);

  setReportData("cpr", cprRows);

  setMeta({ cprLoaded: true });

  log("SUCCESS", `CPR Loaded (${cprRows.length} rows)`);

  log("INFO", "Loading PPR report...");

  const pprRows = await fetchCSV(CONFIG.REPORT_URLS.PPR);

  setReportData("ppr", pprRows);

  setMeta({ pprLoaded: true });

  log("SUCCESS", `PPR Loaded (${pprRows.length} rows)`);
}

/* ---------------------------------- */
/* Refresh */
/* ---------------------------------- */

async function refreshApp() {

  log("INFO", "Manual refresh started");

  await loadInitialData();

  activateTab(state.activeTab);

  log("SUCCESS", "Refresh complete");
}