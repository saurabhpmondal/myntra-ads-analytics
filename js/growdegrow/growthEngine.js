import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { SHEETS } from "../config/sheets.js";

function txt(v){ return String(v || "").trim(); }

function monthNum(v){
  const map = {
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,
    JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12
  };
  return map[String(v).toUpperCase()] || Number(v);
}

function monthName(n){
  const map = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return map[n] || "";
}

export async function buildGrowthData(){

  const sales = parseCSV(await fetchCSV(SHEETS.SALES));
  const master = parseCSV(await fetchCSV(SHEETS.PRODUCT_MASTER));

  const monthSet = new Set();

  sales.forEach(r=>{
    const y = r.year;
    const m = monthNum(r.month);
    if(y && m) monthSet.add(y*100 + m);
  });

  const months = Array.from(monthSet).sort((a,b)=>b-a);

  const m0 = months[0];
  const m1 = months[1];
  const m2 = months[2];

  function match(r,m){
    return (r.year*100 + monthNum(r.month)) === m;
  }

  const map = {};

  sales.forEach(r=>{
    const style = txt(r.style_id);
    if(!style) return;

    if(!map[style]){
      map[style] = {
        style_id:style,
        m0:0,m1:0,m2:0,
        days:{},
        prevDays:{}
      };
    }

    const qty = Number(r.qty||0);
    const d = Number(r.date||0);

    if(match(r,m0)){
      map[style].m0 += qty;
      if(d) map[style].days[d] = (map[style].days[d]||0)+qty;
    }

    if(match(r,m1)){
      map[style].m1 += qty;
      if(d) map[style].prevDays[d] = (map[style].prevDays[d]||0)+qty;
    }

    if(match(r,m2)) map[style].m2 += qty;
  });

  const masterMap = {};
  master.forEach(r=>{
    masterMap[txt(r.style_id)] = r;
  });

  const rows = Object.values(map).map(r=>{
    const m = masterMap[r.style_id] || {};
    const growth = r.m1 ? ((r.m0-r.m1)/r.m1)*100 : 0;

    return {
      ...r,
      erp_sku: txt(m.erp_sku),
      brand: txt(m.brand),
      status: txt(m.status),
      growth
    };
  });

  rows.sort((a,b)=>b.m0-a.m0);

  let maxDay = 0;
  rows.forEach(r=>{
    Object.keys(r.days).forEach(d=>{
      if(+d>maxDay) maxDay = +d;
    });
  });

  const days = [];
  for(let i=1;i<=maxDay;i++) days.push(i);

  return {
    rows,
    days,
    months:{
      current: monthName(m0%100),
      prev1: monthName(m1%100),
      prev2: monthName(m2%100),
      currentMonthDays: new Date(Math.floor(m0/100), m0%100, 0).getDate()
    }
  };
}