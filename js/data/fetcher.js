// FILE: js/data/fetcher.js

import { parseCSV } from "./parser.js";
import { pushLog } from "../core/state.js";

/* ---------------------------------- */
/* Fetch CSV File */
/* ---------------------------------- */

export async function fetchCSV(url = "") {

  try {

    pushLog("INFO", `Fetching: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();

    const rows = parseCSV(text);

    pushLog("SUCCESS", `Loaded ${rows.length} rows`);

    return rows;

  } catch (error) {

    pushLog("ERROR", error.message);

    console.error(error);

    return [];
  }
}

/* ---------------------------------- */
/* Parallel Multi Fetch */
/* ---------------------------------- */

export async function fetchReports(reportMap = {}) {

  const keys = Object.keys(reportMap);

  const results = {};

  await Promise.all(

    keys.map(async (key) => {
      const rows = await fetchCSV(reportMap[key]);
      results[key] = rows;
    })

  );

  return results;
}