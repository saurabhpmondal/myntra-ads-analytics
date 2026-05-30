import { OOS_EYE_SHEETS } from "./oosEyeSheets.js";

async function fetchCSV(url){

  const response =
    await fetch(
      `${url}&t=${Date.now()}`
    );

  return response.text();
}

export async function fetchOOSData(){

  const [

    productMaster,
    sales,
    sellerStock,
    sjitStock,
    sorStock

  ] = await Promise.all([

    fetchCSV(
      OOS_EYE_SHEETS.PRODUCT_MASTER
    ),

    fetchCSV(
      OOS_EYE_SHEETS.SALES
    ),

    fetchCSV(
      OOS_EYE_SHEETS.SELLER_STOCK
    ),

    fetchCSV(
      OOS_EYE_SHEETS.SJIT_STOCK
    ),

    fetchCSV(
      OOS_EYE_SHEETS.SOR_STOCK
    )

  ]);

  return {

    productMaster,
    sales,
    sellerStock,
    sjitStock,
    sorStock

  };
}