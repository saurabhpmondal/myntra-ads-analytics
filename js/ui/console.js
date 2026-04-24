// FILE: js/ui/console.js

let panel;
let body;
let toggleBtn;
let closeBtn;

/* ---------------------------------- */
/* INIT */
/* ---------------------------------- */

export function initConsole() {

  panel = document.getElementById("devConsole");
  body = document.querySelector(".console-body");
  toggleBtn = document.getElementById("consoleToggleBtn");
  closeBtn = document.getElementById("closeConsole");

  if (!panel || !body) return;

  if (toggleBtn) toggleBtn.onclick = togglePanel;
  if (closeBtn) closeBtn.onclick = closePanel;

  captureErrors();

  log("INFO", "Console ready");
}

/* ---------------------------------- */
/* PANEL */
/* ---------------------------------- */

function togglePanel() {
  panel.classList.toggle("hidden");
}

function closePanel() {
  panel.classList.add("hidden");
}

/* ---------------------------------- */
/* LOGGER */
/* ---------------------------------- */

export function log(type = "INFO", message = "") {

  if (!body) return;

  const row = document.createElement("div");

  const tm = new Date().toLocaleTimeString();

  const color =
    type === "ERROR" ? "#f87171" :
    type === "SUCCESS" ? "#4ade80" :
    type === "WARN" ? "#fbbf24" :
    "#cbd5e1";

  row.style.color = color;
  row.style.marginBottom = "8px";
  row.style.lineHeight = "1.45";

  row.textContent = `[${tm}] ${type}: ${message}`;

  body.prepend(row);
}

/* ---------------------------------- */
/* GLOBAL ERRORS */
/* ---------------------------------- */

function captureErrors() {

  window.onerror = function(msg, file, line) {
    log("ERROR