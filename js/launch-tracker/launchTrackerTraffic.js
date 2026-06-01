function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

export function buildLaunchTrafficMap(
  traffic
){

  const trafficMap = {};

  traffic.forEach(r=>{

    const style =
      txt(
        r.style_id
      );

    if(
      !style
    ){

      return;
    }

    if(
      !trafficMap[style]
    ){

      trafficMap[style] = {

        impressions:0,

        clicks:0,

        addToCarts:0,

        purchases:0,

        rating:0,

        ratingCount:0
      };
    }

    trafficMap[style]
      .impressions +=
        num(
          r.impressions
        );

    trafficMap[style]
      .clicks +=
        num(
          r.clicks
        );

    trafficMap[style]
      .addToCarts +=
        num(
          r.add_to_carts
        );

    trafficMap[style]
      .purchases +=
        num(
          r.purchases
        );

    const rating =
      Number(
        r.rating || 0
      );

    if(
      rating > 0
    ){

      trafficMap[style]
        .rating +=
          rating;

      trafficMap[style]
        .ratingCount += 1;
    }
  });

  Object.keys(
    trafficMap
  ).forEach(style=>{

    const row =
      trafficMap[style];

    row.rating =

      row.ratingCount > 0

        ? Number(

            (
              row.rating /
              row.ratingCount
            ).toFixed(2)

          )

        : 0;

    delete row.ratingCount;
  });

  return trafficMap;
}