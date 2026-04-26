import { initDashboard } from "./dashboard/dashboardController.js";
import { initCampaignTab } from "./campaign/campaignUI.js";
import { initAdgroupTab } from "./adgroup/adgroupUI.js";
import { initStyleTab } from "./style/styleUI.js";
import { initPPRTab } from "./ppr/pprUI.js";
import { initAnalysisTab } from "./analysis/analysisUI.js";
import { initSalesTab } from "./sales/salesUI.js";
import { initSJITTab } from "./sjit/sjitUI.js";
import { initSORTab } from "./sor/sorUI.js";
import { initExportTab } from "./export/exportUI.js";

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
  initExportTab();

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;

      document.querySelectorAll(".tab-btn").forEach(x =>
        x.classList.remove("active")
      );

      btn.classList.add("active");

      [
        "dashboard",
        "campaign",
        "adgroup",
        "style",
        "ppr",
        "analysis",
        "sales",
        "sjit",
        "sor",
        "export"
      ].forEach(id => {
        document.getElementById(id).style.display =
          id === tab ? "block" : "none";
      });

      if (tab === "campaign") window.renderCampaignTab?.();
      if (tab === "adgroup") window.renderAdgroupTab?.();
      if (tab === "style") window.renderStyleTab?.();
      if (tab === "ppr") window.renderPPRTab?.();
      if (tab === "analysis") window.renderAnalysisTab?.();
      if (tab === "sales") window.renderSalesTab?.();
      if (tab === "sjit") window.renderSJITTab?.();
      if (tab === "sor") window.renderSORTab?.();
      if (tab === "export") window.renderExportTab?.();
    };
  });
});