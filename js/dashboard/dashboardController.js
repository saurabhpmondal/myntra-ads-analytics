import { SHEETS } from '../config/sheets.js';
import { fetchCSV } from '../core/fetcher.js';
import { parseCSV } from '../core/parser.js';
import { buildKPI } from './kpiEngine.js';

function latestMonth(rows){
  return rows.reduce((best,r)=>{
    const score = r.year * 100 + r.month;
    return score > best.score ? { score, year:r.year, month:r.month } : best;
  }, {score:0, year:0, month:0});
}

function fmt(n){ return n.toLocaleString('en-IN', {maximumFractionDigits:2}); }

function renderKPI(k){
  return `
  <section class="grid kpis">
    <div class="card"><small>Spend</small><strong>₹${fmt(k.spend)}</strong></div>
    <div class="card"><small>Impressions</small><strong>${fmt(k.impressions)}</strong></div>
    <div class="card"><small>Clicks</small><strong>${fmt(k.clicks)}</strong></div>
    <div class="card"><small>Units Sold</small><strong>${fmt(k.units)}</strong></div>
    <div class="card"><small>Revenue</small><strong>₹${fmt(k.revenue)}</strong></div>
    <div class="card"><small>ROI</small><strong>${fmt(k.roi)}x</strong></div>
  </section>`;
}

export async function initDashboard(){
  const root = document.getElementById('dashboard');
  root.innerHTML = '<div class="card">Loading CDR...</div>';
  const csv = await fetchCSV(SHEETS.CDR);
  const rows = parseCSV(csv);
  const latest = latestMonth(rows);
  const filtered = rows.filter(r => r.year === latest.year && r.month === latest.month);
  const kpi = buildKPI(filtered);
  root.innerHTML = `
    <div class="card"><strong>Current Month:</strong> ${latest.month}/${latest.year}</div>
    ${renderKPI(kpi)}
  `;
}