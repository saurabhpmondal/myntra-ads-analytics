function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

function parseDate(
  day,
  month,
  year
){

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
}

function daysBetween(
  a,
  b
){

  return Math.floor(
    (
      b - a
    ) /
    86400000
  );
}

export function buildSalesMap(
  sales,
  selectedDays
){

  const salesMap = {};

  const today =
    new Date();

  sales.forEach(r=>{

    const style =
      txt(r.style_id);

    if(!style){

      return;
    }

    const saleDate =
      parseDate(
        r.date,
        r.month,
        r.year
      );

    const age =
      daysBetween(
        saleDate,
        today
      );

    if(
      age > selectedDays
    ){

      return;
    }

    salesMap[style] =
      (
        salesMap[style] || 0
      )
      +
      num(r.qty);
  });

  return salesMap;
}