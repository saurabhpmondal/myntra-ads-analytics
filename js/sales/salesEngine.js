function num(v) {
  return Number(String(v ?? "").replace(/,/g, "").trim()) || 0;
}

function txt(v) {
  return String(v ?? "").trim();
}

function normMonth(v) {
  const s = txt(v).toUpperCase();

  const map = {
    JAN: 1, JANUARY: 1,
    FEB: 2, FEBRUARY: 2,
    MAR: 3, MARCH: 3,
    APR: 4, APRIL: 4,
    MAY: 5,
    JUN: 6, JUNE: 6,
    JUL: 7, JULY: 7,
    AUG: 8, AUGUST: 8,
    SEP: 9, SEPTEMBER: 9,
    OCT: 10, OCTOBER: 10,
    NOV: 11, NOVEMBER: 11,
    DEC: 12, DECEMBER: 12
  };

  return map[s] || num(v);
}

function passFilter(row, filter) {
  const y = num(row.year);
  const m = normMonth(row.month);
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

function validSale(row) {
  const s = txt(row.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

function validReturn(row) {
  return txt(row.type).toUpperCase() === "RETURN";
}

export function buildSalesData(salesRows, returnRows, filter) {
  const map = {};
  const orders = new Map();

  salesRows.forEach(row => {
    if (!validSale(row)) return;
    if (!passFilter(row, filter)) return;

    const style = txt(row.style_id);
    const order = txt(row.order_line_id);

    if (!style || !order) return;

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
  });

  const rows = Object.values(map).map(r => {
    r.netUnits = r.sold - r.returns;
    r.returnPct = r.sold ? (r.returns / r.sold) * 100 : 0;
    return r;
  });

  rows.sort((a, b) => b.value - a.value);

  const cards = {
    sold: rows.reduce((a, r) => a + r.sold, 0),
    value: rows.reduce((a, r) => a + r.value, 0),
    returns: rows.reduce((a, r) => a + r.returns, 0),
    netUnits: rows.reduce((a, r) => a + r.netUnits, 0),
    styles: rows.length
  };

  cards.returnPct = cards.sold
    ? (cards.returns / cards.sold) * 100
    : 0;

  return { cards, rows };
}