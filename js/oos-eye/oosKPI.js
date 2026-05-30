export function buildOOSKPIs(
  rows
){

  return {

    flaggedStyles:
      rows.length,

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

      ),

    avgOOSDays:

      rows.length

        ? Number(

            rows.reduce(
              (sum,r)=>

                sum +
                Number(
                  r.oosDays || 0
                ),

              0
            )

            /

            rows.length

          ).toFixed(1)

        : 0
  };
}