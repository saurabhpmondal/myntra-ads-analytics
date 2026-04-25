export function buildKPI(rows){
  const out = rows.reduce((a,r)=>{
    a.spend += r.ad_spend;
    a.impressions += r.impressions;
    a.clicks += r.clicks;
    a.units += r.units_sold_total;
    a.revenue += r.total_revenue;
    return a;
  }, {spend:0, impressions:0, clicks:0, units:0, revenue:0});
  out.roi = out.spend ? out.revenue / out.spend : 0;
  return out;
}