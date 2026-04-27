function txt(v) {
  return String(v == null ? "" : v).trim();
}

function num(v) {
  return Number(
    String(v == null ? "" : v)
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

function validSale(r) {
  var s = txt(r.order_status).toUpperCase();
  return s !== "RTO" && s !== "F";
}

function cleanId(v) {
  return txt(v).replace(/\.0$/, "");
}

export function buildSalesReport(rows) {
  var map = {};

  rows.forEach(function (r) {
    if (!validSale(r)) return;

    var key = cleanId(r.style_id);
    if (!key) return;

    if (!map[key]) {
      map[key] = {
        id: key,
        units: 0,
        gmv: 0,
        orders: 0
      };
    }

    var qty = num(r.qty || 1);

    map[key].units += qty;
    map[key].gmv += num(r.final_amount);
    map[key].orders += 1;
  });

  var out = Object.keys(map).map(function (k) {
    var x = map[k];

    return {
      id: x.id,
      units: x.units,
      gmv: x.gmv,
      orders: x.orders,
      asp: x.units ? x.gmv / x.units : 0
    };
  });

  out.sort(function (a, b) {
    return b.units - a.units;
  });

  return out;
}