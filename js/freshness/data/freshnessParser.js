import {

  txt,
  num,
  monthNum,
  createDate

} from "../utils/freshnessHelpers.js";

export function parseFreshnessData(
  data
) {

  const {
    salesRows,
    masterRows
  } = data;

  const masterMap = {};

  masterRows.forEach(r => {

    const style = txt(
      r.style_id
    );

    if (!style) return;

    masterMap[style] = {

      style_id: style,

      brand: txt(r.brand),

      launchDate: createDate(
        num(r.year),
        monthNum(r.month),
        num(r.date)
      )
    };
  });

  const parsedSales = salesRows.map(r => {

    const style = txt(
      r.style_id
    );

    return {

      ...r,

      style_id: style,

      qty: num(
        r.qty || 1
      ),

      po_type: txt(
        r.po_type
      ).toUpperCase(),

      saleDate: createDate(
        num(r.year),
        monthNum(r.month),
        num(r.date)
      ),

      master:
        masterMap[style] || null
    };
  });

  return {
    parsedSales,
    masterMap
  };
}