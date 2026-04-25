function num(v) {
  return Number(String(v ?? "").replace(/,/g, "").trim()) || 0;
}

function txt(v) {
  return String(v ?? "").trim();
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

function validSale(row) {
  const s = txt(row.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

function validReturn(row) {
  return txt(row.type).toUpperCase() === "RETURN";
}

function passFilter(row, filter) {
  const y = num(row.year);
  const m = monthNum(row.month);
  const d = num(row.date || row.day);

  if (filter.year && y !== num(filter.year)) return false;
  if (filter.month && m !== num(filter.month)) return false;

  if (filter.start) {
    const sd = Number(String(filter.start).slice(-2));
    if (d < sd) return false;
  }

  if (filter.end) {
    const ed = Number(String(filter.end).slice(-2));
    if (d > ed) return false;
  }

  return true;
}

export function buildSalesData(salesRows, returnRows, filter) {
  const debug = {
    totalSales: salesRows.length,
    afterValidSale: 0,
    afterFilter: 0,
    afterStyle: 0,
    afterOrder: 0,
    matchedReturns: 0
  };

  const map = {};
  const orders = new Map();

  salesRows.forEach(row => {
    if (!validSale(row)) return;
    debug.afterValidSale++;

    if (!passFilter(row, filter)) return;
    debug.afterFilter++;

    const style = txt(row.style_id);
    if (!style) return;
    debug.afterStyle++;

    const order = txt(row.order_line_id);
    if (!order) return;
    debug.afterOrder++;

    orders.set(order, style);

    if (!map[style]) {
      map[style] = {
        id: style,
        sold: 0,
        value: 0,
        returns: 0,
        netUnits: 0,
        returnPct: 0
      };
    }

    map[style].sold += 1;
    map[style].value += num(row.final_amount);
  });

  returnRows.forEach(row => {
    if (!validReturn(row)) return;

    const order = txt(row.order_line_id);
    const style = orders.get(order);

    if (!style || !map[style]) return;

    map[style].returns += 1;
    debug.matchedReturns++;
  });

  const rows = Object.values(map).map(r => {
    r.netUnits = r.sold - r.returns;
    r.returnPct = r.sold ? (r.returns / r.sold) * 100 : 0;
    return r;
  });

  rows.sort((a, b) => b.value - a.value);

  const cards = {
    sold: rows.reduce((s, r) => s + r.sold, 0),
    value: rows.reduce((s, r) => s + r.value, 0),
    returns: rows.reduce((s, r) => s + r.returns, 0),
    netUnits: rows.reduce((s, r) => s + r.netUnits, 0),
    styles: rows.length
  };

  cards.returnPct = cards.sold
    ? (cards.returns / cards.sold) * 100
    : 0;

  cards.debug = debug;

  return { cards, rows };
}