import {
  getLiveCountStore
}
from "./liveCountStore.js";

import {
  buildLiveCountListingMap
}
from "./liveCountListing.js";

import {
  buildLiveCountInventoryMap
}
from "./liveCountInventory.js";

import {
  buildLiveCountKPIs
}
from "./liveCountKPI.js";

export async function buildLiveCountData(

  selectedDays = "ALL"

){

  const {

    listings,
    inventory

  } =
    await getLiveCountStore();

  const {

    styleBrandMap,
    eligibleStyles,
    brands

  } =
    buildLiveCountListingMap(
      listings
    );

  const {

    snapshotMap,
    snapshotDates

  } =
    buildLiveCountInventoryMap(
      inventory
    );

  let dates =
    [...snapshotDates];

  if(
    selectedDays !==
    "ALL"
  ){

    dates =
      dates.slice(
        -Number(
          selectedDays
        )
      );
  }

  const summaryRows = [];

  dates.forEach(date=>{

    const styleInventory =

      snapshotMap[
        date
      ] || {};

    const brandCounts = {};

    brands.forEach(
      brand=>{

        brandCounts[
          brand
        ] = 0;
      }
    );

    let totalLive = 0;

    eligibleStyles.forEach(
      styleId=>{

        const brand =

          styleBrandMap[
            styleId
          ]?.brand;

        if(
          !brand
        ){

          return;
        }

        const stock =

          Number(

            styleInventory[
              styleId
            ] || 0

          );

        if(
          stock > 0
        ){

          brandCounts[
            brand
          ]++;

          totalLive++;
        }
      }
    );

    summaryRows.push({

      date,

      ...brandCounts,

      totalLive
    });
  });

  const latestSnapshotDate =

    dates[
      dates.length - 1
    ];

  const previousSnapshotDate =

    dates[
      dates.length - 2
    ] || null;

  const latestInventory =

    snapshotMap[
      latestSnapshotDate
    ] || {};

  const previousInventory =

    snapshotMap[
      previousSnapshotDate
    ] || {};

  const latestBrandCounts = {};

  const previousBrandCounts = {};

  brands.forEach(
    brand=>{

      latestBrandCounts[
        brand
      ] = 0;

      previousBrandCounts[
        brand
      ] = 0;
    }
  );

  const exportRows = [];

  eligibleStyles.forEach(
    styleId=>{

      const brand =

        styleBrandMap[
          styleId
        ]?.brand;

      if(
        !brand
      ){

        return;
      }

      const latestStock =

        Number(

          latestInventory[
            styleId
          ] || 0

        );

      const previousStock =

        Number(

          previousInventory[
            styleId
          ] || 0

        );

      if(
        latestStock > 0
      ){

        latestBrandCounts[
          brand
        ]++;
      }

      if(
        previousStock > 0
      ){

        previousBrandCounts[
          brand
        ]++;
      }

      exportRows.push({

        snapshotDate:
          latestSnapshotDate,

        brand,

        style_id:
          styleId,

        inventory:
          latestStock,

        status:

          latestStock > 0

            ? "LIVE"

            : "NON LIVE"
      });
    }
  );

  const liveRows =

    exportRows.filter(
      r=>

        r.status ===
        "LIVE"
    );

  const nonLiveRows =

    exportRows.filter(
      r=>

        r.status ===
        "NON LIVE"
    );

  const kpis =
    buildLiveCountKPIs(

      exportRows,

      latestSnapshotDate,

      previousSnapshotDate,

      latestBrandCounts,

      previousBrandCounts,

      eligibleStyles.length,

      brands

    );

  return {

    summaryRows,

    brands,

    kpis,

    latestSnapshotDate,

    liveRows,

    nonLiveRows
  };
}