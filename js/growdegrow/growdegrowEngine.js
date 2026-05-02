/* ============================= */
/* Grow / Degrow Engine (FINAL) */
/* ============================= */

/*
  STRICT RULES (as per your system):
  - DO NOT use created_on
  - DO NOT assume any field
  - date = day (column name is "date")
  - month = text (APR, MAY, etc.)
  - year = number
  - USE existing loaded data (no re-fetch)
*/

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

/* ============================= */
/* MAIN BUILDER */
/* ============================= */

export function buildGrowDegrowData({ salesRows, masterRows, filter }) {

  const map = {};
  let maxDay = 0;

  /* MASTER MAP */
  const masterMap = {};
  masterRows.forEach(r => {
    const style = txt(r.style_id);
    if (!style) return;

    masterMap[style] = {
      erp_sku: txt(r.erp_sku),
      status: txt(r.status)
    };
  });

  /* SALES LOOP */
  salesRows.forEach(r => {

    /* FILTER */
    if (filter.year && num(r.year) !== num(filter.year)) return;
    if (filter.month && monthNum(r.month) !== num(filter.month)) return;

    /* CORE KEYS */
    const style = txt(r.style_id);
    if (!style) return;

    const d = num(r.date);   // 🔥 FIXED: DATE = DAY
    if (!d) return;

    const qty = num(r.qty || 1);

    if (!map[style]) {
      map[style] = {
        style_id: style,
        erp_sku: masterMap[style]?.erp_sku || "",
        status: masterMap[style]?.status || "",
        daily: {}
      };
    }

    map[style].daily[d] = (map[style].daily[d] || 0) + qty;

    if (d > maxDay) maxDay = d;
  });

  /* BUILD DAY ARRAY */
  const days = [];
  for (let i = 1; i <= maxDay; i++) {
    days.push(i);
  }

  /* FINAL ROWS */
  const rows = Object.values(map);

  return { rows, days };
}