import { getOOSStore }
  from "./oosEyeStore.js";

import {
  buildProductMaster
}
from "./oosProductMaster.js";

import {
  buildSJITMap,
  buildSORMap,
  buildSellerMap
}
from "./oosStock.js";

import {
  buildOOSKPIs
}
from "./oosKPI.js";

function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

function parseDate(
  day,
  month,
  year
){

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
}

function daysBetween(
  a,
  b
){

  return Math.floor(
    (
      b - a
    ) /
    86400000
  );
}

function buildSalesWindows(
  sales
){

  const today =
    new Date();

  const sales30Map = {};
  const sales60Map = {};
  const sales90Map = {};

  sales.forEach(r=>{

    const style =
      txt(r.style_id);

    if(!style){

      return;
    }

    const saleDate =
      parseDate(
        r.date,
        r.month,
        r.year
      );

    const age =
      daysBetween(
        saleDate,
        today
      );

    const qty =
      num(r.qty);

    if(age <= 30){

      sales30Map[style] =
        (
          sales30Map[style] || 0
        ) + qty;
    }

    if(age <= 60){

      sales60Map[style] =
        (
          sales60Map[style] || 0
        ) + qty;
    }

    if(age <= 90){

      sales90Map[style] =
        (
          sales90Map[style] || 0
        ) + qty;
    }
  });

  return {

    sales30Map,
    sales60Map,
    sales90Map
  };
}

export async function buildOOSEyeData(){

  const {

    productMaster,
    sales,
    sellerStock,
    sjitStock,
    sorStock

  } =
    await getOOSStore();

  const today =
    new Date();

  const {

    styleMaster,
    erpToStyle

  } =
    buildProductMaster(
      productMaster
    );

  const {

    sales30Map,
    sales60Map,
    sales90Map

  } =
    buildSalesWindows(
      sales
    );

  const sjitMap =
    buildSJITMap(
      sjitStock
    );

  const sorMap =
    buildSORMap(
      sorStock
    );

  const sellerMap =
    buildSellerMap(
      sellerStock,
      erpToStyle
    );

  const rows = [];

  Object.keys(
    styleMaster
  ).forEach(style=>{

    const master =
      styleMaster[style];

    if(!master){

      return;
    }

    if(

      master.status
        .toLowerCase() !==
      "continue"

    ){

      return;
    }

    const seller =
      sellerMap[style] || {

        currentStock:0,
        oosDays:0

      };

    /* ONLY CURRENT OOS */

    if(
      seller.currentStock > 0
    ){

      return;
    }

    const launchAge =
      daysBetween(
        master.launchDate,
        today
      );

    const sales30d =
      sales30Map[style] || 0;

    const sales60d =
      sales60Map[style] || 0;

    const sales90d =
      sales90Map[style] || 0;

    const drr =
      Number(
        (
          sales30d / 30
        ).toFixed(2)
      );

    const sjitQty =
      sjitMap[style] || 0;

    const sorQty =
      sorMap[style] || 0;

    const totalStock =

      seller.currentStock +

      sjitQty +

      sorQty;

    const salesLoss =
      Number(
        (
          drr *
          seller.oosDays
        ).toFixed(2)
      );

    let severityFlag =
      "LOW";

    if(

      seller.oosDays >= 7 &&

      sales30d >= 50

    ){

      severityFlag =
        "CRITICAL";

    }else if(

      seller.oosDays >= 5 &&

      sales30d >= 20

    ){

      severityFlag =
        "HIGH";

    }else if(

      seller.oosDays >= 3

    ){

      severityFlag =
        "MEDIUM";
    }

    rows.push({

      style_id:
        style,

      erp_sku:
        master.erp,

      brand:
        master.brand,

      launchDate:
        master.launchDate
          .toLocaleDateString(
            "en-GB"
          ),

      launchAge,

      sellerStock:
        seller.currentStock,

      sjitStock:
        sjitQty,

      sorStock:
        sorQty,

      totalStock,

      oosSnapshots:
        seller.oosDays,

      sales30d,

      sales60d,

      sales90d,

      drr,

      salesLoss,

      severityFlag
    });
  });

  rows.sort(
    (a,b)=>

      b.salesLoss -

      a.salesLoss
  );

  const kpis =
    buildOOSKPIs(
      rows
    );

  return {

    rows,

    kpis
  };
}