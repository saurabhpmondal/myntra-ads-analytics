// FILE: js/core/state.js

import { CONFIG } from "./config.js";

export const state = {

  appReady: false,
  loading: false,

  activeTab: CONFIG.DEFAULT_TAB,

  filters: {
    year: null,
    month: null,
    startDate: null,
    endDate: null
  },

  data: {
    cdr: [],
    cpr: [],
    ppr: []
  },

  meta: {
    cdrLoaded: false,
    cprLoaded: false,
    pprLoaded: false,
    lastRefreshAt: null
  },

  cache: {},

  logs: []
};


/* ----------------------------- */
/* State Helpers */
/* ----------------------------- */

export function setActiveTab(tabId){
  state.activeTab = tabId;
}

export function setLoading(flag){
  state.loading = !!flag;
}

export function setFilters(payload = {}){
  state.filters = {
    ...state.filters,
    ...payload
  };
}

export function setReportData(key, rows = []){
  if(state.data[key] !== undefined){
    state.data[key] = rows;
  }
}

export function setMeta(payload = {}){
  state.meta = {
    ...state.meta,
    ...payload
  };
}

export function addCache(key, value){
  state.cache[key] = value;
}

export function getCache(key){
  return state.cache[key];
}


/* ----------------------------- */
/* Logger Store */
/* ----------------------------- */

export function pushLog(type = "INFO", message = ""){

  const time = new Date().toLocaleTimeString();

  state.logs.push({
    type,
    message,
    time
  });

  if(state.logs.length > CONFIG.CONSOLE_MAX_LOGS){
    state.logs.shift();
  }
}

export function clearLogs(){
  state.logs = [];
}