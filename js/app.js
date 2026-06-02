import { initDashboard } from "./dashboard/dashboardController.js";
import { initCampaignTab } from "./campaign/campaignUI.js";
import { initAdgroupTab } from "./adgroup/adgroupUI.js";
import { initStyleTab } from "./style/styleUI.js";
import { initPPRTab } from "./ppr/pprUI.js";
import { initAnalysisTab } from "./analysis/analysisUI.js";
import { initSalesTab } from "./sales/salesUI.js";
import { initSJITTab } from "./sjit/sjitUI.js";
import { initSORTab } from "./sor/sorUI.js";
import { initStyleEyeTab } from "./styleeye/styleEyeUI.js";
import { initExportTab } from "./export/exportUI.js";
import { initBusinessTab } from "./business/businessUI.js";

/* NEW */
import { initGrowDegrowTab } from "./growdegrow/growthUI.js";

/* NEW */
import { initFreshness } from "./freshness/index.js";

import { initOOSEyeTab } from "./oos-eye/oosEyeUI.js";

import { initLaunchTrackerTab } from "./launch-tracker/launchTrackerUI.js";

import {
  initAttributeTab
}
from "./attribute-analysis/attributeUI.js";


window.addEventListener("DOMContentLoaded", async () => {

  await initDashboard();

  initCampaignTab();
  initAdgroupTab();
  initStyleTab();
  initPPRTab();
  initAnalysisTab();
  initSalesTab();
  initSJITTab();
  initSORTab();
  initStyleEyeTab();
  initExportTab();
  initBusinessTab();

  /* NEW */
  initGrowDegrowTab();

  /* NEW */
  initFreshness();

initOOSEyeTab();

initLaunchTrackerTab();

initAttributeTab();
  document.querySelectorAll(".tab-btn")
    .forEach(btn => {

      btn.onclick = () => {

        const tab =
          btn.dataset.tab;

        document
          .querySelectorAll(".tab-btn")
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        btn.classList.add(
          "active"
        );

        [

          "dashboard",
          "campaign",
          "adgroup",
          "style",
          "ppr",
          "analysis",
          "sales",

          "growdegrow",

          "sjit",
          "sor",
          "styleeye",
          "export",
          "business",

          /* NEW */
        
"freshness",
"ooseye",
"launchtracker"

"attributeanalysis"

        ].forEach(id => {

          const el =
            document.getElementById(
              id
            );

          if (el) {

            el.style.display =
              id === tab
                ? "block"
                : "none";
          }
        });

        if (
          tab === "campaign"
        ) {
          window
            .renderCampaignTab?.();
        }

        if (
          tab === "adgroup"
        ) {
          window
            .renderAdgroupTab?.();
        }

        if (
          tab === "style"
        ) {
          window
            .renderStyleTab?.();
        }

        if (
          tab === "ppr"
        ) {
          window
            .renderPPRTab?.();
        }

        if (
          tab === "analysis"
        ) {
          window
            .renderAnalysisTab?.();
        }

        if (
          tab === "sales"
        ) {
          window
            .renderSalesTab?.();
        }

        if (
          tab === "growdegrow"
        ) {
          window
            .renderGrowDegrowTab?.();
        }

        if (
          tab === "sjit"
        ) {
          window
            .renderSJITTab?.();
        }

        if (
          tab === "sor"
        ) {
          window
            .renderSORTab?.();
        }

        if (
          tab === "styleeye"
        ) {
          window
            .renderStyleEyeTab?.();
        }

        if (
          tab === "export"
        ) {
          window
            .renderExportTab?.();
        }

        if (
          tab === "business"
        ) {
          window
            .renderBusinessTab?.();
        }

        /* NEW */

        if (
          tab === "freshness"
        ) {
          window
            .renderFreshnessTab?.();
        }

if (
  tab === "ooseye"
) {
  window
    .renderOOSEyeTab?.();
}


if (
  tab === "launchtracker"
) {
  window
    .renderLaunchTrackerTab?.();
}

if(
  tab ===
  "attributeanalysis"
){
  window
    .renderAttributeTab?.();
}
      };
    });
});