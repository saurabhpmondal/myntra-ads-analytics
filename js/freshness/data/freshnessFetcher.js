import { SHEETS } from "../../config/sheets.js";

import { fetchCSV } from "../../core/fetcher.js";

import { parseCSV } from "../../core/parser.js";

let READY = false;

let SALES = [];
let MASTER = [];

export async function getFreshnessData() {

  if (!READY) {

    const [
      salesCsv,
      masterCsv
    ] = await Promise.all([

      fetchCSV(
        SHEETS.SALES
      ),

      fetchCSV(
        SHEETS.PRODUCT_MASTER
      )

    ]);

    SALES =
      parseCSV(salesCsv);

    MASTER =
      parseCSV(masterCsv);

    READY = true;
  }

  return {

    salesRows: SALES,

    masterRows: MASTER
  };
}