import {
  fetchAttributeData
}
from "./attributeFetcher.js";

import {
  parseCSV
}
from "./attributeParser.js";

let STORE = null;

export async function getAttributeStore(){

  if(
    STORE
  ){

    return STORE;
  }

  const raw =
    await fetchAttributeData();

  STORE = {

    catalogueMaster:
      parseCSV(
        raw.catalogueMaster
      ),

    sales:
      parseCSV(
        raw.sales
      ),

    productMaster:
      parseCSV(
        raw.productMaster
      )

  };

  return STORE;
}

export function clearAttributeStore(){

  STORE = null;
}