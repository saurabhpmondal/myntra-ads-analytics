import { fetchCSV } from "../core/fetcher.js";
import { parseCSV } from "../core/parser.js";
import { SHEETS } from "../config/sheets.js";

function txt(v){
  return String(v || "").trim();
}

function monthNum(v){

  const map = {
    JAN:1,
    FEB:2,
    MAR:3,
    APR:4,
    MAY:5,
    JUNE:6,
    JULY:7,
    AUG:8,
    SEP:9,
    OCT:10,
    NOV:11,
    DEC:12
  };

  return map[
    String(v).toUpperCase()
  ] || Number(v);
}

function monthName(n){

  const map = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  return map[n] || "";
}

function daysInMonth(y, m){

  return new Date(y, m, 0)
    .getDate();
}

export async function buildGrowthData(){

  const sales =
    parseCSV(
      await fetchCSV(
        SHEETS.SALES
      )
    );

  const master =
    parseCSV(
      await fetchCSV(
        SHEETS.PRODUCT_MASTER
      )
    );

  const traffic =
    parseCSV(
      await fetchCSV(
        SHEETS.TRAFFIC
      )
    );

  /* ---------- RATING MAP ---------- */

  const ratingMap = {};

  traffic.forEach(r=>{

    const key =
      txt(r.style_id);

    if(key){

      ratingMap[key] =
        Number(r.rating || 0);
    }
  });

  /* ---------- MONTH DETECTION ---------- */

  const monthSet = new Set();

  sales.forEach(r=>{

    const y = r.year;

    const m =
      monthNum(r.month);

    if(y && m){

      monthSet.add(
        y*100 + m
      );
    }
  });

  const monthsArr =
    Array.from(monthSet)
      .sort((a,b)=>b-a);

  const m0 = monthsArr[0];
  const m1 = monthsArr[1];
  const m2 = monthsArr[2];

  const m0y = Math.floor(m0/100);
  const m0m = m0%100;

  const m1y = Math.floor(m1/100);
  const m1m = m1%100;

  const m2y = Math.floor(m2/100);
  const m2m = m2%100;

  function match(r,m){

    return (
      r.year*100 +
      monthNum(r.month)
    ) === m;
  }

  const map = {};

  let maxCurrentDay = 0;

  sales.forEach(r=>{

    const style =
      txt(r.style_id);

    if(!style) return;

    if(!map[style]){

      map[style] = {

        style_id: style,

        m0:0,
        m1:0,
        m2:0,

        days:{},

        prev1Days:{},

        prev2Days:{}
      };
    }

    const qty =
      Number(r.qty || 0);

    const d =
      Number(r.date || 0);

    if(match(r,m0)){

      map[style].m0 += qty;

      if(d){

        map[style].days[d] =

          (map[style].days[d] || 0)

          + qty;

        if(d > maxCurrentDay){

          maxCurrentDay = d;
        }
      }
    }

    if(match(r,m1)){

      map[style].m1 += qty;

      if(d){

        map[style].prev1Days[d] =

          (map[style].prev1Days[d] || 0)

          + qty;
      }
    }

    if(match(r,m2)){

      map[style].m2 += qty;

      if(d){

        map[style].prev2Days[d] =

          (map[style].prev2Days[d] || 0)

          + qty;
      }
    }
  });

  /* ---------- MASTER MAP ---------- */

  const masterMap = {};

  master.forEach(r=>{

    masterMap[
      txt(r.style_id)
    ] = r;
  });

  /* ---------- DAY ARRAYS ---------- */

  const currentDays = [];

  for(
    let i=1;
    i<=maxCurrentDay;
    i++
  ){

    currentDays.push(i);
  }

  const prev1DaysArr = [];

  for(
    let i=1;
    i<=daysInMonth(m1y, m1m);
    i++
  ){

    prev1DaysArr.push(i);
  }

  const prev2DaysArr = [];

  for(
    let i=1;
    i<=daysInMonth(m2y, m2m);
    i++
  ){

    prev2DaysArr.push(i);
  }

  /* ---------- FINAL ROWS ---------- */

  const rows =
    Object.values(map)
      .map(r=>{

    const today =
      maxCurrentDay || 1;

    const drr =
      r.m0 / today;

    /* ✅ ALWAYS ROUND UP */

    const projection =
      Math.ceil(
        drr *
        daysInMonth(m0y, m0m)
      );

    /* ✅ GROWTH FIX */

    let growth = 0;

    let isNewGrowth = false;

    if(r.m1 === 0){

      if(projection > 0){

        growth = null;

        isNewGrowth = true;
      }

      else{

        growth = 0;
      }
    }

    else{

      growth =

        (
          (projection - r.m1)
          / r.m1
        ) * 100;
    }

    const m =
      masterMap[r.style_id]
      || {};

    return {

      ...r,

      erp_sku:
        txt(m.erp_sku),

      brand:
        txt(m.brand),

      status:
        txt(m.status),

      rating:
        ratingMap[
          r.style_id
        ] || 0,

      growth,

      isNewGrowth,

      projection,

      drr
    };
  });

  rows.sort(
    (a,b)=>
      b.projection -
      a.projection
  );

  return {

    rows,

    days: currentDays,

    prev1DaysArr,

    prev2DaysArr,

    months:{

      current:
        monthName(m0m),

      prev1:
        monthName(m1m),

      prev2:
        monthName(m2m),

      currentMonthDays:
        daysInMonth(m0y, m0m)
    }
  };
}