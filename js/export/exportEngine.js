import { buildDateRows } from "../dashboard/dateTableEngine.js";
import { buildCampaignRows } from "../dashboard/campaignTableEngine.js";
import { buildAdgroupRows } from "../dashboard/adgroupTableEngine.js";
import { buildPlacementRows } from "../dashboard/placementTableEngine.js";
import { buildStyleReport } from "../style/styleEngine.js";
import { buildAnalysis } from "../analysis/analysisEngine.js";

function fmt(n) {
  return Number(n || 0).toFixed(2);
}

function csvEscape(v) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function download(name, rows) {
  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL(url);
}

function ym() {
  const f = window.ACTIVE_FILTER || {};
  return `${f.year}_${f.month}`;
}

export function exportReport(type) {
  const rows = window.FILTERED_ROWS || [];
  const ppr = window.PPR_ROWS || [];
  const cpr = window.CPR_ROWS || [];
  const cdr = window.ALL || [];

  if (type === "datewise") {
    const out = buildDateRows(rows);

    return download(`datewise_${ym()}.csv`, [
      ["Date","Spend","Impr","Clicks","Units","Revenue","ROI"],
      ...out.map(r => [
        r.date,
        fmt(r.spend),
        fmt(r.impressions),
        fmt(r.clicks),
        fmt(r.units),
        fmt(r.revenue),
        fmt(r.spend ? r.revenue / r.spend : 0)
      ])
    ]);
  }

  if (type === "campaign") {
    const out = buildCampaignRows(rows);

    return download(`campaign_${ym()}.csv`, [
      ["Campaign","Spend","Impr","Clicks","Units","Revenue","ROI"],
      ...out.map(r => [
        r.name,
        fmt(r.spend),
        fmt(r.impressions),
        fmt(r.clicks),
        fmt(r.units),
        fmt(r.revenue),
        fmt(r.spend ? r.revenue / r.spend : 0)
      ])
    ]);
  }

  if (type === "adgroup") {
    const out = buildAdgroupRows(rows);

    return download(`adgroup_${ym()}.csv`, [
      ["Adgroup","Spend","Impr","Clicks","Units","Revenue","ROI"],
      ...out.map(r => [
        r.name,
        fmt(r.spend),
        fmt(r.impressions),
        fmt(r.clicks),
        fmt(r.units),
        fmt(r.revenue),
        fmt(r.spend ? r.revenue / r.spend : 0)
      ])
    ]);
  }

  if (type === "placement") {
    const f = window.ACTIVE_FILTER || {};

    const pr = ppr.filter(r =>
      Number(r.year) === Number(f.year) &&
      Number(r.month) === Number(f.month)
    );

    const out = buildPlacementRows(pr);

    return download(`placement_${ym()}.csv`, [
      ["Placement","Spend","Impr","Clicks","Units","Revenue","ROI"],
      ...out.map(r => [
        r.name,
        fmt(r.spend),
        fmt(r.impressions),
        fmt(r.clicks),
        fmt(r.units),
        fmt(r.revenue),
        fmt(r.spend ? r.revenue / r.spend : 0)
      ])
    ]);
  }

  if (type === "style") {
    const f = window.ACTIVE_FILTER || {};

    const sr = cpr.filter(r =>
      Number(r.year) === Number(f.year) &&
      Number(r.month) === Number(f.month)
    );

    const out = buildStyleReport(sr);

    return download(`style_${ym()}.csv`, [
      ["Style","Spend","Impr","Clicks","Units","Revenue","ROI"],
      ...out.map(r => [
        r.id,
        fmt(r.spend),
        fmt(r.impressions),
        fmt(r.clicks),
        fmt(r.units),
        fmt(r.revenue),
        fmt(r.spend ? r.revenue / r.spend : 0)
      ])
    ]);
  }

  if (type === "analysis") {
    const a = buildAnalysis(cpr, cdr, ppr);

    const rowsOut = [
      ...a.data.leaks.map(x => ["Leak",x.name,x.spend,x.clicks,x.units,x.revenue,x.roi]),
      ...a.data.winners.map(x => ["Winner",x.name,x.spend,x.clicks,x.units,x.revenue,x.roi]),
      ...a.data.nosale.map(x => ["NoSale",x.name,x.spend,x.clicks,x.units,x.revenue,x.roi]),
      ...a.data.ctrIssues.map(x => ["CTR",x.name,x.spend,x.clicks,x.units,x.revenue,x.roi]),
      ...a.data.cpcRisk.map(x => ["CPC",x.name,x.spend,x.clicks,x.units,x.revenue,x.roi])
    ];

    return download(`analysis_${a.latest.year}_${a.latest.month}.csv`, [
      ["Type","Name","Spend","Clicks","Units","Revenue","ROI"],
      ...rowsOut.map(r => [
        r[0], r[1], fmt(r[2]), fmt(r[3]), fmt(r[4]), fmt(r[5]), fmt(r[6])
      ])
    ]);
  }
}