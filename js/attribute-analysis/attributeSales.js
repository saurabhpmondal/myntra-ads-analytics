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
    )

    /

    86400000

  );
}

export function buildAttributeSalesMap(
  sales,
  selectedDays
){

  const salesMap = {};

  const today =
    new Date();

  sales.forEach(r=>{

    const styleId =
      txt(
        r.style_id
      );

    if(
      !styleId
    ){

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

      selectedDays !== "ALL"

      &&

      age > selectedDays

    ){

      return;
    }

    if(
      !salesMap[
        styleId
      ]
    ){

      salesMap[
        styleId
      ] = {

        style_id:
          styleId,

        units:0,

        value:0
      };
    }

    salesMap[
      styleId
    ].units +=

      num(
        r.qty
      );

    salesMap[
      styleId
    ].value +=

      num(
        r.final_amount
      );
  });

  return salesMap;
}