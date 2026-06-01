export function buildLaunchTrackerKPIs(
  rows
){

  return {

    totalLaunches:

      rows.length,

    soldLaunches:

      rows.filter(
        r =>
          Number(
            r.salesUnits || 0
          ) > 0
      ).length,

    unsoldLaunches:

      rows.filter(
        r =>
          Number(
            r.salesUnits || 0
          ) === 0
      ).length,

    totalAdSpend:

      Math.round(

        rows.reduce(
          (sum,r)=>

            sum +

            Number(
              r.adsSpend || 0
            ),

          0
        )

      ),

    adsNoSales:

      rows.filter(
        r =>

          Number(
            r.adsSpend || 0
          ) > 0

          &&

          Number(
            r.salesUnits || 0
          ) === 0
      ).length,

    lowStockLaunches:

      rows.filter(
        r =>

          r.launchStatus ===
          "LOW STOCK"
      ).length
  };
}