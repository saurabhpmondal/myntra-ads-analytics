function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

function buildDate(
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

export function buildLaunchSalesMap(
  sales,
  selectedDays
){

  const today =
    new Date();

  const salesMap = {};

  sales.forEach(r=>{

    const style =
      txt(r.style_id);

    if(
      !style
    ){

      return;
    }

    const saleDate =
      buildDate(

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

    if(
      !salesMap[style]
    ){

      salesMap[style] = {

        salesUnits:0,

        salesRevenue:0,

        firstSaleDate:null,

        saleDates:
          new Set()
      };
    }

    salesMap[style]
      .salesUnits +=
        num(r.qty);

    salesMap[style]
      .salesRevenue +=
        num(
          r.final_amount
        );

    salesMap[style]
      .saleDates
      .add(

        saleDate
          .toDateString()
      );

    if(

      !salesMap[style]
        .firstSaleDate

      ||

      saleDate <

      salesMap[style]
        .firstSaleDate

    ){

      salesMap[style]
        .firstSaleDate =
          saleDate;
    }
  });

  Object.values(
    salesMap
  ).forEach(r=>{

    r.distinctSaleDays =

      r.saleDates.size;

    r.drr =

      Number(

        (
          r.salesUnits /
          selectedDays
        ).toFixed(2)

      );

    delete r.saleDates;
  });

  return salesMap;
}