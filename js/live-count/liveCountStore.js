import {
  fetchLiveCountData
}
from "./liveCountFetcher.js";

import {
  parseLiveCountData
}
from "./liveCountParser.js";

let CACHE = null;

export async function getLiveCountStore(){

  if(
    CACHE
  ){

    return CACHE;
  }

  const {

    listingCSV,

    inventoryCSV

  } =
    await fetchLiveCountData();

  const {

    listings,

    inventory

  } =
    parseLiveCountData(

      listingCSV,

      inventoryCSV

    );

  CACHE = {

    listings,

    inventory

  };

  return CACHE;
}

export function clearLiveCountStore(){

  CACHE = null;
}