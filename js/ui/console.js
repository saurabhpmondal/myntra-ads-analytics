// FILE: js/ui/console.js

import { state, pushLog, clearLogs } from "../core/state.js";

/* ---------------------------------- */
/* Elements */
/* ---------------------------------- */

let consoleWrap = null;
let consoleBody = null;
let toggleBtn = null;
let closeBtn = null;

/* ---------------------------------- */
/* Init Console */
/* ---------------------------------- */

export function initConsole() {

  consoleWrap = document.getElementById("devConsole");
  consoleBody = document.querySelector(".console-body");
  toggleBtn = document.getElementById("consoleToggleBtn");
  closeBtn = document.getElementById("closeConsole");

  if (!consoleWrap || !consoleBody) return;

  bindEvents();

  captureWindowErrors();

  renderConsole();

  pushLog("INFO", "Developer console ready");
  renderConsole();
}

/* ---------------------------------- */
/* Events */
/* ---------------------------------- */

function bindEvents() {

  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleConsole);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeConsole);
  }
}

/* ---------------------------------- */
/* Open / Close */
/* ---------------------------------- */

export function toggleConsole() {

  if (!consoleWrap) return;

  consoleWrap.classList.toggle("hidden");
}

export function closeConsole() {

  if (!consoleWrap) return;

  consoleWrap.classList.add("hidden");
}

/* ---------------------------------- */
/* Render Logs */
/* ---------------------------------- */

export function renderConsole() {

  if (!consoleBody) return;

  const logs = [...state.logs].reverse();

  consoleBody.innerHTML = logs.map(log => {

    const color =
      log.type === "ERROR" ? "#f87171" :
      log.type === "SUCCESS" ? "#4ade80" :
      log.type === "WARN" ? "#fbbf24" :
      "#cbd5e1";

    return `
      <div style="color:${color}">
        [${log.time}] [${log.type}] ${log.message}
      </div>
    `;
  }).join("");

  consoleBody.scrollTop = 0;
}

/* ---------------------------------- */
/* Public Log Helper */
/* ---------------------------------- */

export function log(type, message) {

  pushLog(type, message);

  renderConsole();
}

/* ---------------------------------- */
/* Clear */
/* ---------------------------------- */

export function resetConsole() {

  clearLogs();

  renderConsole();
}

/* ---------------------------------- */
/* Capture JS Errors */
/* ---------------------------------- */

function captureWindowErrors() {

  window.addEventListener("error", (event) => {

    pushLog(
      "ERROR",
      `${event.message} (${event.filename}:${event.lineno})`
    );

    renderConsole();
  });

  window.addEventListener("unhandledrejection", (event) => {

    pushLog(
      "ERROR",
      `Promise Rejection: ${event.reason}`
    );

    renderConsole();
  });
}