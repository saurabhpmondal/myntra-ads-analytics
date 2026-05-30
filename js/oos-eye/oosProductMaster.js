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

export function buildProductMaster(
  productMaster
){

  const styleMaster = {};

  const erpToStyle = {};

  productMaster.forEach(r=>{

    const style =
      txt(r.style_id);

    const erp =
      txt(r.erp_sku);

    if(!style){

      return;
    }

    styleMaster[style] = {

      style,

      erp,

      brand:
        txt(r.brand),

      status:
        txt(r.status),

      launchDate:
        parseDate(
          r.date,
          r.month,
          r.year
        )
    };

    if(erp){

      erpToStyle[erp] =
        style;
    }
  });

  return {

    styleMaster,

    erpToStyle
  };
}