function num(v) {
  return Number(
    String(v ?? "")
      .replace(/,/g, "")
      .trim()
  ) || 0;
}

function splitCSVLine(line) {
  const out = [];
  let cur = "";
  let quote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      quote = !quote;
      continue;
    }

    if (ch === "," && !quote) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);

  const headers = splitCSVLine(lines.shift()).map(x => x.trim());

  return lines.map(line => {
    const cols = splitCSVLine(line);

    const row = {};

    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? "").trim();
    });

    row.year = num(row.year);
    row.month = num(row.month);
    row.day = num(row.day);

    row.impressions = num(row.impressions);
    row.clicks = num(row.clicks);

    row.ad_spend = num(row.ad_spend);
    row.budget_spend = num(row.budget_spend);

    row.units_sold_total = num(row.units_sold_total);
    row.total_revenue = num(row.total_revenue);

    return row;
  });
}