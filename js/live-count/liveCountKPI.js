function fmtPct(
  value
){

  return Number(
    value || 0
  ).toFixed(1);
}

export function buildLiveCountKPIs(

  latestLiveRows,

  latestSnapshotDate,

  previousSnapshotDate,

  latestBrandCounts,

  previousBrandCounts,

  eligibleStyleCount,

  brands

){

  let totalLive = 0;

  let totalNonLive = 0;

  latestLiveRows.forEach(row=>{

    if(
      row.status ===
      "LIVE"
    ){

      totalLive++;

    }else{

      totalNonLive++;
    }
  });

  let biggestGainer =
    "-";

  let biggestDecliner =
    "-";

  let gainValue = 0;

  let declineValue = 0;

  brands.forEach(brand=>{

    const latest =

      latestBrandCounts[
        brand
      ] || 0;

    const previous =

      previousBrandCounts[
        brand
      ] || 0;

    const change =

      latest -
      previous;

    if(
      change >
      gainValue
    ){

      gainValue =
        change;

      biggestGainer =
        `${brand} (+${change})`;
    }

    if(
      change <
      declineValue
    ){

      declineValue =
        change;

      biggestDecliner =
        `${brand} (${change})`;
    }
  });

  const livePercent =

    eligibleStyleCount

      ?

      fmtPct(

        (
          totalLive
          /
          eligibleStyleCount
        )

        * 100

      )

      : "0.0";

  return {

    latestSnapshotDate,

    previousSnapshotDate,

    totalLive,

    totalNonLive,

    livePercent,

    brandsTracked:
      brands.length,

    biggestGainer,

    biggestDecliner
  };
}