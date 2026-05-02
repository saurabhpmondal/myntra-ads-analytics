import { applyFilters } from "../core/filters.js";

function num(v) {
  return Number(String(v ?? "").replace(/,/g, "").trim()) || 0;
}

function txt(v) {
  return String(v ?? "").trim();
}

function validSale(row) {
  const s = txt(row.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

export function buildBusinessData(data) {
  const { salesRows, stockRows } = data;

  const filter = window.ACTIVE_FILTER || {};

  const brandMap = {};
  const poMap = {};
  const warehouseSales = {};
  const warehouseStock = {};

  let totalUnits = 0;

  /* ---------------- USE CORE FILTER (IMPORTANT FIX) ---------------- */

  const filteredSales = applyFilters(salesRows, filter).filter(validSale);

  /* ---------------- SALES AGG ---------------- */

  filteredSales.forEach(r => {
    const qty = num(r.qty || 1);
    const revenue = num(r.final_amount);

    const brand = txt(r.brand);
    const po = txt(r.po_type);
    const wh = txt(r.warehouse_id);

    totalUnits += qty;

    /* Brand */
    if (!brandMap[brand]) {
      brandMap[brand] = { brand, units: 0, revenue: 0 };
    }
    brandMap[brand].units += qty;
    brandMap[brand].revenue += revenue;

    /* PO */
    if (!poMap[po]) {
      poMap[po] = { po, units: 0, revenue: 0 };
    }
    poMap[po].units += qty;
    poMap[po].revenue += revenue;

    /* Warehouse Sales */
    if (!warehouseSales[wh]) {
      warehouseSales[wh] = 0;
    }
    warehouseSales[wh] += qty;
  });

  /* ---------------- STOCK ---------------- */

  stockRows.forEach(r => {
    const wh = txt(r.warehouse_id);
    const stock = num(r.sellable_inventory_count || r.units);

    if (!warehouseStock[wh]) {
      warehouseStock[wh] = 0;
    }

    warehouseStock[wh] += stock;
  });

  /* ---------------- BRAND OUTPUT ---------------- */

  const brands = Object.values(brandMap)
    .map(r => ({
      ...r,
      share: totalUnits ? (r.units / totalUnits) * 100 : 0
    }))
    .sort((a, b) => b.units - a.units);

  /* ---------------- PO OUTPUT ---------------- */

  const pos = Object.values(poMap)
    .map(r => ({
      ...r,
      share: totalUnits ? (r.units / totalUnits) * 100 : 0
    }))
    .sort((a, b) => b.units - a.units);

  /* ---------------- WAREHOUSE OUTPUT ---------------- */

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