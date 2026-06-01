import {
  fetchLaunchTrackerData
}
from "./launchTrackerFetcher.js";

import {
  parseCSV
}
from "./launchTrackerParser.js";

let STORE = null;

export async function getLaunchTrackerStore(){

  if(
    STORE
  ){

    return STORE;
  }

  const raw =
    await fetchLaunchTrackerData();

  STORE = {

    productMaster:
      parseCSV(
        raw.productMaster
      ),

    sales:
      parseCSV(
        raw.sales
      ),

    cpr:
      parseCSV(
        raw.cpr
      ),

    traffic:
      parseCSV(
        raw.traffic
      ),

    sellerStock:
      parseCSV(
        raw.sellerStock
      )
  };

  return STORE;
}

export function clearLaunchTrackerStore(){

  STORE = null;
}