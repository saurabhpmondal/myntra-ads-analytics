import { buildDateRows } from "../dashboard/dateTableEngine.js";
import { buildCampaignRows } from "../dashboard/campaignTableEngine.js";
import { buildAdgroupRows } from "../dashboard/adgroupTableEngine.js";
import { buildPlacementRows } from "../dashboard/placementTableEngine.js";
import { buildStyleReport } from "../style/styleEngine.js";
import { buildAnalysis } from "../analysis/analysisEngine.js";

import { buildSJITDebug } from "../sjit/sjitEngine.js";
import { buildSORDebug } from "../sor/sorEngine.js";
import { buildSalesData } from "../sales/salesEngine.js";

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

  /* ================= SALES EXPORT ================= */

  if (type === "sales") {
    const filter = window.ACTIVE_FILTER || {};

    const sales = window.SALES_ROWS || [];
    const returns = window.RETURN_ROWS || [];
    const master = window.MASTER_ROWS || [];

    const data = buildSalesData(sales, returns, master, filter);

    return download(`sales_${ym()}.csv`, [
      [
        "Rank","Brand Rank","Style ID","Brand","ERP SKU","Status",
        "Sold","Value","Returns","Return %","Net Units","DRR"
      ],
      ...data.rows.map(r => [
        r.rank,
        r.brandRank,
        r.id,
        r.brand,
        r.erp_sku,
        r.status,
        fmt(r.sold),
        fmt(r.value),
        fmt(r.returns),
        fmt(r.returnPct),
        fmt(r.netUnits),
        fmt(r.drr)
      ])
    ]);
  }

  /* ================= SJIT EXPORT ================= */

  if (type === "sjit") {
    const data = buildSJITDebug(
      {
        salesRows: window.SALES_ROWS,
        returnRows: window.RETURN_ROWS,
        trafficRows: window.TRAFFIC_ROWS,
        stockRows: window.SJIT_STOCK_ROWS,
        masterRows: window.MASTER_ROWS,
        sorRows: window.SOR_ROWS
      },
      {
        salesDays: window.SALES_DAYS || 30,
        coverDays: window.COVER_DAYS || 45,
        recallDays: window.RECALL_DAYS || 60
      }
    );

    return download(`sjit_${ym()}.csv`, [
      [
        "Style ID","ERP SKU","Status","Brand","Rating",
        "Gross","Returns","Return %",
        "Net","DRR","Stock","SC",
        "Projection","Shipment","Recall"
      ],
      ...data.rows.map(r => [
        r.style_id,
        r.erp_sku,
        r.status,
        r.brand,
        fmt(r.rating),
        fmt(r.gross),
        fmt(r.returns),
        fmt(r.returnPct),
        fmt(r.net),
        fmt(r.drr),
        fmt(r.stock),
        fmt(r.sc),
        fmt(r.projectionQty),
        fmt(r.shipmentQty),
        fmt(r.recallQty)
      ])
    ]);
  }

  /* ================= SOR EXPORT ================= */

  if (type === "sor") {
    const data = buildSORDebug(
      {
        salesRows: window.SALES_ROWS,
        returnRows: window.RETURN_ROWS,
        trafficRows: window.TRAFFIC_ROWS,
        stockRows: window.SOR_STOCK_ROWS,
        masterRows: window.MASTER_ROWS
      },
      {
        salesDays: window.SALES_DAYS || 30,
        coverDays: window.COVER_DAYS || 45,
        recallDays: window.RECALL_DAYS || 60
      }
    );

    return download(`sor_${ym()}.csv`, [
      [
        "Style ID","ERP SKU","Status","Brand","Rating",
        "Gross","Returns","Return %",
        "Net","DRR","Stock","SC",
        "Projection","Shipment","Recall"
      ],
      ...data.rows.map(r => [
        r.style_id,
        r.erp_sku,
        r.status,
        r.brand,
        fmt(r.rating),
        fmt(r.gross),
        fmt(r.returns),
        fmt(r.returnPct),
        fmt(r.net),
        fmt(r.drr),
        fmt(r.stock),
        fmt(r.sc),
        fmt(r.projectionQty),
        fmt(r.shipmentQty),
        fmt(r.recallQty)
      ])
    ]);
  }

  /* ================= EXISTING EXPORTS ================= */

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