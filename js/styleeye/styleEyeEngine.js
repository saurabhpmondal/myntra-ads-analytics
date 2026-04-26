function txt(v){return String(v??"").trim();}
function num(v){return Number(String(v??"").replace(/,/g,"").trim())||0;}

function monthNum(v){
  const s=txt(v).toUpperCase();
  const m={JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUNE:6,JUL:7,JULY:7,AUG:8,SEP:9,SEPT:9,OCT:10,NOV:11,DEC:12};
  return m[s]||num(v);
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
  let best={score:0,year:0,month:0};
  rows.forEach(r=>{
    const y=num(r.year), mo=monthNum(r.month), sc=y*100+mo;
    if(sc>best.score) best={score:sc,year:y,month:mo};
  });
  return best;
}

function prevMonth(y,m){
  if(m===1) return {year:y-1,month:12};
  return {year:y,month:m-1};
}

function sumQty(rows){return rows.reduce((s,r)=>s+num(r.qty||1),0);}
function sumAmt(rows){return rows.reduce((s,r)=>s+num(r.final_amount),0);}

function planner(stock,drr,cover=45,recall=60){
  const sc=drr>0?stock/drr:999999;
  const projection=Math.ceil(Math.max((cover*drr)-stock,0));
  const recallQty=Math.ceil(Math.max(stock-(cover*drr),0));
  return {
    stock,
    sc,
    projection,
    recall: sc>recall ? recallQty : 0
  };
}

function isSORBrand(brand){
  const b=txt(brand).toUpperCase();
  return b==="KALINI" || b==="MITERA";
}

function riskLabel(returnPct,rating){
  if(returnPct>=25 || rating<3.5) return "High";
  if(returnPct>=15 || rating<3.8) return "Medium";
  return "Low";
}

function buildActions(x){
  const out=[];

  if(x.inventory.sjit.projection>0)
    out.push(`Ship ${x.inventory.sjit.projection} to SJIT`);

  if(x.inventory.sjit.recall>0)
    out.push(`Recall ${x.inventory.sjit.recall} from SJIT`);

  if(!x.inventory.sor.na && x.inventory.sor.projection>0)
    out.push(`Ship ${x.inventory.sor.projection} to SOR`);

  if(!x.inventory.sor.na && x.inventory.sor.recall>0)
    out.push(`Recall ${x.inventory.sor.recall} from SOR`);

  if(x.ads.roi>=4 && x.sales.net>0)
    out.push("Scale ads budget");

  if(x.ads.spend>0 && x.ads.roi<1.5)
    out.push("Review ads efficiency");

  if(x.quality.rating && x.quality.rating<3.8)
    out.push("Rating risk - improve listing quality");

  if(x.quality.returnRisk==="High")
    out.push("High return risk - inspect fit/quality");

  if(x.ranking.brand>0 && x.ranking.brand<=5)
    out.push("Top brand performer");

  if(!out.length)
    out.push("Stable style - maintain current plan");

  return out;
}

export function buildStyleEyeData(data,query){
  const q=txt(query).toLowerCase();

  const {
    salesRows,
    returnRows,
    stockRows,
    sorRows=[],
    masterRows,
    cprRows=[],
    trafficRows=[]
  }=data;

  const latest=latestMonth(salesRows);
  const prev=prevMonth(latest.year,latest.month);

  const master=masterRows.filter(r=>{
    const sid=txt(r.style_id).toLowerCase();
    const sku=txt(r.erp_sku).toLowerCase();
    return sid===q || sku===q;
  });

  if(!master.length) return {type:"not_found"};

  if(master.length>1 && !master.some(r=>txt(r.style_id)===q)){
    const options=master.map(r=>{
      const sid=txt(r.style_id);

      const units=sumQty(
        salesRows.filter(x=>
          txt(x.style_id)===sid &&
          validSale(x) &&
          sameMonth(x,latest.year,latest.month)
        )
      );

      return {
        style_id:sid,
        brand:txt(r.brand),
        status:txt(r.status),
        units
      };
    }).sort((a,b)=>b.units-a.units);

    return {type:"multi",erp_sku:txt(master[0].erp_sku),options};
  }

  const row=master[0];
  const styleId=txt(row.style_id);
  const brand=txt(row.brand);

  const curSales=salesRows.filter(r=>
    txt(r.style_id)===styleId &&
    validSale(r) &&
    sameMonth(r,latest.year,latest.month)
  );

  const prevSales=salesRows.filter(r=>
    txt(r.style_id)===styleId &&
    validSale(r) &&
    sameMonth(r,prev.year,prev.month)
  );

  const gross=sumQty(curSales);
  const gmv=sumAmt(curSales);
  const prevUnits=sumQty(prevSales);

  const styleReturns=returnRows.filter(r=>
    txt(r.style_id)===styleId &&
    validReturn(r) &&
    sameMonth(r,latest.year,latest.month)
  );

  const returns=styleReturns.length;

  const net=Math.max(0,gross-returns);
  const asp=net?gmv/net:0;
  const drr=net/30;
  const returnPct=gross?(returns/gross)*100:0;
  const growthPct=prevUnits?((net-prevUnits)/prevUnits)*100:0;

  const sjitStock=stockRows
    .filter(r=>txt(r.style_id)===styleId)
    .reduce((s,r)=>s+num(r.sellable_inventory_count||r.units),0);

  const sorStock=sorRows
    .filter(r=>txt(r.style_id)===styleId)
    .reduce((s,r)=>s+num(r.units),0);

  const sjit=planner(sjitStock,drr,45,60);

  const sor=isSORBrand(brand)
    ? planner(sorStock,drr,45,60)
    : {stock:0,sc:0,projection:0,recall:0,na:true};

  const allUnits={};

  salesRows.forEach(r=>{
    if(!validSale(r) || !sameMonth(r,latest.year,latest.month)) return;
    const sid=txt(r.style_id);
    allUnits[sid]=(allUnits[sid]||0)+num(r.qty||1);
  });

  const overall=
    Object.entries(allUnits).sort((a,b)=>b[1]-a[1]).findIndex(x=>x[0]===styleId)+1;

  const brandUnits={};

  masterRows.forEach(m=>{
    if(txt(m.brand).toUpperCase()!==brand.toUpperCase()) return;
    const sid=txt(m.style_id);
    brandUnits[sid]=allUnits[sid]||0;
  });

  const brandRank=
    Object.entries(brandUnits).sort((a,b)=>b[1]-a[1]).findIndex(x=>x[0]===styleId)+1;

  const adsRows=cprRows.filter(r=>
    txt(r.product_name||r.style_id||r.sku_id)===styleId
  );

  const spend=adsRows.reduce((s,r)=>s+num(r.ad_spend),0);
  const revenue=adsRows.reduce((s,r)=>s+num(r.total_revenue_(rs.)),0);
  const impressions=adsRows.reduce((s,r)=>s+num(r.views),0);
  const clicks=adsRows.reduce((s,r)=>s+num(r.clicks),0);

  const traffic=trafficRows.find(r=>txt(r.style_id)===styleId);
  const rating=num(traffic?.rating);

  const reasonMap={};
  styleReturns.forEach(r=>{
    const reason=txt(r.return_reason||r.reason||r.reason_name||"Unknown");
    reasonMap[reason]=(reasonMap[reason]||0)+1;
  });

  const topReason=
    Object.entries(reasonMap).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-";

  const result={
    type:"single",
    style_id:styleId,
    erp_sku:txt(row.erp_sku),
    status:txt(row.status),
    brand,
    launch_date:txt(row.launch_date),
    live_date:txt(row.live_date),

    ranking:{overall,brand:brandRank},

    sales:{
      gmv,gross,returns,net,asp,drr,returnPct,growthPct,prevUnits
    },

    inventory:{sjit,sor},

    ads:{
      spend,
      revenue,
      impressions,
      clicks,
      roi:spend?revenue/spend:0,
      ctr:impressions?(clicks/impressions)*100:0,
      cvr:clicks?(net/clicks)*100:0
    },

    quality:{
      rating,
      topReason,
      returnRisk:riskLabel(returnPct,rating)
    }
  };

  result.actions=buildActions(result);

  return result;
}