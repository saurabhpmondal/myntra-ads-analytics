import { getOOSStore }
  from "./oosEyeStore.js";

import {
  buildProductMaster
}
from "./oosProductMaster.js";

import {
  buildSalesMap
}
from "./oosSales.js";

import {
  buildSJITMap,
  buildSORMap,
  buildSellerMap
}
from "./oosStock.js";

import {
  evaluateOOS
}
from "./oosSeverity.js";

import {
  buildOOSKPIs
}
from "./oosKPI.js";

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

export async function buildOOSEyeData(
  selectedDays = 90
){

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

  const salesMap =
    buildSalesMap(
      sales,
      selectedDays
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
    salesMap
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

    const launchAge =
      daysBetween(
        master.launchDate,
        today
      );

    if(
      launchAge >
      selectedDays
    ){

      return;
    }

    const salesQty =
      salesMap[style];

    const drr =
      salesQty /
      selectedDays;

    const seller =
      sellerMap[style] || {

        currentStock:0,
        oosDays:0

      };

    const {

      isFlagged,
      salesLoss,
      severityFlag

    } =
      evaluateOOS(

        salesQty,

        drr,

        seller.oosDays

      );

    if(
      !isFlagged
    ){

      return;
    }

    const sjitQty =
      sjitMap[style] || 0;

    const sorQty =
      sorMap[style] || 0;

    const totalStock =

      seller.currentStock +

      sjitQty +

      sorQty;

    rows.push({

      style_id:
        style,

      erp_sku:
        master.erp,

      launchDate:
        master.launchDate
          .toLocaleDateString(
            "en-GB"
          ),

      brand:
        master.brand,

      launchAge,

      sales:
        salesQty,

      drr:
        Number(
          drr.toFixed(2)
        ),

      oosDays:
        seller.oosDays,

      sellerStock:
        seller.currentStock,

      sjitStock:
        sjitQty,

      sorStock:
        sorQty,

      totalStock,

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