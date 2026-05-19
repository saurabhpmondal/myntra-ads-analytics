function txt(v) {

  return String(v ?? "")
    .trim();
}

function num(v) {

  return Number(
    String(v ?? "")
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

function monthNum(v) {

  const s =
    txt(v).toUpperCase();

  const map = {

    JAN:1,
    FEB:2,
    MAR:3,
    APR:4,
    MAY:5,

    JUN:6,
    JUNE:6,

    JUL:7,
    JULY:7,

    AUG:8,

    SEP:9,
    SEPT:9,

    OCT:10,
    NOV:11,
    DEC:12
  };

  return map[s] || num(v);
}

export function parseFreshnessData(data) {

  const {
    salesRows,
    masterRows
  } = data;

  const parsedSales =
    salesRows.map(r => ({

      ...r,

      qty:
        num(
          r.qty || 1
        ),

      date:
        num(r.date),

      month:
        monthNum(r.month),

      year:
        num(r.year),

      brand:
        txt(r.brand),

      po_type:
        txt(r.po_type),

      style_id:
        txt(
          r.style_id ||
          r.styleid ||
          r.style
        ),

      order_status:
        txt(r.order_status)
    }));

  const parsedMaster =
    masterRows.map(r => ({

      ...r,

      style_id:
        txt(r.style_id),

      brand:
        txt(r.brand),

      date:
        num(r.date),

      month:
        monthNum(r.month),

      year:
        num(r.year)
    }));

  return {

    salesRows:
      parsedSales,

    masterRows:
      parsedMaster
  };
}