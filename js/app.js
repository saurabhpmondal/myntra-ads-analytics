import { initDashboard } from "./dashboard/dashboardController.js";
import { initCampaignTab } from "./campaign/campaignUI.js";
import { initAdgroupTab } from "./adgroup/adgroupUI.js";
import { initStyleTab } from "./style/styleUI.js";
import { initPPRTab } from "./ppr/pprUI.js";
import { initAnalysisTab } from "./analysis/analysisUI.js";
import { initExportTab } from "./export/exportUI.js";

window.addEventListener("DOMContentLoaded", async () => {
  await initDashboard();

  initCampaignTab();
  initAdgroupTab();
  initStyleTab();
  initPPRTab();
  initAnalysisTab();
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
      if (tab === "export") window.renderExportTab?.();
    };
  });
});