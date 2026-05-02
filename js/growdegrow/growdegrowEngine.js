/* ============================= */
/* GrowDegrow Engine (FINAL) */
/* ============================= */

function num(v) {
  return Number(String(v ?? "").replace(/,/g, "").trim()) || 0;
}

function txt(v) {
  return String(v ?? "").trim();
}

/* MAIN */
export function buildGrowDegrow(rows) {

  if (!rows || !rows.length) return { rows: [], days: [] };

  const map = {};
  let maxDay = 0;

  rows.forEach(r => {

    const style = txt(r.style_id);
    if (!style) return;

    const d = num(r.date);
    if (!d) return;

    const qty = num(r.qty || 1);

    if (!map[style]) {
      map[style] = {
        style_id: style,
        daily: {},
        total: 0
      };
    }

    map[style].daily[d] = (map[style].daily[d] || 0) + qty;
    map[style].total += qty;

    if (d > maxDay) maxDay = d;
  });

  const days = [];
  for (let i = 1; i <= maxDay; i++) days.push(i);

  const finalRows = Object.values(map);

  /* SORT */
  finalRows.sort((a, b) => b.total - a.total);

  return {
    rows: finalRows,
    days
  };
}