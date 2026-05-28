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

function validSale(row) {

  const s =
    txt(row.order_status)
      .toUpperCase();

  return s !== "RTO" && s !== "F";
}

function validReturn(row) {

  return (
    txt(row.type)
      .toUpperCase()
      === "RETURN"
  );
}

function passFilter(
  row,
  filter
){

  const y =
    num(row.year);

  const m =
    monthNum(row.month);

  const d =
    num(row.date || row.day);

  if (
    filter.year &&
    y !== num(filter.year)
  ){
    return false;
  }

  if (
    filter.month &&
    m !== num(filter.month)
  ){
    return false;
  }

  if (filter.start) {

    const sd =
      Number(
        String(filter.start)
          .slice(-2)
      );

    if (d < sd){
      return false;
    }
  }

  if (filter.end) {

    const ed =
      Number(
        String(filter.end)
          .slice(-2)
      );

    if (d > ed){
      return false;
    }
  }

  return true;
}

function getPrevMonth(filter) {

  let m =
    Number(filter.month);

  let y =
    Number(filter.year);

  m -= 1;

  if (m === 0) {

    m = 12;

    y -= 1;
  }

  return {
    ...filter,
    month: m,
    year: y,
    start: "",
    end: ""
  };
}

export function buildSalesData(
  salesRows,
  returnRows,
  masterRows,
  filter
){

  const map = {};

  const orders =
    new Map();

  const masterMap = {};

  masterRows.forEach(r => {

    const style =
      txt(r.style_id);

    if (!style) return;

    masterMap[style] = {

      brand:
        txt(r.brand),

      erp_sku:
        txt(r.erp_sku),

      status:
        txt(r.status),

      launch_date:
        txt(r.launch_date)
    };
  });

  salesRows.forEach(row => {

    if (!validSale(row)) return;

    if (
      !passFilter(
        row,
        filter
      )
    ){
      return;
    }

    const style =
      txt(row.style_id);

    const order =
      txt(row.order_line_id);

    if (
      !style ||
      !order
    ){
      return;
    }

    orders.set(
      order,
      style
    );

    if (!map[style]) {

      map[style] = {

        id: style,

        sold: 0,

        value: 0,

        returns: 0,

        brand:
          masterMap[style]
            ?.brand || "",

        erp_sku:
          masterMap[style]
            ?.erp_sku || "",

        status:
          masterMap[style]
            ?.status || "",

        launch_date:
          masterMap[style]
            ?.launch_date || ""
      };
    }

    map[style].sold +=
      num(row.qty || 1);

    map[style].value +=
      num(row.final_amount);
  });

  returnRows.forEach(row => {

    if (!validReturn(row))
      return;

    const order =
      txt(row.order_line_id);

    const style =
      orders.get(order);

    if (
      !style ||
      !map[style]
    ){
      return;
    }

    map[style].returns += 1;
  });

  const prevFilter =
    getPrevMonth(filter);

  const prevMap = {};

  salesRows.forEach(row => {

    if (!validSale(row))
      return;

    if (
      !passFilter(
        row,
        prevFilter
      )
    ){
      return;
    }

    const style =
      txt(row.style_id);

    if (!style) return;

    if (!prevMap[style]) {

      prevMap[style] = {
        sold: 0,
        value: 0
      };
    }

    prevMap[style].sold +=
      num(row.qty || 1);

    prevMap[style].value +=
      num(row.final_amount);
  });

  let rows =
    Object.values(map)
      .map(r => {

    const prev =
      prevMap[r.id] || {
        sold: 0,
        value: 0
      };

    r.netUnits =
      r.sold - r.returns;

    r.returnPct =
      r.sold
        ? (
            r.returns /
            r.sold
          ) * 100
        : 0;

    r.drr =
      r.netUnits / 30;

    r.asp =
      r.sold
        ? r.value / r.sold
        : 0;

    r.prevSold =
      prev.sold;

    r.prevRevenue =
      prev.value;

    r.prevDRR =
      prev.sold / 30;

    r.prevASP =
      prev.sold
        ? prev.value /
          prev.sold
        : 0;

    r.projection =
      r.netUnits;

    return r;
  });

  /* GMV RANK */

  rows.sort(
    (a, b) =>
      b.value - a.value
  );

  rows.forEach((r, i) => {

    r.rank = i + 1;
  });

  const brandGroups = {};

  rows.forEach(r => {

    if (
      !brandGroups[r.brand]
    ){

      brandGroups[
        r.brand
      ] = [];
    }

    brandGroups[
      r.brand
    ].push(r);
  });

  Object.values(
    brandGroups
  ).forEach(group => {

    group.sort(
      (a, b) =>
        b.value - a.value
    );

    group.forEach((r, i) => {

      r.brandRank =
        i + 1;
    });
  });

  /* UNIT RANK */

  const rowsByUnits =
    [...rows].sort(
      (a, b) =>
        b.sold - a.sold
    );

  rowsByUnits.forEach((r, i) => {

    r.rank_units =
      i + 1;
  });

  const brandGroupsUnits =
    {};

  rows.forEach(r => {

    if (
      !brandGroupsUnits[
        r.brand
      ]
    ){

      brandGroupsUnits[
        r.brand
      ] = [];
    }

    brandGroupsUnits[
      r.brand
    ].push(r);
  });

  Object.values(
    brandGroupsUnits
  ).forEach(group => {

    group.sort(
      (a, b) =>
        b.sold - a.sold
    );

    group.forEach((r, i) => {

      r.brandRank_units =
        i + 1;
    });
  });

  const cards = {

    sold:
      rows.reduce(
        (s, r) =>
          s + r.sold,
        0
      ),

    value:
      rows.reduce(
        (s, r) =>
          s + r.value,
        0
      ),

    returns:
      rows.reduce(
        (s, r) =>
          s + r.returns,
        0
      ),

    netUnits:
      rows.reduce(
        (s, r) =>
          s + r.netUnits,
        0
      ),

    styles:
      rows.length
  };

  cards.returnPct =
    cards.sold

      ? (
          cards.returns /
          cards.sold
        ) * 100

      : 0;

  return {
    cards,
    rows
  };
}