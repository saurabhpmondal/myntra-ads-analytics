// FILE: js/core/app.js

import { fetchCSV } from "../data/fetcher.js";
import { renderDashboard } from "../dashboard/dashboardPage.js";

/* ---------------------------------- */
/* CONFIG */
/* ---------------------------------- */

const CDR_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1175680150&single=true&output=csv";

/* ---------------------------------- */
/* BOOT */
/* ---------------------------------- */

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {

  buildFilters();

  bindActions();

  await loadDashboard();
}

/* ---------------------------------- */
/* FILTERS */
/* ---------------------------------- */

function buildFilters() {

  const yearEl = document.getElementById("yearFilter");
  const monthEl = document.getElementById("monthFilter");

  const years = [2026, 2025, 2024];

  yearEl.innerHTML = years.map(y =>
    `<option value="${y}">${y}</option>`
  ).join("");

  const months = [
    "January","February","March","April",
    "May","June","July","August",
    "September","October","November","December"
  ];

  monthEl.innerHTML = months.map((m, i) =>
    `<option value="${i+1}">${m}</option>`
  ).join("");

  monthEl.value = new Date().getMonth() + 1;
}

/* ---------------------------------- */
/* ACTIONS */
/* ---------------------------------- */

function bindActions() {

  document.getElementById("applyBtn").onclick = async () => {
    await loadDashboard();
  };

  document.getElementById("refreshBtn").onclick = async () => {
    await loadDashboard();
  };
}

/* ---------------------------------- */
/* LOAD */
/* ---------------------------------- */

async function loadDashboard() {

  const rows = await fetchCSV(CDR_URL);

  const filtered = applyFilters(rows);

  renderDashboard(filtered);
}

/* ---------------------------------- */
/* FILTER ENGINE */
/* uses year month date columns
/* ---------------------------------- */

function applyFilters(rows = []) {

  const year = document.getElementById("yearFilter").value;
  const month = document.getElementById("monthFilter").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  return rows.filter(r => {

    const rowYear = String(r.year || "").trim();
    const rowMonth = String(r.month || "").trim();
    const rowDate = String(r.date || "").trim();

    if (year && rowYear !== year) return false;
    if (month && Number(rowMonth) !== Number(month)) return false;

    if (start && rowDate < start) return false;
    if (end && rowDate > end) return false;

    return true;
  });
}