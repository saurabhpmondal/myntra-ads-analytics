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

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") {
      return row[k];
    }
  }
  return "";
}

function styleId(row) {
  return txt(pick(row, ["style_id", "style id", "styleid", "Style ID"]));
}

function orderId(row) {
  return txt(
    pick(row, [
      "order_line_id",
      "order line id",
      "orderlineid",
      "Order Line ID"
    ])
  );
}

function orderStatus(row) {
  return txt(
    pick(row, [
      "order_status",
      "order status",
      "Order Status"
    ])
  ).toUpperCase();
}

function finalAmount(row) {
  return num(
    pick(row, [
      "final_amount",
      "final amount",
      "Final Amount"
    ])
  );
}

function returnType(row) {
  return txt(
    pick(row, [
      "type",
      "Type"
    ])
  ).toUpperCase();
}

function yr(row) {
  return num(pick(row, ["year", "Year"]));
}

function mon(row) {
  return num(pick(row, ["month", "Month"]));
}

function dy(row) {
  return num(pick(row, ["date", "day", "Date", "Day"]));
}

function isValidSale(row) {
  const s = orderStatus(row);
  return s !== "RTO" && s !== "F";
}

function isValidReturn(row) {
  return returnType(row) === "RETURN";
}

function passFilter(row, filter) {
  if (filter.year && yr(row) !== num(filter.year)) return false;
  if (filter.month && mon(row) !== num(filter.month)) return false;

  const d = dy(row);

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
  const cohortOrders = new Map();

  /* selected month sales */
  salesRows.forEach(row => {
    if (!isValidSale(row)) return;
    if (!passFilter(row, filter)) return;

    const sid = styleId(row);
    const oid = orderId(row);

    if (!sid || !oid) return;

    cohortOrders.set(oid, sid);

    if (!styleMap[sid]) {
      styleMap[sid] = {
        id: sid,
        sold: 0,
        value: 0,
        returns: 0,
        netUnits: 0,
        returnPct: 0
      };
    }

    styleMap[sid].sold += 1;
    styleMap[sid].value += finalAmount(row);
  });

  /* returns matched by order line id */
  returnRows.forEach(row => {
    if (!isValidReturn(row)) return;

    const oid = orderId(row);
    if (!oid) return;

    const sid = cohortOrders.get(oid);
    if (!sid || !styleMap[sid]) return;

    styleMap[sid].returns += 1;
  });

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

  return { cards, rows };
}