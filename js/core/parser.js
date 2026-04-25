function num(v) {
  return Number(
    String(v ?? "")
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

/* -------------------------------- */
/* Robust CSV row parser */
/* -------------------------------- */
function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (ch === "\r") continue;

    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter(r =>
    r.some(x => String(x).trim() !== "")
  );
}

function smartMonth(v) {
  const raw = String(v ?? "").trim();

  if (!raw) return 0;

  const n = Number(raw);

  if (!isNaN(n) && raw !== "") {
    return n;
  }

  return raw.toUpperCase();
}

export function parseCSV(text) {
  const clean = String(text || "")
    .replace(/^\uFEFF/, "")
    .trim();

  if (!clean) return [];

  const rows = parseCSVRows(clean);

  if (!rows.length) return [];

  const headers = rows[0].map(h => String(h).trim());

  return rows.slice(1).map(cols => {
    const row = {};

    headers.forEach((h, i) => {
      row[h] = String(cols[i] ?? "").trim();
    });

    /* Date fields */
    row.year = num(row.year);
    row.month = smartMonth(row.month);
    row.day = num(row.day);
    row.date = num(row.date);

    /* Ads Metrics */
    row.impressions = num(row.impressions);
    row.clicks = num(row.clicks);
    row.ad_spend = num(row.ad_spend);
    row.budget_spend = num(row.budget_spend);
    row.units_sold_total = num(row.units_sold_total);
    row.total_revenue = num(row.total_revenue);

    /* Sales Metrics */
    row.qty = num(row.qty);
    row.final_amount = num(row.final_amount);
    row.seller_price = num(row.seller_price);

    return row;
  });
}