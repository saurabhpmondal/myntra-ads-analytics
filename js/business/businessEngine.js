function num(v) {
  return Number(String(v ?? "").replace(/,/g, "").trim()) || 0;
}

function txt(v) {
  return String(v ?? "").trim();
}

function monthNum(v) {
  const s = txt(v).toUpperCase();

  const map = {
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,
    JUN:6,JUNE:6,JUL:7,JULY:7,
    AUG:8,SEP:9,SEPT:9,OCT:10,NOV:11,DEC:12
  };

  return map[s] || num(v);
}

function validSale(row) {
  const s = txt(row.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
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

export function buildBusinessData(data) {
  const { salesRows, stockRows } = data;

  const filter = window.ACTIVE_FILTER || {};

  const brandMap = {};
  const poMap = {};
  const warehouseSales = {};
  const warehouseStock = {};

  let totalUnits = 0;

  const filteredSales = salesRows.filter(r =>
    validSale(r) && passFilter(r, filter)
  );

  filteredSales.forEach(r => {
    const qty = num(r.qty || 1);
    const revenue = num(r.final_amount);

    const brand = txt(r.brand);
    const po = txt(r.po_type);
    const wh = txt(r.warehouse_id);

    totalUnits += qty;

    if (!brandMap[brand]) {
      brandMap[brand] = { brand, units: 0, revenue: 0 };
    }
    brandMap[brand].units += qty;
    brandMap[brand].revenue += revenue;

    if (!poMap[po]) {
      poMap[po] = { po, units: 0, revenue: 0 };
    }
    poMap[po].units += qty;
    poMap[po].revenue += revenue;

    if (!warehouseSales[wh]) {
      warehouseSales[wh] = 0;
    }
    warehouseSales[wh] += qty;
  });

  stockRows.forEach(r => {
    const wh = txt(r.warehouse_id);
    const stock = num(r.sellable_inventory_count || r.units);

    if (!warehouseStock[wh]) {
      warehouseStock[wh] = 0;
    }

    warehouseStock[wh] += stock;
  });

  const brands = Object.values(brandMap)
    .map(r => ({
      ...r,
      share: totalUnits ? (r.units / totalUnits) * 100 : 0
    }))
    .sort((a, b) => b.units - a.units);

  const pos = Object.values(poMap)
    .map(r => ({
      ...r,
      share: totalUnits ? (r.units / totalUnits) * 100 : 0
    }))
    .sort((a, b) => b.units - a.units);

  const warehouses = Object.keys(warehouseStock)
    .map(wh => {
      const stock = warehouseStock[wh];
      const sales = warehouseSales[wh] || 0;

      return {
        warehouse: wh,
        stock,
        sales,
        sellThrough: stock ? (sales / stock) * 100 : 0
      };
    })
    .sort((a, b) => b.sales - a.sales);

  return {
    brands,
    pos,
    warehouses
  };
}

/* ---------------- NEW: BRAND DAILY MATRIX ---------------- */

export function buildBrandDailyMatrix(salesRows) {
  const filter = window.ACTIVE_FILTER || {};

  const filtered = salesRows.filter(r =>
    validSale(r) && passFilter(r, filter)
  );

  const brandSet = new Set();
  const dateMap = {};

  filtered.forEach(r => {
    const brand = txt(r.brand);
    const d = num(r.date);
    const qty = num(r.qty || 1);

    if (!brand || !d) return;

    brandSet.add(brand);

    if (!dateMap[d]) dateMap[d] = {};
    if (!dateMap[d][brand]) dateMap[d][brand] = 0;

    dateMap[d][brand] += qty;
  });

  const brands = Array.from(brandSet).sort();
  const dates = Object.keys(dateMap).map(Number).sort((a,b)=>a-b);

  const rows = dates.map(d => ({
    date: d,
    brands: brands.map(b => dateMap[d][b] || 0)
  }));

  return { brands, rows };
}