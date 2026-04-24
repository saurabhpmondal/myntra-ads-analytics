// FILE: js/core/app.js

import { CONFIG } from "./config.js";
import { setReportData } from "./state.js";
import { fetchCSV } from "../data/fetcher.js";
import { initConsole, log } from "../ui/console.js";
import { initTabs } from "../ui/tabs.js";
import { renderDashboard } from "../dashboard/dashboardPage.js";

/* ---------------------------------- */
/* BOOT */
/* ---------------------------------- */

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {

  try {

    initConsole();
    log("INFO", "Boot started");

    buildFilters();

    bindActions();

    initTabs();

    await loadDashboard();

    log("SUCCESS", "Dashboard ready");

  } catch (err) {

    console.error(err);
    log("ERROR", err.message);
  }
}

/* ---------------------------------- */
/* FILTER UI */
/* ---------------------------------- */

function buildFilters() {

  const yearEl = document.getElementById("yearFilter");
  const monthEl = document.getElementById("monthFilter");

  const years = [2026, 2025, 2024];

  if (yearEl) {
    yearEl.innerHTML = years.map(y =>
      `<option value="${y}">${y}</option>`
    ).join("");
  }

  const months = [
    "January","February","March","April",
    "May","June","July","August",
    "September","October","November","December"
  ];

  if (monthEl) {
    monthEl.innerHTML = months.map((m, i) =>
      `<option value="${i + 1}">${m}</option>`
    ).join("");

    monthEl.value = new Date().getMonth() + 1;
  }
}

/* ---------------------------------- */
/* ACTIONS */
/* ---------------------------------- */

function bindActions() {

  const applyBtn = document.getElementById("applyBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  if (applyBtn) {
    applyBtn.onclick = async () => {
      await loadDashboard();
    };
  }

  if (refreshBtn) {
    refreshBtn.onclick = async () => {
      await loadDashboard();
    };
  }
}

/* ---------------------------------- */
/* LOAD + FILTER */
/* Uses date / month / year columns
/* ---------------------------------- */

async function loadDashboard() {

  log("INFO", "Loading CDR");

  const rows = await fetchCSV(CONFIG.REPORT_URLS.CDR);

  log("INFO", `Rows fetched: ${rows.length}`);

  const filtered = applyFilters(rows);

  setReportData("cdr", filtered);

  renderDashboard();

  log("SUCCESS", `Rows after filter: ${filtered.length}`);
}

/* ---------------------------------- */
/* FILTER ENGINE */
/* ---------------------------------- */

function applyFilters(rows = []) {

  const yearVal = document.getElementById("yearFilter")?.value || "";
  const monthVal = document.getElementById("monthFilter")?.value || "";

  const startVal = document.getElementById("startDate")?.value || "";
  const endVal = document.getElementById("endDate")?.value || "";

  return rows.filter(row => {

    const rowYear = String(row.year || "").trim();
    const rowMonth = String(row.month || "").trim();
    const rowDate = String(row.date || "").trim();

    /* Year */
    if (yearVal && rowYear !== yearVal) return false;

    /* Month */
    if (monthVal && Number(rowMonth) !== Number(monthVal)) return false;

    /* Custom Date */
    if (startVal && rowDate < startVal) return false;
    if (endVal && rowDate > endVal) return false;

    return true;
  });
}