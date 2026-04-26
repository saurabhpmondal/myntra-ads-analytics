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

function inLast30(row, anchor) {
  const dt = rowDate(row);
  if (!dt || !anchor) return false;

  const diff = (anchor - dt) / 86400000;

  return diff >= 0 && diff < 30;
}

function validSale(row) {
  const s = txt(row.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

function validReturn(row) {
  return txt(row.type).toUpperCase() === "RETURN";
}

function isContinue(status) {
  return txt(status).toUpperCase() === "CONTINUE";
}

export function buildSJITDebug(data) {
  const {
    salesRows,
    returnRows,
    trafficRows,
    stockRows,
    masterRows
  } = data;

  const anchor = latestDate(salesRows);

  const sales30 = salesRows.filter(r =>
    validSale(r) && inLast30(r, anchor)
  );

  const return30 = returnRows.filter(r =>
    validReturn(r) && inLast30(r, anchor)
  );

  const stockMap = {};
  stockRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    stockMap[style] =
      (stockMap[style] || 0) +
      num(r.sellable_inventory_count);
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
  sales30.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    gross[style] = (gross[style] || 0) + num(r.qty || 1);
  });

  const ret = {};
  return30.forEach(r => {
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

    const drr = net / 30;
    const stock = stockMap[style] || 0;
    const sc = drr > 0 ? stock / drr : 999999;

    const rating = trafficMap[style] || 0;
    const status = masterMap[style]?.status || "";

    const need45 = drr * 45;

    const recallFlag =
      sc > 60 ||
      rating < 3.8 ||
      !isContinue(status);

    let shipmentQty = 0;
    let recallQty = 0;

    if (recallFlag) {
      recallQty = Math.floor(Math.max(0, stock - need45));
    } else {
      shipmentQty = Math.ceil(Math.max(0, need45 - stock));
    }

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
      shipmentQty,
      recallQty
    };
  });

  rows.sort((a, b) => b.shipmentQty - a.shipmentQty);

  return {
    anchorDate: anchor ? keyDate(anchor) : "",
    startDate: anchor
      ? keyDate(new Date(anchor.getTime() - 29 * 86400000))
      : "",
    endDate: anchor ? keyDate(anchor) : "",
    salesRows30: sales30.length,
    returnRows30: return30.length,
    rows
  };
}