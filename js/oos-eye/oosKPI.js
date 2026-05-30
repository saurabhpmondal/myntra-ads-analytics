export function buildOOSKPIs(
  rows
){

  return {

    totalOOS:

      rows.length,

    oos3Plus:

      rows.filter(
        r =>
          Number(
            r.oosSnapshots || 0
          ) >= 3
      ).length,

    oos7Plus:

      rows.filter(
        r =>
          Number(
            r.oosSnapshots || 0
          ) >= 7
      ).length,

    criticalStyles:

      rows.filter(
        r =>
          r.severityFlag ===
          "CRITICAL"
      ).length,

    estimatedLostUnits:

      Math.round(

        rows.reduce(
          (sum,r)=>

            sum +

            Number(
              r.salesLoss || 0
            ),

          0
        )

      )
  };
}