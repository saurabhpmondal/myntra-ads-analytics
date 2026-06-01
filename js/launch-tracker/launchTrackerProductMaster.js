function txt(v){

  return String(v || "")
    .trim();
}

function buildDate(
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

export function buildLaunchProductMaster(
  productMaster
){

  const styleMaster = {};

  const erpToStyle = {};

  const today =
    new Date();

  productMaster.forEach(r=>{

    const style =
      txt(r.style_id);

    if(
      !style
    ){

      return;
    }

    const erpSku =
      txt(r.erp_sku);

    const launchDate =
      buildDate(

        r.date,

        r.month,

        r.year
      );

    const launchAge =
      daysBetween(

        launchDate,

        today
      );

    styleMaster[style] = {

      style_id:
        style,

      erp_sku:
        erpSku,

      brand:
        txt(r.brand),

      article_type:
        txt(
          r.article_type
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

    if(
      erpSku
    ){

      erpToStyle[
        erpSku
      ] = style;
    }
  });

  return {

    styleMaster,

    erpToStyle
  };
}