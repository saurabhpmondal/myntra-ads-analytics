import { getOOSStore } from "./oosEyeStore.js";

function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

function parseDate(
  day,
  month,
  year
){

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
}

function daysBetween(
  a,
  b
){

  return Math.floor(
    (
      b - a
    ) /
    86400000
  );
}

export async function buildOOSEyeData(){

  const {

    productMaster,
    sales,
    sellerStock,
    sjitStock,
    sorStock

  } =
    await getOOSStore();

  const today =
    new Date();

  /* ------------------------
     PRODUCT MASTER
  ------------------------ */

  const erpToStyle = {};

  const styleMaster = {};

  productMaster.forEach(r=>{

    const style =
      txt(r.style_id);

    const erp =
      txt(r.erp_sku);

    if(!style){

      return;
    }

    const launchDate =
      parseDate(
        r.date,
        r.month,
        r.year
      );

    styleMaster[style] = {

      style,

      erp,

      brand:
        txt(r.brand),

      status:
        txt(r.status),

      launchDate

    };

    if(erp){

      erpToStyle[erp] =
        style;
    }
  });

  /* ------------------------
     LAST 30 DAYS SALES
  ------------------------ */

  const salesMap = {};

  sales.forEach(r=>{

    const style =
      txt(r.style_id);

    if(!style){

      return;
    }

    const saleDate =
      parseDate(
        r.date,
        r.month,
        r.year
      );

    const age =
      daysBetween(
        saleDate,
        today
      );

    if(age > 30){

      return;
    }

    salesMap[style] =
      (
        salesMap[style] || 0
      )
      +
      num(r.qty);
  });

  /* ------------------------
     SJIT
  ------------------------ */

  const sjitMap = {};

  sjitStock.forEach(r=>{

    const style =
      txt(r.style_id);

    sjitMap[style] =
      (
        sjitMap[style] || 0
      )
      +
      num(
        r.inventory_count
      );
  });

  /* ------------------------
     SOR
  ------------------------ */

  const sorMap = {};

  sorStock.forEach(r=>{

    const style =
      txt(r.style_id);

    sorMap[style] =
      (
        sorMap[style] || 0
      )
      +
      num(
        r.units
      );
  });

  /* ------------------------
     SELLER STOCK
  ------------------------ */

  const headers =
    Object.keys(
      sellerStock[0] || {}
    );

  const dateColumns =
    headers.filter(h=>{

      return (
        h.includes("-")
      );
    });

  const latestDate =
    dateColumns[
      dateColumns.length - 1
    ];

  const sellerMap = {};

  sellerStock.forEach(r=>{

    const erp =
      txt(r.erp);

    const style =
      erpToStyle[erp];

    if(!style){

      return;
    }

    let oosDays = 0;

    for(
      let i =
        dateColumns.length - 1;
      i >= 0;
      i--
    ){

      const stock =
        num(
          r[
            dateColumns[i]
          ]
        );

      if(stock <= 0){

        oosDays++;

      }else{

        break;
      }
    }

    sellerMap[style] = {

      currentStock:
        num(
          r[latestDate]
        ),

      oosDays

    };
  });

  /* ------------------------
     FINAL REPORT
  ------------------------ */

  const rows = [];

  Object.keys(
    salesMap
  ).forEach(style=>{

    const master =
      styleMaster[style];

    if(!master){

      return;
    }

    if(

      master.status
        .toLowerCase() !==
      "continue"

    ){

      return;
    }

    const launchAge =
      daysBetween(
        master.launchDate,
        today
      );

    if(
      launchAge > 90
    ){

      return;
    }

    const sales30d =
      salesMap[style];

    let threshold = 7;

    if(
      sales30d > 100
    ){

      threshold = 1;

    }else if(
      sales30d >= 50
    ){

      threshold = 3;
    }

    const seller =
      sellerMap[style] || {

        currentStock:0,
        oosDays:0

      };

    if(
      seller.oosDays <
      threshold
    ){

      return;
    }

    const drr =
      sales30d / 30;

    const severity =
      drr *
      seller.oosDays;

    let priority =
      "LOW";

    if(
      severity > 50
    ){

      priority =
        "CRITICAL";

    }else if(
      severity > 20
    ){

      priority =
        "HIGH";

    }else if(
      severity > 10
    ){

      priority =
        "MEDIUM";
    }

    rows.push({

      priority,

      style_id:
        style,

      erp_sku:
        master.erp,

      brand:
        master.brand,

      launchAge,

      sales30d,

      drr:
        Number(
          drr.toFixed(2)
        ),

      oosDays:
        seller.oosDays,

      sellerStock:
        seller.currentStock,

      sjitStock:
        sjitMap[style] || 0,

      sorStock:
        sorMap[style] || 0,

      severity:
        Number(
          severity.toFixed(2)
        )

    });
  });

  rows.sort(
    (a,b)=>
      b.severity -
      a.severity
  );

  const kpis = {

    flaggedStyles:
      rows.length,

    criticalStyles:
      rows.filter(
        r =>
          r.priority ===
          "CRITICAL"
      ).length,

    lostUnitsRisk:
      Math.round(

        rows.reduce(
          (sum,r)=>

            sum +
            r.severity,

          0
        )

      ),

    newLaunchRisk:

      rows.filter(
        r =>
          r.launchAge <= 60
      ).length
  };

  return {

    rows,
    kpis
  };
}