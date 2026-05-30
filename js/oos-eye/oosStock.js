function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

export function buildSJITMap(
  sjitStock
){

  const map = {};

  sjitStock.forEach(r=>{

    const style =
      txt(r.style_id);

    map[style] =
      (
        map[style] || 0
      )
      +
      num(
        r.inventory_count
      );
  });

  return map;
}

export function buildSORMap(
  sorStock
){

  const map = {};

  sorStock.forEach(r=>{

    const style =
      txt(r.style_id);

    map[style] =
      (
        map[style] || 0
      )
      +
      num(
        r.units
      );
  });

  return map;
}

export function buildSellerMap(
  sellerStock,
  erpToStyle
){

  const headers =
    Object.keys(
      sellerStock[0] || {}
    );

  const dateColumns =
    headers.filter(
      h =>
        h.includes("-")
    );

  const latestDate =
    dateColumns[
      dateColumns.length - 1
    ];

  const map = {};

  sellerStock.forEach(r=>{

    const erp =
      txt(r.erp);

    const style =
      erpToStyle[erp];

    if(!style){

      return;
    }

    let oosDays = 0;

    for(
      let i =
        dateColumns.length - 1;
      i >= 0;
      i--
    ){

      const stock =
        num(
          r[
            dateColumns[i]
          ]
        );

      if(stock <= 0){

        oosDays++;

      }else{

        break;
      }
    }

    map[style] = {

      currentStock:
        num(
          r[latestDate]
        ),

      oosDays
    };
  });

  return map;
}