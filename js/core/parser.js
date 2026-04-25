function num(v){ return Number(String(v ?? '').replace(/,/g,'').trim()) || 0; }
export function parseCSV(text){
  const lines = text.trim().split(/
?
/);
  const headers = lines.shift().split(',');
  return lines.map(line => {
    const cols = line.split(',');
    const row = {};
    headers.forEach((h,i)=> row[h.trim()] = (cols[i] ?? '').trim());
    row.ad_spend = num(row.ad_spend);
    row.impressions = num(row.impressions);
    row.clicks = num(row.clicks);
    row.units_sold_total = num(row.units_sold_total);
    row.total_revenue = num(row.total_revenue);
    row.year = num(row.year);
    row.month = num(row.month);
    row.day = num(row.day);
    return row;
  });
}