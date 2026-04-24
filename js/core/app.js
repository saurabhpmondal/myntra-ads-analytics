// FILE: js/core/app.js

import { renderDashboard } from "../dashboard/dashboardPage.js";

document.addEventListener("DOMContentLoaded", boot);

function boot(){

console.log("BOOT START");

try{

fillFilters();

bindButtons();

renderDashboard();

console.log("DASHBOARD RENDERED");

}catch(err){

console.error(err);

document.querySelector(".page-wrap").innerHTML =
'<div style="padding:30px;color:red;font-weight:700;">ERROR: '+err.message+'</div>';

}
}

function fillFilters(){

const y=document.getElementById("yearFilter");
const m=document.getElementById("monthFilter");

y.innerHTML='<option>2026</option><option>2025</option>';

m.innerHTML=`
<option value="1">January</option>
<option value="2">February</option>
<option value="3">March</option>
<option value="4">April</option>
`;

}

function bindButtons(){

const r=document.getElementById("refreshBtn");
const a=document.getElementById("applyBtn");

if(r) r.onclick=()=>location.reload();
if(a) a.onclick=()=>renderDashboard();

}