function num(v) {
  return Number(v || 0);
}

function cleanId(v) {
  return String(v ?? "").trim().replace(/\.0$/, "");
}

function avg(arr, key) {
  if (!arr.length) return 0;
  return arr.reduce((a, x) => a + num(x[key]), 0) / arr.length;
}

function latest(rows) {
  return rows.reduce((best, r) => {
    const score = num(r.year) * 100 + num(r.month);

    return score > best.score
      ? { score, year: num(r.year), month: num(r.month) }
      : best;
  }, { score: 0, year: 0, month: 0 });
}

function groupStyles(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key = cleanId(r.product_id);

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        name: key,
        spend: 0,
        impressions: 0,
        clicks: 0,
        units: 0,
        revenue: 0
      });
    }

    const x = map.get(key);

    x.spend += num(r.budget_spend);
    x.impressions += num(r.impressions);
    x.clicks += num(r.clicks);
    x.units += num(r.units_sold_total);
    x.revenue += num(r.total_revenue);
  });

  return [...map.values()].map(r => ({
    ...r,
    ctr: r.impressions ? (r.clicks / r.impressions) * 100 : 0,
    cvr: r.clicks ? (r.units / r.clicks) * 100 : 0,
    cpc: r.clicks ? r.spend / r.clicks : 0,
    roi: r.spend ? r.revenue / r.spend : 0
  }));
}

function groupCampaign(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key = r.campaign_name || "Unknown";

    if (!map.has(key)) {
      map.set(key, {
        name: key,
        spend: 0,
        revenue: 0,
        clicks: 0,
        units: 0
      });
    }

    const x = map.get(key);

    x.spend += num(r.ad_spend);
    x.revenue += num(r.total_revenue);
    x.clicks += num(r.clicks);
    x.units += num(r.units_sold_total);
  });

  return [...map.values()].map(r => ({
    ...r,
    roi: r.spend ? r.revenue / r.spend : 0
  }));
}

function groupPlacement(rows) {
  const map = new Map();

  rows.forEach(r => {
    const key = r.placement || "Unknown";

    if (!map.has(key)) {
      map.set(key, {
        name: key,
        spend: 0,
        revenue: 0,
        clicks: 0,
        units: 0
      });
    }

    const x = map.get(key);

    x.spend += num(r.budget_spend);
    x.revenue += num(r.total_revenue);
    x.clicks += num(r.clicks);
    x.units += num(r.units_sold_total);
  });

  return [...map.values()].map(r => ({
    ...r,
    roi: r.spend ? r.revenue / r.spend : 0
  }));
}

export function buildAnalysis(cprRows, cdrRows, pprRows) {
  const lm = latest(cprRows.length ? cprRows : cdrRows);

  const cpr = cprRows.filter(r =>
    num(r.year) === lm.year &&
    num(r.month) === lm.month
  );

  const cdr = cdrRows.filter(r =>
    num(r.year) === lm.year &&
    num(r.month) === lm.month
  );

  const ppr = pprRows.filter(r =>
    num(r.year) === lm.year &&
    num(r.month) === lm.month
  );

  const styles = groupStyles(cpr);
  const campaigns = groupCampaign(cdr);
  const placements = groupPlacement(ppr);

  const avgSpend = avg(styles, "spend");
  const avgCtr = avg(styles, "ctr");
  const avgCpc = avg(styles, "cpc");

  const leaks = styles
    .filter(x => x.spend > avgSpend && x.roi < 4)
    .sort((a,b) => b.spend - a.spend);

  const winners = styles
    .filter(x => x.spend < avgSpend && x.roi >= 4 && x.units > 0)
    .sort((a,b) => b.roi - a.roi);

  const nosale = styles
    .filter(x => x.clicks > 10 && x.units === 0)
    .sort((a,b) => b.clicks - a.clicks);

  const ctrIssues = styles
    .filter(x => x.impressions > 1000 && x.ctr < avgCtr)
    .sort((a,b) => b.impressions - a.impressions);

  const cpcRisk = styles
    .filter(x => x.cpc > avgCpc)
    .sort((a,b) => b.cpc - a.cpc);

  const bestPlacement =
    placements.sort((a,b) => b.roi - a.roi)[0] || null;

  const campaignActions = campaigns
    .filter(x => x.spend > 0)
    .sort((a,b) => a.roi - b.roi);

  return {
    latest: lm,
    cards: {
      leaks: leaks.length,
      winners: winners.length,
      nosale: nosale.length,
      ctrIssues: ctrIssues.length,
      cpcRisk: cpcRisk.length,
      bestPlacement: bestPlacement ? bestPlacement.name : "-"
    },
    data: {
      leaks,
      winners,
      nosale,
      ctrIssues,
      cpcRisk,
      placements: placements.sort((a,b) => b.roi - a.roi),
      campaigns: campaignActions
    }
  };
}