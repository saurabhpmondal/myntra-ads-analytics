import { fetchOOSData } from "./oosEyeFetcher.js";
import { parseCSV } from "./oosEyeParser.js";

let STORE = null;

export async function getOOSStore(){

  if(STORE){

    return STORE;
  }

  const raw =
    await fetchOOSData();

  STORE = {

    productMaster:
      parseCSV(
        raw.productMaster
      ),

    sales:
      parseCSV(
        raw.sales
      ),

    sellerStock:
      parseCSV(
        raw.sellerStock
      ),

    sjitStock:
      parseCSV(
        raw.sjitStock
      ),

    sorStock:
      parseCSV(
        raw.sorStock
      )

  };

  return STORE;
}