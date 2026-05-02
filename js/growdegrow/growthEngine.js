import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { SHEETS } from "../config/sheets.js";

/* ---------------------------- */
/* Helpers */
/* ---------------------------- */

function txt(v) {
  return String(v || "").trim();
}

function monthNum(v) {
  const map = {
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,
    JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12
  };
  return map[String(v).toUpperCase()] || Number(v);
}

/* ---------------------------- */
/* Main Builder */
/* ---------------------------- */

export async function buildGrowthData() {

  const salesCSV = await fetchCSV(SHEETS.SALES);
  const masterCSV = await fetchCSV(SHEETS.PRODUCT_MASTER);

  const sales = parseCSV(salesCSV);
  const master = parseCSV(masterCSV);

  /* -------- Month Detection -------- */

  const monthSet = new Set();

  sales.forEach(r => {
    const y = Number(r.year);
    const m = monthNum(r.month);
    if (y && m) monthSet.add(y * 100 + m);
  });

  const months = Array.from(monthSet).sort((a,b)=>b-a);

  const m0 = months[0];
  const m1 = months[1];
  const m2 = months[2];

  function matchMonth(r, m) {
    const y = Number(r.year);
    const mo = monthNum(r.month);
    return (y * 100 + mo) === m;
  }

  /* -------- Aggregation -------- */

  const map = {};

  sales.forEach(r => {

    const style = txt(r.style_id);
    if (!style) return;

    if (!map[style]) {
      map[style] = {
        style_id: style,
        m0:0, m1:0, m2:0,
        days:{}
      };
    }

    const qty = Number(r.qty || 0);
    const d = Number(r.date || 0);

    if (matchMonth(r, m0)) {
      map[style].m0 += qty;
      if (d) {
        map[style].days[d] = (map[style].days[d] || 0) + qty;
      }
    }

    if (matchMonth(r, m1)) map[style].m1 += qty;
    if (matchMonth(r, m2)) map[style].m2 += qty;
  });

  /* -------- Master Mapping -------- */

  const masterMap = {};
  master.forEach(r => {
    masterMap[txt(r.style_id)] = r;
  });

  const rows = Object.values(map).map(r => {
    const m = masterMap[r.style_id] || {};
    return {
      ...r,
      erp_sku: txt(m.erp_sku),
      brand: txt(m.brand),
      status: txt(m.status)
    };
  });

  rows.sort((a,b)=>b.m0 - a.m0);

  /* -------- Day Range -------- */

  let maxDay = 0;
  rows.forEach(r=>{
    Object.keys(r.days).forEach(d=>{
      if (+d > maxDay) maxDay = +d;
    });
  });

  const days = [];
  for (let i=1;i<=maxDay;i++) days.push(i);

  return { rows, days };
}