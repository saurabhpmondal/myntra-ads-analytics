import { buildStyleReport } from "../style/styleEngine.js";
import { buildSalesData } from "../sales/salesEngine.js"; // ✅ ADDED

function txt(v){return String(v==null?"":v).trim();}
function num(v){return Number(String(v==null?"":v).replace(/,/g,"").trim())||0;}

function monthNum(v){
  var s=txt(v).toUpperCase();
  var m={JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUNE:6,JUL:7,JULY:7,AUG:8,SEP:9,SEPT:9,OCT:10,NOV:11,DEC:12};
  return m[s] || num(v);
}

function sameMonth(r,y,m){
  return num(r.year)===y && monthNum(r.month)===m;
}

function validSale(r){
  var s=txt(r.order_status).toUpperCase();
  return s!=="RTO" && s!=="F";
}

function validReturn(r){
  return txt(r.type).toUpperCase()==="RETURN";
}

function latestMonth(rows){
  var best={score:0,year:0,month:0};

  rows.forEach(function(r){
    var y=num(r.year);
    var mo=monthNum(r.month);
    var sc=y*100+mo;

    if(sc>best.score){
      best={score:sc,year:y,month:mo};
    }
  });

  return best;
}

function prevMonth(y,m){
  if(m===1) return {year:y-1,month:12};
  return {year:y,month:m-1};
}

function sumQty(rows){
  return rows.reduce(function(s,r){
    return s+num(r.qty||1);
  },0);
}

function sumAmt(rows){
  return rows.reduce(function(s,r){
    return s+num(r.final_amount);
  },0);
}

function planner(stock,drr,cover,recall){
  if(cover==null) cover=45;
  if(recall==null) recall=60;

  var sc=drr>0 ? stock/drr : 999999;
  var projection=Math.ceil(Math.max((cover*drr)-stock,0));
  var recallQty=Math.ceil(Math.max(stock-(cover*drr),0));

  return {
    stock:stock,
    sc:sc,
    projection:projection,
    recall: sc>recall ? recallQty : 0
  };
}

function isSORBrand(brand){
  var b=txt(brand).toUpperCase();
  return b==="KALINI" || b==="MITERA";
}

function buildActions(x){
  var out=[];

  if(x.inventory.sjit.projection>0) out.push("Ship "+x.inventory.sjit.projection+" to SJIT");
  if(x.inventory.sjit.recall>0) out.push("Recall "+x.inventory.sjit.recall+" from SJIT");

  if(!x.inventory.sor.na && x.inventory.sor.projection>0){
    out.push("Ship "+x.inventory.sor.projection+" to SOR");
  }

  if(!x.inventory.sor.na && x.inventory.sor.recall>0){
    out.push("Recall "+x.inventory.sor.recall+" from SOR");
  }

  if(x.ads.roi>=4 && x.sales.net>0) out.push("Scale ads budget");
  if(x.ads.spend>0 && x.ads.roi<1.5) out.push("Review ads efficiency");
  if(x.quality.risk==="Risk") out.push("High return risk - inspect quality");
  if(x.ranking.brand>0 && x.ranking.brand<=5) out.push("Top brand performer");

  if(!out.length) out.push("Stable style - maintain current plan");

  return out;
}

/* ---------------- ADD: RANK MAP ---------------- */
function getRankingMap(data){
  const filter = window.ACTIVE_FILTER || {};

  const sales = buildSalesData(
    data.salesRows || [],
    data.returnRows || [],
    data.masterRows || [],
    filter
  );

  const map = {};

  sales.rows.forEach(r=>{
    map[r.id] = {
      overall: r.rank,
      brand: r.brandRank
    };
  });

  return map;
}
/* ---------------- END ADD ---------------- */

export function buildStyleEyeData(data,query){

  /* -------- ADD -------- */
  const rankMap = getRankingMap(data);
  /* -------- END ADD -------- */

  var q=txt(query).toLowerCase();

  var salesRows=data.salesRows || [];
  var returnRows=data.returnRows || [];
  var stockRows=data.stockRows || [];
  var sorRows=data.sorRows || [];
  var masterRows=data.masterRows || [];
  var cprRows=data.cprRows || [];
  var trafficRows=data.trafficRows || [];

  var latest=latestMonth(salesRows);
  var prev=prevMonth(latest.year,latest.month);

  var master=masterRows.filter(function(r){
    return txt(r.style_id).toLowerCase()===q ||
           txt(r.erp_sku).toLowerCase()===q;
  });

  if(!master.length) return {type:"not_found"};

  if(master.length>1){
    var options=master.map(function(r){
      return {
        style_id:txt(r.style_id),
        brand:txt(r.brand),
        status:txt(r.status),
        units:0
      };
    });

    return {
      type:"multi",
      erp_sku:txt(master[0].erp_sku),
      options:options
    };
  }

  var row=master[0];
  var styleId=txt(row.style_id);
  var brand=txt(row.brand);

  var curSales=salesRows.filter(function(r){
    return txt(r.style_id)===styleId &&
      validSale(r) &&
      sameMonth(r,latest.year,latest.month);
  });

  var prevSales=salesRows.filter(function(r){
    return txt(r.style_id)===styleId &&
      validSale(r) &&
      sameMonth(r,prev.year,prev.month);
  });

  var gross=sumQty(curSales);
  var gmv=sumAmt(curSales);
  var returns=returnRows.filter(function(r){
    return txt(r.style_id)===styleId &&
      validReturn(r) &&
      sameMonth(r,latest.year,latest.month);
  }).length;

  var prevUnits=sumQty(prevSales);
  var net=Math.max(0,gross-returns);
  var asp=gross?gmv/gross:0;
  var drr=net/30;
  var returnPct=gross?(returns/gross)*100:0;
  var growthPct=prevUnits?((net-prevUnits)/prevUnits)*100:0;

  var sjitStock=stockRows
    .filter(function(r){return txt(r.style_id)===styleId;})
    .reduce(function(s,r){return s+num(r.sellable_inventory_count||r.units);},0);

  var sorStock=sorRows
    .filter(function(r){return txt(r.style_id)===styleId;})
    .reduce(function(s,r){return s+num(r.units);},0);

  var sjit=planner(sjitStock,drr,45,60);

  var sor=isSORBrand(brand)
    ? planner(sorStock,drr,45,60)
    : {stock:0,sc:0,projection:0,recall:0,na:true};

  var cprMonthRows=cprRows.filter(function(r){
    return sameMonth(r,latest.year,latest.month);
  });

  var styleReport=buildStyleReport(cprMonthRows);

  var ads=null;
  styleReport.forEach(function(r){
    if(txt(r.id)===styleId) ads=r;
  });

  var spend=ads?num(ads.spend):0;
  var adUnits=ads?num(ads.units):0;
  var revenue=ads?num(ads.revenue):0;
  var impressions=ads?num(ads.impressions):0;
  var clicks=ads?num(ads.clicks):0;

  var traffic=null;
  trafficRows.forEach(function(r){
    if(txt(r.style_id)===styleId) traffic=r;
  });

  var rating=traffic?num(traffic.rating):0;

  var reasonMap={};

  returnRows.forEach(function(r){
    if(txt(r.style_id)!==styleId) return;
    if(!validReturn(r)) return;
    if(!sameMonth(r,latest.year,latest.month)) return;

    var reason=txt(r.return_reason||r.reason||r.reason_name||"Unknown");
    reasonMap[reason]=(reasonMap[reason]||0)+1;
  });

  var topReason="-";
  var topCount=0;

  Object.keys(reasonMap).forEach(function(k){
    if(reasonMap[k]>topCount){
      topCount=reasonMap[k];
      topReason=k;
    }
  });

  var result={
    type:"single",
    style_id:styleId,
    brand:brand,
    erp_sku:txt(row.erp_sku),
    status:txt(row.status),
    launch_date:txt(row.launch_date),
    live_date:txt(row.live_date),
    rating:rating,

    ranking:{overall:0,brand:0},

    sales:{
      gmv:gmv,
      gross:gross,
      net:net,
      asp:asp,
      drr:drr,
      returnPct:returnPct,
      growthPct:growthPct
    },

    inventory:{
      sjit:sjit,
      sor:sor
    },

    ads:{
      spend:spend,
      units:adUnits,
      revenue:revenue,
      impressions:impressions,
      clicks:clicks,
      roi:spend?revenue/spend:0,
      ctr:impressions?(clicks/impressions)*100:0,
      cvr:clicks?(adUnits/clicks)*100:0
    },

    quality:{
      topReason:topReason,
      risk:returnPct>35 ? "Risk" : "No Risk"
    }
  };

  /* -------- ADD: INJECT RANK -------- */
  const rank = rankMap[styleId] || {};
  result.ranking = {
    overall: rank.overall || 0,
    brand: rank.brand || 0
  };
  /* -------- END ADD -------- */

  result.actions=buildActions(result);

  return result;
}