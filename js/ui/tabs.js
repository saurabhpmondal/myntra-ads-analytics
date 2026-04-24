// FILE: js/ui/tabs.js

import { state, setActiveTab } from "../core/state.js";
import { renderDashboard } from "../dashboard/dashboardPage.js";
import { log } from "./console.js";

/* ---------------------------------- */
/* Init Tabs */
/* ---------------------------------- */

export function initTabs() {

  const tabs = document.querySelectorAll(".tab");

  if (!tabs.length) return;

  tabs.forEach(tab => {

    tab.addEventListener("click", () => {

      const label = tab.textContent.trim();

      const tabId = getTabId(label);

      activateTab(tabId);
    });

  });
}

/* ---------------------------------- */
/* Activate Tab */
/* ---------------------------------- */

export function activateTab(tabId = "dashboard") {

  setActiveTab(tabId);

  updateTabUI();

  renderActivePage();

  log("INFO", `Tab changed: ${tabId}`);
}

/* ---------------------------------- */
/* UI Active State */
/* ---------------------------------- */

function updateTabUI() {

  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(tab => {

    const label = tab.textContent.trim();
    const tabId = getTabId(label);

    tab.classList.toggle(
      "active",
      tabId === state.activeTab
    );
  });
}

/* ---------------------------------- */
/* Page Router */
/* ---------------------------------- */

function renderActivePage() {

  switch (state.activeTab) {

    case "dashboard":
      renderDashboard();
      break;

    case "campaign":
      renderComingSoon("Campaign Report");
      break;

    case "adgroup":
      renderComingSoon("Adgroup Report");
      break;

    case "style":
      renderComingSoon("Style Report");
      break;

    case "analysis":
      renderComingSoon("Analysis Engine");
      break;

    case "export":
      renderComingSoon("Export Center");
      break;

    default:
      renderDashboard();
  }
}

/* ---------------------------------- */
/* Helpers */
/* ---------------------------------- */

function getTabId(label = "") {

  const map = {
    "Dashboard": "dashboard",
    "Campaign": "campaign",
    "Adgroup": "adgroup",
    "Style": "style",
    "Analysis": "analysis",
    "Export Center": "export"
  };

  return map[label] || "dashboard";
}

/* ---------------------------------- */
/* Temporary Pages */
/* ---------------------------------- */

function renderComingSoon(title) {

  const page = document.querySelector(".page-wrap");

  if (!page) return;

  page.innerHTML = `
    <section class="panel-card">
      <div class="panel-head">
        <h3>${title}</h3>
      </div>

      <div style="
        min-height:280px;
        display:grid;
        place-items:center;
        color:#64748b;
        font-weight:700;
        font-size:18px;
      ">
        ${title} Coming Soon
      </div>
    </section>
  `;
}