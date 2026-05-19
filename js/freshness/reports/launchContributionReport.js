function num(v) {

  return Number(
    String(v ?? "")
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

function txt(v) {

  return String(v ?? "")
    .trim();
}

function makeDate(
  y,
  m,
  d
) {

  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d)
  );
}

function diffDays(
  current,
  launch
) {

  const ms =
    current - launch;

  return Math.floor(
    ms / (1000 * 60 * 60 * 24)
  );
}

function getBucket(days) {

  if (days <= 30) {
    return "0-30";
  }

  if (days <= 60) {
    return "31-60";
  }

  if (days <= 90) {
    return "61-90";
  }

  if (days <= 120) {
    return "91-120";
  }

  if (days <= 180) {
    return "121-180";
  }

  return ">180";
}

function passFilter(
  row,
  filter
) {

  const y =
    num(row.year);

  const m =
    num(row.month);

  const d =
    num(row.date);

  if (
    filter.year &&
    y !== num(filter.year)
  ) {
    return false;
  }

  if (
    filter.month &&
    m !== num(filter.month)
  ) {
    return false;
  }

  if (filter.start) {

    const sd =
      Number(
        String(
          filter.start
        ).slice(-2)
      );

    if (d < sd) {
      return false;
    }
  }

  if (filter.end) {

    const ed =
      Number(
        String(
          filter.end
        ).slice(-2)
      );

    if (d > ed) {
      return false;
    }
  }

  return true;
}

export function buildLaunchContributionReport(
  data
) {

  const {
    salesRows,
    masterRows
  } = data;

  const filter =
    window.ACTIVE_FILTER || {};

  const filteredSales =
    salesRows.filter(r =>
      passFilter(
        r,
        filter
      )
    );

  /* ---------- MASTER MAP ---------- */

  const masterByStyle = {};

  const allBrands =
    new Set();

  masterRows.forEach(r => {

    const style =
      txt(r.style_id);

    if (!style) return;

    const brand =
      txt(r.brand);

    const launchDate =
      makeDate(
        r.year,
        r.month,
        r.date
      );

    masterByStyle[style] = {

      style,
      brand,
      launchDate
    };

    if (brand) {
      allBrands.add(brand);
    }
  });

  /* ---------- CURRENT DATE ---------- */

  let latestDate =
    new Date();

  filteredSales.forEach(r => {

    const dt =
      makeDate(
        r.year,
        r.month,
        r.date
      );

    if (dt > latestDate) {
      latestDate = dt;
    }
  });

  /* ---------- BUCKET STRUCTURE ---------- */

  const bucketMap = {

    "0-30": {
      bucket: "0-30",
      launchStyles: new Set(),
      soldStyles: new Set(),
      sales: 0,
      brands: {}
    },

    "31-60": {
      bucket: "31-60",
      launchStyles: new Set(),
      soldStyles: new Set(),
      sales: 0,
      brands: {}
    },

    "61-90": {
      bucket: "61-90",
      launchStyles: new Set(),
      soldStyles: new Set(),
      sales: 0,
      brands: {}
    },

    "91-120": {
      bucket: "91-120",
      launchStyles: new Set(),
      soldStyles: new Set(),
      sales: 0,
      brands: {}
    },

    "121-180": {
      bucket: "121-180",
      launchStyles: new Set(),
      soldStyles: new Set(),
      sales: 0,
      brands: {}
    },

    ">180": {
      bucket: ">180",
      launchStyles: new Set(),
      soldStyles: new Set(),
      sales: 0,
      brands: {}
    }
  };

  /* ---------- ACTUAL LAUNCH STYLES ---------- */

  Object.values(masterByStyle)
    .forEach(r => {

      const age =
        diffDays(
          latestDate,
          r.launchDate
        );

      const bucket =
        getBucket(age);

      bucketMap[
        bucket
      ].launchStyles.add(
        r.style
      );
    });

  let grandSales = 0;

  /* ---------- SALES PROCESS ---------- */

  filteredSales.forEach(r => {

    const style =
      txt(r.style_id);

    const qty =
      num(r.qty || 1);

    const master =
      masterByStyle[
        style
      ];

    if (!master) return;

    const age =
      diffDays(
        latestDate,
        master.launchDate
      );

    const bucket =
      getBucket(age);

    const brand =
      txt(master.brand);

    bucketMap[
      bucket
    ].soldStyles.add(
      style
    );

    bucketMap[
      bucket
    ].sales += qty;

    grandSales += qty;

    if (
      !bucketMap[
        bucket
      ].brands[brand]
    ) {

      bucketMap[
        bucket
      ].brands[brand] = 0;
    }

    bucketMap[
      bucket
    ].brands[brand] += qty;
  });

  /* ---------- BRAND TOTALS ---------- */

  const brandTotals = {};

  Object.keys(bucketMap)
    .forEach(bucket => {

      const brands =
        bucketMap[
          bucket
        ].brands;

      Object.keys(brands)
        .forEach(brand => {

          if (
            !brandTotals[
              brand
            ]
          ) {

            brandTotals[
              brand
            ] = 0;
          }

          brandTotals[
            brand
          ] += brands[
            brand
          ];
        });
    });

  /* ---------- FINAL ROWS ---------- */

  const rows = [

    "0-30",
    "31-60",
    "61-90",
    "91-120",
    "121-180",
    ">180"

  ].map(bucket => {

    const row =
      bucketMap[bucket];

    const brandCells =
      {};

    Array.from(
      allBrands
    )
    .sort()
    .forEach(brand => {

      const qty =
        row.brands[
          brand
        ] || 0;

      const share =
        row.sales
          ? (
              qty /
              row.sales
            ) * 100
          : 0;

      brandCells[
        brand
      ] = {

        qty,

        share
      };
    });

    return {

      bucket,

      launchStyles:
        row.launchStyles.size,

      soldStyles:
        row.soldStyles.size,

      sales:
        row.sales,

      share:
        grandSales
          ? (
              row.sales /
              grandSales
            ) * 100
          : 0,

      brands:
        brandCells
    };
  });

  /* ---------- TOTAL BRANDS ---------- */

  const totalBrandCells =
    {};

  Array.from(
    allBrands
  )
  .sort()
  .forEach(brand => {

    const qty =
      brandTotals[
        brand
      ] || 0;

    totalBrandCells[
      brand
    ] = {

      qty,

      share:
        grandSales
          ? (
              qty /
              grandSales
            ) * 100
          : 0
    };
  });

  return {

    brands:
      Array.from(
        allBrands
      ).sort(),

    rows,

    totals: {

      launchStyles:
        rows.reduce(
          (s,r)=>
            s +
            r.launchStyles,
          0
        ),

      soldStyles:
        rows.reduce(
          (s,r)=>
            s +
            r.soldStyles,
          0
        ),

      sales:
        grandSales,

      brands:
        totalBrandCells
    }
  };
}