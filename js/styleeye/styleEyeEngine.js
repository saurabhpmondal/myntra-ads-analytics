function txt(v){return String(v==null?"":v).trim();}
function num(v){return Number(String(v==null?"":v).replace(/,/g,"").trim())||0;}

function monthNum(v){
  const s=txt(v).toUpperCase();
  const m={
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUNE:6,
    JUL:7,JULY:7,AUG:8,SEP:9,SEPT:9,OCT:10,NOV:11,DEC:12
  };
  return m[s] || num(v);
}

function validSale(r){
  const s=txt(r.order_status).toUpperCase();
  return s!=="RTO" && s!=="F";
}

function validReturn(r){
  return txt(r.type).toUpperCase()==="RETURN";
}

function sameMonth(r,y,m){
  return num(r.year)===y && monthNum(r.month)===m;
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

function riskLabel(returnPct,rating){
  if(returnPct>=25 || rating<3.5) return "High";
  if(returnPct>=15 || rating<3.8) return "Medium";
  return "Low";
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
  if(x.quality.rating && x.quality.rating<3.8) out.push("Rating risk - improve listing quality");
  if(x.quality.returnRisk==="High") out.push("High return risk - inspect fit/quality");
  if(x.ranking.brand>0 && x.ranking.brand<=5) out.push("Top brand performer");

  if(!out.length) out.push("Stable style - maintain current plan");

  return out;
}

export function buildStyleEyeData(data,query){
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
    var sid=txt(r.style_id).toLowerCase();
    var sku=txt(r.erp_sku).toLowerCase();
    return sid===q || sku===q;
  });

  if(!master.length){
    return {type:"not_found"};
  }

  if(master.length>1){
    var exact=false;

    master.forEach(function(r){
      if(txt(r.style_id)===query) exact=true;
    });

    if(!exact){
      var options=master.map(function(r){
        var sid=txt(r.style_id);

        var units=sumQty(
          salesRows.filter(function(x){
            return txt(x.style_id)===sid &&
              validSale(x) &&
              sameMonth(x,latest.year,latest.month);
          })
        );

        return {
          style_id:sid,
          brand:txt(r.brand),
          status:txt(r.status),
          units:units
        };
      });

      options.sort(function(a,b){return b.units-a.units;});

      return {
        type:"multi",
        erp_sku:txt(master[0].erp_sku),
        options:options
      };
    }
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
  var prevUnits=sumQty(prevSales);

  var styleReturns=returnRows.filter(function(r){
    return txt(r.style_id)===styleId &&
      validReturn(r) &&
      sameMonth(r,latest.year,latest.month);
  });

  var returns=styleReturns.length;
  var net=Math.max(0,gross-returns);
  var asp=net?gmv/net:0;
  var drr=net/30;
  var returnPct=gross?(returns/gross)*100:0;
  var growthPct=prevUnits?((net-prevUnits)/prevUnits)*100:0;

  var sjitStock=stockRows
    .filter(function(r){return txt(r.style_id)===styleId;})
    .reduce(function(s,r){
      return s+num(r.sellable_inventory_count||r.units);
    },0);

  var sorStock=sorRows
    .filter(function(r){return txt(r.style_id)===styleId;})
    .reduce(function(s,r){
      return s+num(r.units);
    },0);

  var sjit=planner(sjitStock,drr,45,60);

  var sor=isSORBrand(brand)
    ? planner(sorStock,drr,45,60)
    : {stock:0,sc:0,projection:0,recall:0,na:true};

  var allUnits={};

  salesRows.forEach(function(r){
    if(!validSale(r) || !sameMonth(r,latest.year,latest.month)) return;

    var sid=txt(r.style_id);
    allUnits[sid]=(allUnits[sid]||0)+num(r.qty||1);
  });

  var overallArr=Object.keys(allUnits).map(function(k){
    return [k,allUnits[k]];
  });

  overallArr.sort(function(a,b){return b[1]-a[1];});

  var overall=0;
  for(var i=0;i<overallArr.length;i++){
    if(overallArr[i][0]===styleId){
      overall=i+1;
      break;
    }
  }

  var brandUnits={};

  masterRows.forEach(function(m){
    if(txt(m.brand).toUpperCase()!==brand.toUpperCase()) return;
    var sid=txt(m.style_id);
    brandUnits[sid]=allUnits[sid]||0;
  });

  var brandArr=Object.keys(brandUnits).map(function(k){
    return [k,brandUnits[k]];
  });

  brandArr.sort(function(a,b){return b[1]-a[1];});

  var brandRank=0;
  for(i=0;i<brandArr.length;i++){
    if(brandArr[i][0]===styleId){
      brandRank=i+1;
      break;
    }
  }

  var adsRows=cprRows.filter(function(r){
    return txt(r.product_name||r.style_id||r.sku_id)===styleId;
  });

  var spend=adsRows.reduce(function(s,r){return s+num(r.ad_spend);},0);
  var revenue=adsRows.reduce(function(s,r){return s+num(r["total_revenue_(rs.)"]);},0);
  var impressions=adsRows.reduce(function(s,r){return s+num(r.views);},0);
  var clicks=adsRows.reduce(function(s,r){return s+num(r.clicks);},0);

  var traffic=null;
  for(i=0;i<trafficRows.length;i++){
    if(txt(trafficRows[i].style_id)===styleId){
      traffic=trafficRows[i];
      break;
    }
  }

  var rating=traffic ? num(traffic.rating) : 0;

  var reasonMap={};

  styleReturns.forEach(function(r){
    var reason=txt(r.return_reason || r.reason || r.reason_name || "Unknown");
    reasonMap[reason]=(reasonMap[reason]||0)+1;
  });

  var reasonArr=Object.keys(reasonMap).map(function(k){
    return [k,reasonMap[k]];
  });

  reasonArr.sort(function(a,b){return b[1]-a[1];});

  var topReason=reasonArr.length ? reasonArr[0][0] : "-";

  var result={
    type:"single",
    style_id:styleId,
    erp_sku:txt(row.erp_sku),
    status:txt(row.status),
    brand:brand,
    launch_date:txt(row.launch_date),
    live_date:txt(row.live_date),

    ranking:{
      overall:overall,
      brand:brandRank
    },

    sales:{
      gmv:gmv,
      gross:gross,
      returns:returns,
      net:net,
      asp:asp,
      drr:drr,
      returnPct:returnPct,
      growthPct:growthPct,
      prevUnits:prevUnits
    },

    inventory:{
      sjit:sjit,
      sor:sor
    },

    ads:{
      spend:spend,
      revenue:revenue,
      impressions:impressions,
      clicks:clicks,
      roi:spend?revenue/spend:0,
      ctr:impressions?(clicks/impressions)*100:0,
      cvr:clicks?(net/clicks)*100:0
    },

    quality:{
      rating:rating,
      topReason:topReason,
      returnRisk:riskLabel(returnPct,rating)
    }
  };

  result.actions=buildActions(result);

  return result;
}