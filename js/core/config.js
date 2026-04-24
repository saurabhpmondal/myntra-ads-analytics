// FILE: js/core/config.js

export const CONFIG = {

  APP_NAME: "Myntra Ads Analytics",

  VERSION: "1.0.0",

  DEFAULT_TAB: "dashboard",

  DEBUG: true,

  AUTO_LOAD_CURRENT_MONTH: true,

  CONSOLE_MAX_LOGS: 500,

  DATE_FORMAT: "DD-MM-YYYY",

  CURRENCY: "INR",

  PAGE_SIZE: {
    style: 50,
    table: 100
  },

  REPORT_URLS: {
    CDR: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1175680150&single=true&output=csv",

    CPR: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1490735065&single=true&output=csv",

    PPR: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1885382311&single=true&output=csv"
  },

  KPI_FIELDS: [
    "spend",
    "impressions",
    "clicks",
    "units",
    "revenue",
    "roi"
  ],

  STORAGE_KEYS: {
    FILTERS: "myntra_ads_filters",
    CACHE: "myntra_ads_cache"
  }

};

export const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "campaign", label: "Campaign" },
  { id: "adgroup", label: "Adgroup" },
  { id: "style", label: "Style" },
  { id: "analysis", label: "Analysis" },
  { id: "export", label: "Export Center" }
];