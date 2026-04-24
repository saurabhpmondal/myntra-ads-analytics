// FILE: js/ui/console.js

let panel;
let body;
let toggleBtn;
let closeBtn;

/* -------------------------- */
/* INIT */
/* -------------------------- */

export function initConsole() {

  panel = document.getElementById("devConsole");
  body = document.querySelector(".console-body");
  toggleBtn = document.getElementById("consoleToggleBtn");
  closeBtn = document.getElementById("closeConsole");

  if (!panel || !body) return;

  if (toggleBtn) {
    toggleBtn.onclick = toggleConsole;
  }

  if (closeBtn) {
    closeBtn.onclick = closeConsole;
  }

  window.onerror = function(msg, file, line) {
    log("ERROR", `${msg} @ line ${line}`);
  };

  window.onunhandledrejection = function(e) {
    log("ERROR", `Promise: ${e.reason}`);
  };

  log("INFO", "Console initialized");
}

/* -------------------------- */
/* TOGGLE */
/* -------------------------- */

function toggleConsole() {
  panel.classList.toggle("hidden");
}

function closeConsole() {
  panel.classList.add("hidden");
}

/* -------------------------- */
/* LOGGER */
/* -------------------------- */

export function log(type = "INFO", message = "") {

  if (!body) return;

  const time = new Date().toLocaleTimeString();

  const row = document.createElement("div");

  row.style.marginBottom = "8px";

  row.innerHTML = `[${time}] <b>${type}</b> ${message}`;

  body.prepend(row);
}