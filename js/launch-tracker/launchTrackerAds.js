function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

export function buildLaunchAdsMap(
  cpr
){

  const adsMap = {};

  cpr.forEach(r=>{

    const style =
      txt(
        r.product_id
      );

    if(
      !style
    ){

      return;
    }

    if(
      !adsMap[style]
    ){

      adsMap[style] = {

        impressions:0,

        clicks:0,

        spend:0,

        unitsSold:0,

        revenue:0,

        roas:0
      };
    }

    adsMap[style]
      .impressions +=
        num(
          r.impressions
        );

    adsMap[style]
      .clicks +=
        num(
          r.clicks
        );

    adsMap[style]
      .spend +=
        num(
          r.budget_spend
        );

    adsMap[style]
      .unitsSold +=
        num(
          r.units_sold_total
        );

    adsMap[style]
      .revenue +=
        num(
          r.total_revenue
        );
  });

  Object.keys(
    adsMap
  ).forEach(style=>{

    const row =
      adsMap[style];

    row.spend =
      Number(
        row.spend
          .toFixed(2)
      );

    row.revenue =
      Number(
        row.revenue
          .toFixed(2)
      );

    row.roas =

      row.spend > 0

        ? Number(

            (
              row.revenue /
              row.spend
            ).toFixed(2)

          )

        : 0;
  });

  return adsMap;
}