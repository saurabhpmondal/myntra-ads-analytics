function fmtText(v){

  return String(v || "")
    .trim();
}

export function buildAttributeKPIs(
  rows
){

  let totalUnits = 0;

  let totalValue = 0;

  const styleSet =
    new Set();

  let topAttribute =
    "-";

  let topUnits = 0;

  rows.forEach(r=>{

    totalUnits +=

      Number(
        r.soldUnits || 0
      );

    totalValue +=

      Number(
        r.totalValue || 0
      );

    Number(
      r.stylesSold || 0
    ) > 0

      &&

      styleSet.add(
        `${r.attribute}-${r.value}`
      );

    if(

      Number(
        r.soldUnits || 0
      )

      >

      topUnits

    ){

      topUnits =

        Number(
          r.soldUnits || 0
        );

      topAttribute =

        `${fmtText(
          r.attribute
        )} : ${fmtText(
          r.value
        )}`;
    }
  });

  return {

    attributesFound:

      rows.length,

    stylesSold:

      styleSet.size,

    unitsSold:

      Math.round(
        totalUnits
      ),

    salesValue:

      Math.round(
        totalValue
      ),

    topAttribute,

    topUnits
  };
}