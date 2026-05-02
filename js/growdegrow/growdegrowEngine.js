/* ============================= */
/* Grow / Degrow Engine (FINAL) */
/* ============================= */

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
    JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12
  };

  return map[s] || num(v);
}

/* ============================= */
/* MAIN */
/* ============================= */

export function buildGrowDegrow({ salesRows = [], filter = {} }) {

  const map = {};
  let maxDay = 0;

  salesRows.forEach(r => {

    /* FILTER */
    if (filter.year && num(r.year) !== num(filter.year)) return;
    if (filter.month && monthNum(r.month) !== num(filter.month)) return;

    const style = txt(r.style_id);
    if (!style) return;

    const d = num(r.date);   // 🔥 YOUR CONFIRMED COLUMN
    if (!d) return;

    const qty = num(r.qty || 1);

    if (!map[style]) {
      map[style] = {
        style_id: style,
        daily: {}
      };
    }

    map[style].daily[d] = (map[style].daily[d] || 0) + qty;

    if (d > maxDay) maxDay = d;
  });

  const days = [];
  for (let i = 1; i <= maxDay; i++) days.push(i);

  const rows = Object.values(map);

  return { rows, days };
}