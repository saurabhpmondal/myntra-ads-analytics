function txt(v){

  return String(v || "")
    .trim();
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
    )

    /

    86400000

  );
}

export function buildAttributeProductMaster(
  productMaster
){

  const today =
    new Date();

  const styleMaster = {};

  const styleToERP = {};

  const erpToStyles = {};

  productMaster.forEach(r=>{

    const styleId =
      txt(
        r.style_id
      );

    const erpSku =
      txt(
        r.erp_sku
      );

    if(
      !styleId
    ){

      return;
    }

    const launchDate =
      parseDate(

        r.date,

        r.month,

        r.year

      );

    const launchAge =
      daysBetween(

        launchDate,

        today

      );

    styleMaster[
      styleId
    ] = {

      style_id:
        styleId,

      erp_sku:
        erpSku,

      brand:
        txt(
          r.brand
        ),

      erp_status:
        txt(
          r.status
        ),

      launchDate,

      launchDateDisplay:

        launchDate
          .toLocaleDateString(
            "en-GB"
          ),

      launchAge
    };

    styleToERP[
      styleId
    ] =
      erpSku;

    if(
      !erpToStyles[
        erpSku
      ]
    ){

      erpToStyles[
        erpSku
      ] = [];
    }

    erpToStyles[
      erpSku
    ].push(
      styleId
    );
  });

  return {

    styleMaster,

    styleToERP,

    erpToStyles
  };
}