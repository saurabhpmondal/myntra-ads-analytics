function num(v) {
  return Number(
    String(v ?? "")
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

/* -------------------------------- */
/* Robust CSV Parser */
/* Handles:
   - quoted commas
   - escaped quotes ""
   - empty cells
   - BOM
   - CRLF / LF
*/
/* -------------------------------- */
function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let cell = "";

  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        cell += ch;
        i++;
        continue;
      }
    }

    /* outside quotes */
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }

    if (ch === "\r") {
      i++;
      continue;
    }

    if (ch === "\n") {
      row.push(cell);
      rows.push(row);

      row = [];
      cell = "";
      i++;
      continue;
    }

    cell += ch;
    i++;
  }

  /* last cell */
  row.push(cell);
  rows.push(row);

  return rows.filter(r => r.some(v => String(v).trim() !== ""));
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

    /* Common Date Fields */
    row.year = num(row.year);
    row.month = num(row.month);
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