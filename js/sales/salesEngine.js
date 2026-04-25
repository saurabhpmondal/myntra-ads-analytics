function num(v) {
  return Number(v || 0);
}

function validSale(row) {
  const s = String(row.order_status || "").trim().toUpperCase();
  return s !== "RTO" && s !== "F";
}

function validReturn(row) {
  return String(row.type || "").trim().toUpperCase() === "RETURN";
}

function matchFilter(row, filter) {
  if (filter.year && Number(row.year) !== Number(filter.year)) return false;
  if (filter.month && Number(row.month) !== Number(filter.month)) return false;

  if (filter.start && Number(row.date) < Number(filter.start.slice(-2))) {
    return false;
  }

  if (filter.end && Number(row.date) > Number(filter.end.slice(-2))) {
    return false;
  }

  return true;
}

export function buildSalesData(salesRows, returnRows, filter) {
  const map = {};

  salesRows.forEach(r => {
    if (!validSale(r)) return;
    if (!matchFilter(r, filter)) return;

    const id = String(r.style_id || "").trim();
    if (!id) return;

    if (!map[id]) {
      map[id] = {
        id,
        sold: 0,
        value: 0,
        returns: 0,
        netUnits: 0,
        returnPct: 0
      };
    }

    map[id].sold += 1;
    map[id].value += num(r.final_amount);
  });

  returnRows.forEach(r => {
    if (!validReturn(r)) return;
    if (!matchFilter(r, filter)) return;

    const id = String(r.style_id || "").trim();
    if (!id || !map[id]) return;

    map[id].returns += 1;
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

  return {
    cards,
    rows
  };
}