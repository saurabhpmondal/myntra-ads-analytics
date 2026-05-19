function num(v) {
  return Number(
    String(v ?? "")
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

function txt(v) {
  return String(v ?? "").trim();
}

function monthNum(v) {

  const s =
    txt(v).toUpperCase();

  const map = {
    JAN:1,
    FEB:2,
    MAR:3,
    APR:4,
    MAY:5,
    JUN:6,
    JUNE:6,
    JUL:7,
    JULY:7,
    AUG:8,
    SEP:9,
    SEPT:9,
    OCT:10,
    NOV:11,
    DEC:12
  };

  return map[s] || num(v);
}

function makeDate(y, m, d) {

  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d)
  );
}

function diffDays(a, b) {

  const ms =
    a.getTime() - b.getTime();

  return Math.floor(
    ms / (1000 * 60 * 60 * 24)
  );
}

function validSale(row) {

  const s =
    txt(row.order_status)
      .toUpperCase();

  return (
    s !== "RTO" &&
    s !== "F"
  );
}

function passFilter(row, filter) {

  const y =
    num(row.year);

  const m =
    monthNum(row.month);

  const d =
    num(row.date || row.day);

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

    const sd = Number(
      String(filter.start)
        .slice(-2)
    );

    if (d < sd) {
      return false;
    }
  }

  if (filter.end) {

    const ed = Number(
      String(filter.end)
        .slice(-2)
    );

    if (d > ed) {
      return false;
    }
  }

  return true;
}

/* ------------------------------------------------ */
/* MAIN REPORT */
/* ------------------------------------------------ */

export function buildLaunchContributionReport(data) {

  const {
    salesRows,
    masterRows
  } = data;

  const filter =
    window.ACTIVE_FILTER || {};

  /* -------------------------------------------- */
  /* MASTER MAP */
  /* -------------------------------------------- */

  const launchMap = {};

  masterRows.forEach(r => {

    const style =
      txt(r.style_id);

    if (!style) return;

    const y =
      num(r.year);

    const m =
      monthNum(r.month);

    const d =
      num(r.date);

    if (
      !y ||
      !m ||
      !d
    ) return;

    launchMap[style] = {

      style,

      brand:
        txt(r.brand),

      launchDate:
        makeDate(y, m, d)
    };
  });

  /* -------------------------------------------- */
  /* CURRENT FILTER DATE */
  /* -------------------------------------------- */

  const fy =
    num(filter.year);

  const fm =
    num(filter.month);

  const endDay =
    filter.end
      ? Number(
          String(filter.end)
            .slice(-2)
        )
      : 31;

  const reportDate =
    makeDate(
      fy,
      fm,
      endDay
    );

  /* -------------------------------------------- */
  /* BUCKETS */
  /* -------------------------------------------- */

  const bucketMap = {

    "0-30": {
      bucket: "0-30 DAYS",
      styles: new Set(),
      sales: 0,
      brands: {}
    },

    "31-60": {
      bucket: "31-60 DAYS",
      styles: new Set(),
      sales: 0,
      brands: {}
    },

    "61-90": {
      bucket: "61-90 DAYS",
      styles: new Set(),
      sales: 0,
      brands: {}
    }

  };

  /* -------------------------------------------- */
  /* FILTER SALES */
  /* -------------------------------------------- */

  const filteredSales =
    salesRows.filter(r =>
      validSale(r) &&
      passFilter(r, filter)
    );

  let totalSales = 0;

  filteredSales.forEach(r => {

    const style =
      txt(r.style_id) ||
      txt(r.styleid) ||
      txt(r.style);

    if (!style) return;

    const master =
      launchMap[style];

    if (!master) return;

    const launchDate =
      master.launchDate;

    const age =
      diffDays(
        reportDate,
        launchDate
      );

    let bucketKey = "";

    if (
      age >= 0 &&
      age <= 30
    ) {
      bucketKey = "0-30";
    }

    else if (
      age >= 31 &&
      age <= 60
    ) {
      bucketKey = "31-60";
    }

    else if (
      age >= 61 &&
      age <= 90
    ) {
      bucketKey = "61-90";
    }

    else {
      return;
    }

    const qty =
      num(r.qty || 1);

    totalSales += qty;

    const bucket =
      bucketMap[bucketKey];

    bucket.sales += qty;

    bucket.styles.add(style);

    const brand =
      master.brand || "UNKNOWN";

    if (!bucket.brands[brand]) {
      bucket.brands[brand] = 0;
    }

    bucket.brands[brand] += qty;
  });

  /* -------------------------------------------- */
  /* FINAL ROWS */
  /* -------------------------------------------- */

  const rows =
    Object.values(bucketMap)
      .map(r => {

        const brandEntries =
          Object.entries(r.brands)
            .sort((a,b)=>
              b[1]-a[1]
            );

        const topBrands =
          brandEntries
            .slice(0, 5)
            .map(([brand, qty]) => {

              const share =
                r.sales
                  ? (
                      qty /
                      r.sales
                    ) * 100
                  : 0;

              return {
                brand,
                qty,
                share
              };
            });

        return {

          bucket:
            r.bucket,

          launchStyles:
            r.styles.size,

          sales:
            r.sales,

          share:
            totalSales
              ? (
                  r.sales /
                  totalSales
                ) * 100
              : 0,

          brands:
            topBrands
        };
      });

  /* -------------------------------------------- */
  /* GRAND TOTAL */
  /* -------------------------------------------- */

  const totalStyles =
    rows.reduce(
      (s,r)=>
        s + r.launchStyles,
      0
    );

  const grandSales =
    rows.reduce(
      (s,r)=>
        s + r.sales,
      0
    );

  return {

    rows,

    totals: {

      styles:
        totalStyles,

      sales:
        grandSales
    }
  };
}