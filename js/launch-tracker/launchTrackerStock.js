function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

export function buildLaunchStockMap(
  sellerStock,
  erpToStyle
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

    const style =
      erpToStyle[
        erpSku
      ];

    if(
      !style
    ){

      return;
    }

    stockMap[style] =

      (
        stockMap[style] || 0
      )

      +

      num(
        r.units
      );
  });

  return stockMap;
}