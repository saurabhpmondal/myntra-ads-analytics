import {

  passFilter,
  diffDays,
  txt

} from "../utils/freshnessHelpers.js";

import {

  FRESHNESS_BUCKETS

} from "../config/freshnessBuckets.js";

export function buildFreshnessMatrix(
  data
) {

  const {
    parsedSales
  } = data;

  const filter =
    window.ACTIVE_FILTER || {};

  const bucketMap = {};

  FRESHNESS_BUCKETS.forEach(b => {

    bucketMap[b.label] = {

      label: b.label,

      launchStyles: new Set(),

      soldQty: 0,

      brands: {}
    };
  });

  let totalSales = 0;

  parsedSales
    .filter(r =>
      passFilter(r, filter)
    )
    .forEach(r => {

      if (!r.master) return;

      const age = diffDays(
        r.saleDate,
        r.master.launchDate
      );

      const bucket =
        FRESHNESS_BUCKETS.find(b =>
          age >= b.min &&
          age <= b.max
        );

      if (!bucket) return;

      const row =
        bucketMap[bucket.label];

      const brand =
        txt(r.master.brand);

      row.launchStyles.add(
        r.style_id
      );

      row.soldQty += r.qty;

      totalSales += r.qty;

      if (!row.brands[brand]) {

        row.brands[brand] = 0;
      }

      row.brands[brand] += r.qty;
    });

  const rows =
    Object.values(bucketMap)
      .map(r => {

        const share =
          totalSales
            ? (r.soldQty / totalSales) * 100
            : 0;

        const brands = {};

        Object.keys(r.brands)
          .forEach(b => {

            const qty =
              r.brands[b];

            brands[b] = {

              qty,

              share:
                r.soldQty
                  ? (qty / r.soldQty) * 100
                  : 0
            };
          });

        return {

          label: r.label,

          launchStyles:
            r.launchStyles.size,

          soldQty:
            r.soldQty,

          share,

          brands
        };
      });

  return {
    rows,
    totalSales
  };
}