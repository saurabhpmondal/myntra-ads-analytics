import {
  getLaunchTrackerStore
}
from "./launchTrackerStore.js";

import {
  buildLaunchProductMaster
}
from "./launchTrackerProductMaster.js";

import {
  buildLaunchSalesMap
}
from "./launchTrackerSales.js";

import {
  buildLaunchAdsMap
}
from "./launchTrackerAds.js";

import {
  buildLaunchTrafficMap
}
from "./launchTrackerTraffic.js";

import {
  buildLaunchStockMap
}
from "./launchTrackerStock.js";

import {
  buildLaunchTrackerKPIs
}
from "./launchTrackerKPI.js";

export async function buildLaunchTrackerData(
  selectedDays = 60
){

  const {

    productMaster,
    sales,
    cpr,
    traffic,
    sellerStock

  } =
    await getLaunchTrackerStore();

  const {

    styleMaster,
    erpToStyle

  } =
    buildLaunchProductMaster(
      productMaster
    );

  const salesMap =
    buildLaunchSalesMap(
      sales,
      selectedDays
    );

  const adsMap =
    buildLaunchAdsMap(
      cpr
    );

  const trafficMap =
    buildLaunchTrafficMap(
      traffic
    );

  const stockMap =
    buildLaunchStockMap(
      sellerStock,
      erpToStyle
    );

  const rows = [];

  Object.values(
    styleMaster
  ).forEach(master=>{

    if(
      master.launchAge >
      selectedDays
    ){

      return;
    }

    const salesData =

      salesMap[
        master.style_id
      ]

      ||

      {

        salesUnits:0,

        salesRevenue:0,

        firstSaleDate:null,

        distinctSaleDays:0,

        drr:0
      };

    const adsData =

      adsMap[
        master.style_id
      ]

      ||

      {

        impressions:0,

        clicks:0,

        spend:0,

        revenue:0,

        roas:0
      };

    const trafficData =

      trafficMap[
        master.style_id
      ]

      ||

      {

        rating:0
      };

    const stock =

      stockMap[
        master.style_id
      ]

      || 0;

    const noSalesDays =

      Math.max(

        0,

        master.launchAge -

        salesData
          .distinctSaleDays

      );

    let launchStatus =
      "HEALTHY";

    if(

      adsData.spend > 0

      &&

      salesData.salesUnits === 0

    ){

      launchStatus =
        "ADS NO SALES";
    }

    else if(

      adsData.spend === 0

      &&

      salesData.salesUnits === 0

    ){

      launchStatus =
        "NO SALES";
    }

    else if(

      stock <

      (
        salesData.drr * 15
      )

      &&

      salesData.salesUnits > 0

    ){

      launchStatus =
        "LOW STOCK";
    }

    rows.push({

      style_id:
        master.style_id,

      erp_sku:
        master.erp_sku,

      erp_status:
        master.erp_status,

      brand:
        master.brand,

      launchDate:
        master.launchDateDisplay,

      launchAge:
        master.launchAge,

      salesUnits:
        salesData.salesUnits,

      salesRevenue:
        Math.round(
          salesData
            .salesRevenue
        ),

      firstSaleDate:

        salesData
          .firstSaleDate

          ?

          salesData
            .firstSaleDate
            .toLocaleDateString(
              "en-GB"
            )

          :

          "-",

      noSalesDays,

      adsSpend:

        Math.round(
          adsData.spend
        ),

      roas:
        adsData.roas,

      impressions:
        adsData.impressions,

      clicks:
        adsData.clicks,

      rating:
        trafficData.rating,

      currentStock:
        stock,

      drr:
        salesData.drr,

      launchStatus
    });
  });

  rows.sort(
    (a,b)=>{

      if(

        b.salesUnits !==

        a.salesUnits

      ){

        return (

          b.salesUnits -

          a.salesUnits

        );
      }

      return (

        a.launchAge -

        b.launchAge

      );
    }
  );

  const kpis =
    buildLaunchTrackerKPIs(
      rows
    );

  return {

    rows,

    kpis
  };
}