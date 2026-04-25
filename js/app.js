import { initDashboard } from "./dashboard/dashboardController.js";
import { initCampaignTab } from "./campaign/campaignUI.js";
import { initAdgroupTab } from "./adgroup/adgroupUI.js";

window.addEventListener("DOMContentLoaded", async () => {
  await initDashboard();

  initCampaignTab();
  initAdgroupTab();

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;

      document.querySelectorAll(".tab-btn").forEach(x =>
        x.classList.remove("active")
      );

      btn.classList.add("active");

      document.getElementById("dashboard").style.display =
        tab === "dashboard" ? "block" : "none";

      document.getElementById("campaign").style.display =
        tab === "campaign" ? "block" : "none";

      document.getElementById("adgroup").style.display =
        tab === "adgroup" ? "block" : "none";

      if (tab === "campaign") {
        window.renderCampaignTab?.();
      }

      if (tab === "adgroup") {
        window.renderAdgroupTab?.();
      }
    };
  });
});