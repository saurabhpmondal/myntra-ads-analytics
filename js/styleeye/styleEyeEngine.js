function txt(v) {
  return String(v ?? "").trim();
}

function num(v) {
  return Number(String(v ?? "").replace(/,/g, "").trim()) || 0;
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

function validSale(r) {
  const s = txt(r.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

function validReturn(r) {
  return txt(r.type).toUpperCase() === "RETURN";
}

function sameMonth(r, y, m) {
  return num(r.year) === y && monthNum(r.month) === m;
}

function latestMonth(rows) {
  let best = { score: 0, year: 0, month: 0 };

  rows.forEach(r => {
    const y = num(r.year);
    const m = monthNum(r.month);
    const score = y * 100 + m;

    if (score > best.score) {
      best = { score, year: y, month: m };
    }
  });

  return best;
}

export function buildStyleEyeData(data, query) {
  const q = txt(query).toLowerCase();

  const {
    salesRows,
    returnRows,
    stockRows,
    masterRows
  } = data;

  const latest = latestMonth(salesRows);

  const master = masterRows.filter(r => {
    const style = txt(r.style_id).toLowerCase();
    const sku = txt(r.erp_sku).toLowerCase();

    return style === q || sku === q;
  });

  if (!master.length) {
    return { type: "not_found" };
  }

  if (master.length > 1 && !master.some(r => txt(r.style_id) === q)) {
    const options = master.map(r => {
      const style = txt(r.style_id);

      const units = salesRows
        .filter(x =>
          txt(x.style_id) === style &&
          validSale(x) &&
          sameMonth(x, latest.year, latest.month)
        )
        .reduce((s, x) => s + num(x.qty || 1), 0);

      return {
        style_id: style,
        brand: txt(r.brand),
        status: txt(r.status),
        units
      };
    });

    options.sort((a, b) => b.units - a.units);

    return {
      type: "multi",
      erp_sku: txt(master[0].erp_sku),
      options
    };
  }

  const row = master[0];
  const styleId = txt(row.style_id);

  const monthSales = salesRows.filter(r =>
    txt(r.style_id) === styleId &&
    validSale(r) &&
    sameMonth(r, latest.year, latest.month)
  );

  const gross = monthSales.reduce((s, r) => s + num(r.qty || 1), 0);
  const gmv = monthSales.reduce((s, r) => s + num(r.final_amount), 0);

  const returns = returnRows.filter(r =>
    txt(r.style_id) === styleId &&
    validReturn(r) &&
    sameMonth(r, latest.year, latest.month)
  ).length;

  const net = Math.max(0, gross - returns);
  const asp = net ? gmv / net : 0;
  const drr = net / 30;
  const returnPct = gross ? (returns / gross) * 100 : 0;

  const stock = stockRows
    .filter(r => txt(r.style_id) === styleId)
    .reduce((s, r) => s + num(r.sellable_inventory_count || r.units), 0);

  const allUnits = {};
  salesRows.forEach(r => {
    if (!validSale(r) || !sameMonth(r, latest.year, latest.month)) return;

    const style = txt(r.style_id);
    allUnits[style] = (allUnits[style] || 0) + num(r.qty || 1);
  });

  const ranking = Object.entries(allUnits)
    .sort((a, b) => b[1] - a[1])
    .findIndex(x => x[0] === styleId) + 1;

  const brand = txt(row.brand);

  const brandUnits = {};
  masterRows.forEach(m => {
    if (txt(m.brand).toUpperCase() !== brand.toUpperCase()) return;

    const sid = txt(m.style_id);
    brandUnits[sid] = allUnits[sid] || 0;
  });

  const brandRank = Object.entries(brandUnits)
    .sort((a, b) => b[1] - a[1])
    .findIndex(x => x[0] === styleId) + 1;

  return {
    type: "single",
    style_id: styleId,
    erp_sku: txt(row.erp_sku),
    status: txt(row.status),
    brand,
    launch_date: txt(row.launch_date),
    live_date: txt(row.live_date),

    sales: {
      gmv,
      gross,
      returns,
      net,
      asp,
      drr,
      returnPct
    },

    inventory: {
      stock
    },

    ranking: {
      overall: ranking,
      brand: brandRank
    }
  };
}