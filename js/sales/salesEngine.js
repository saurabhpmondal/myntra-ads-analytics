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

function saleValid(row) {
  const s = txt(row.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

function returnValid(row) {
  return txt(row.type).toUpperCase() === "RETURN";
}

function getYear(row) {
  return num(row.year);
}

function getMonth(row) {
  return num(row.month);
}

function getDay(row) {
  if (row.date !== undefined && row.date !== "") {
    return num(row.date);
  }

  if (row.day !== undefined && row.day !== "") {
    return num(row.day);
  }

  return 0;
}

function passFilter(row, filter) {
  const y = getYear(row);
  const m = getMonth(row);
  const d = getDay(row);

  if (filter.year && y !== num(filter.year)) {
    return false;
  }

  if (filter.month && m !== num(filter.month)) {
    return false;
  }

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
  const map = {};

  salesRows.forEach(row => {
    if (!saleValid(row)) return;
    if (!passFilter(row, filter)) return;

    const id = txt(row.style_id);
    if (!id) return;

    if (!map[id]) {
      map[id] = {
        style_id: id,
        sold_units: 0,
        sales_value: 0,
        return_units: 0,
        return_pct: 0,
        net_units: 0
      };
    }

    map[id].sold_units += 1;
    map[id].sales_value += num(row.final_amount);
  });

  returnRows.forEach(row => {
    if (!returnValid(row)) return;
    if (!passFilter(row, filter)) return;

    const id = txt(row.style_id);
    if (!id) return;

    if (!map[id]) {
      map[id] = {
        style_id: id,
        sold_units: 0,
        sales_value: 0,
        return_units: 0,
        return_pct: 0,
        net_units: 0
      };
    }

    map[id].return_units += 1;
  });

  const rows = Object.values(map).map(r => {
    r.net_units = r.sold_units - r.return_units;

    r.return_pct = r.sold_units
      ? (r.return_units / r.sold_units) * 100
      : 0;

    return r;
  });

  rows.sort((a, b) => b.sales_value - a.sales_value);

  const cards = {
    units_sold: rows.reduce((s, r) => s + r.sold_units, 0),
    sales_value: rows.reduce((s, r) => s + r.sales_value, 0),
    returned_units: rows.reduce((s, r) => s + r.return_units, 0),
    net_units: rows.reduce((s, r) => s + r.net_units, 0),
    active_styles: rows.length
  };

  cards.return_pct = cards.units_sold
    ? (cards.returned_units / cards.units_sold) * 100
    : 0;

  return { cards, rows };
}