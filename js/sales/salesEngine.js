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

function isValidSale(row) {
  const s = txt(row.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

function isValidReturn(row) {
  return txt(row.type).toUpperCase() === "RETURN";
}

function passMonthFilter(row, filter) {
  if (filter.year && num(row.year) !== num(filter.year)) return false;
  if (filter.month && num(row.month) !== num(filter.month)) return false;

  const d = num(row.date || row.day);

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
  const styleMap = {};
  const saleOrders = new Map();

  /* STEP 1: selected month sales cohort */
  salesRows.forEach(row => {
    if (!isValidSale(row)) return;
    if (!passMonthFilter(row, filter)) return;

    const style = txt(row.style_id);
    const orderId = txt(row.order_line_id);

    if (!style || !orderId) return;

    saleOrders.set(orderId, style);

    if (!styleMap[style]) {
      styleMap[style] = {
        id: style,
        sold: 0,
        value: 0,
        returns: 0,
        netUnits: 0,
        returnPct: 0
      };
    }

    styleMap[style].sold += 1;
    styleMap[style].value += num(row.final_amount);
  });

  /* STEP 2: match returns by order_line_id */
  returnRows.forEach(row => {
    if (!isValidReturn(row)) return;

    const orderId = txt(row.order_line_id);
    if (!orderId) return;

    const style = saleOrders.get(orderId);
    if (!style) return;

    if (!styleMap[style]) return;

    styleMap[style].returns += 1;
  });

  /* STEP 3: finalize */
  const rows = Object.values(styleMap).map(r => {
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

  return {
    cards,
    rows
  };
}