import { initDashboard } from "./dashboard/dashboardController.js";
import { initCampaignTab } from "./campaign/campaignUI.js";
import { initAdgroupTab } from "./adgroup/adgroupUI.js";
import { initStyleTab } from "./style/styleUI.js";

window.addEventListener("DOMContentLoaded", async () => {
  await initDashboard();

  initCampaignTab();
  initAdgroupTab();
  initStyleTab();

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;

      document.querySelectorAll(".tab-btn").forEach(x =>
        x.classList.remove("active")
      );

      btn.classList.add("active");

      ["dashboard","campaign","adgroup","style"].forEach(id => {
        document.getElementById(id).style.display =
          id === tab ? "block" : "none";
      });

      if (tab === "campaign") window.renderCampaignTab?.();
      if (tab === "adgroup") window.renderAdgroupTab?.();
      if (tab === "style") window.renderStyleTab?.();
    };
  });
});