function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

export function buildLaunchStockMap(
  sellerStock
){

  const stockMap = {};

  sellerStock.forEach(r=>{

    const erpSku =
      txt(
        r.erp_sku
      );

    if(
      !erpSku
    ){

      return;
    }

    stockMap[erpSku] =

      (
        stockMap[erpSku] || 0
      )

      +

      num(
        r.units
      );
  });

  return stockMap;
}