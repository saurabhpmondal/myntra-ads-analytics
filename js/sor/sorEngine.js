function txt(v) {
  return String(v ?? "").trim();
}

function num(v) {
  return Number(String(v ?? "").replace(/,/g, "").trim()) || 0;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function monthNum(v) {
  const s = txt(v).toUpperCase();

  const map = {
    JAN: 1,
    FEB: 2,
    MAR: 3,
    APR: 4,
    MAY: 5,
    JUNE: 6,
    JUN: 6,
    JULY: 7,
    JUL: 7,
    AUG: 8,
    SEP: 9,
    SEPT: 9,
    OCT: 10,
    NOV: 11,
    DEC: 12
  };

  return map[s] || num(v);
}

function rowDate(row) {
  const y = num(row.year);
  const m = monthNum(row.month);
  const d = num(row.date || row.day);

  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d);
}

function keyDate(dt) {
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function latestDate(rows) {
  let best = null;

  rows.forEach(r => {
    const dt = rowDate(r);
    if (!dt) return;
    if (!best || dt > best) best = dt;
  });

  return best;
}

function inWindow(row, anchor, days) {
  const dt = rowDate(row);
  if (!dt || !anchor) return false;

  const diff = (anchor - dt) / 86400000;

  return diff >= 0 && diff < days;
}

function validSale(row) {
  const s = txt(row.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

function validReturn(row) {
  return txt(row.type).toUpperCase() === "RETURN";
}

function isContinue(v) {
  return txt(v).toUpperCase() === "CONTINUE";
}

export function buildSORDebug(data, cfg = {}) {
  const salesDays = Number(cfg.salesDays || 30);
  const coverDays = Number(cfg.coverDays || 45);
  const recallDays = Number(cfg.recallDays || 60);

  const {
    salesRows,
    returnRows,
    trafficRows,
    stockRows,
    masterRows
  } = data;

  const anchor = latestDate(salesRows);

  const salesWin = salesRows.filter(r =>
    validSale(r) && inWindow(r, anchor, salesDays)
  );

  const returnWin = returnRows.filter(r =>
    validReturn(r) && inWindow(r, anchor, salesDays)
  );

  const stockMap = {};
  stockRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    stockMap[style] = (stockMap[style] || 0) + num(r.units);
  });

  const trafficMap = {};
  trafficRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    trafficMap[style] = num(r.rating);
  });

  const masterMap = {};
  masterRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    masterMap[style] = {
      erp_sku: txt(r.erp_sku),
      status: txt(r.status),
      brand: txt(r.brand),
      launch_date: txt(r.launch_date),
      live_date: txt(r.live_date)
    };
  });

  const gross = {};
  salesWin.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    gross[style] = (gross[style] || 0) + num(r.qty || 1);
  });

  const ret = {};
  returnWin.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    ret[style] = (ret[style] || 0) + 1;
  });

  const styles = new Set([
    ...Object.keys(gross),
    ...Object.keys(ret),
    ...Object.keys(stockMap),
    ...Object.keys(masterMap)
  ]);

  const rows = [...styles].map(style => {
    const g = gross[style] || 0;
    const rr = ret[style] || 0;
    const net = Math.max(0, g - rr);

    const drr = salesDays ? net / salesDays : 0;

    const stock = stockMap[style] || 0;
    const sc = drr > 0 ? stock / drr : 999999;

    const rating = trafficMap[style] || 0;
    const status = masterMap[style]?.status || "";

    const projectionQty = Math.ceil(
      Math.max((coverDays * drr) - stock, 0)
    );

    const recallCalc = Math.ceil(
      Math.max(stock - (coverDays * drr), 0)
    );

    const blocked =
      sc > recallDays ||
      rating < 3.8 ||
      !isContinue(status);

    return {
      style_id: style,
      erp_sku: masterMap[style]?.erp_sku || "",
      status,
      brand: masterMap[style]?.brand || "",
      launch_date: masterMap[style]?.launch_date || "",
      live_date: masterMap[style]?.live_date || "",
      rating,

      gross: g,
      returns: rr,
      net,
      returnPct: g ? (rr / g) * 100 : 0,

      drr,
      stock,
      sc,

      projectionQty,
      shipmentQty: blocked ? 0 : projectionQty,
      recallQty: blocked ? recallCalc : 0
    };
  });

  rows.sort((a, b) => b.net - a.net);

  return {
    startDate: anchor
      ? keyDate(new Date(anchor.getTime() - (salesDays - 1) * 86400000))
      : "",
    endDate: anchor ? keyDate(anchor) : "",
    rows
  };
}