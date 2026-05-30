export function buildGrowthKPIs(filteredRows) {

  const currentUnits =
    filteredRows.reduce(
      (sum, row) =>
        sum + Number(row.m0 || 0),
      0
    );

  const projection =
    filteredRows.reduce(
      (sum, row) =>
        sum + Math.ceil(row.projection || 0),
      0
    );

  const prev1Units =
    filteredRows.reduce(
      (sum, row) =>
        sum + Number(row.m1 || 0),
      0
    );

  const prev2Units =
    filteredRows.reduce(
      (sum, row) =>
        sum + Number(row.m2 || 0),
      0
    );

  let growthPct = 0;
  let isNewGrowth = false;

  if (prev1Units === 0) {

    if (projection > 0) {

      growthPct = null;
      isNewGrowth = true;

    } else {

      growthPct = 0;
    }

  } else {

    growthPct =
      (
        (
          projection -
          prev1Units
        )
        /
        prev1Units
      ) * 100;
  }

  return {

    currentUnits,

    projection,

    prev1Units,

    prev2Units,

    growthPct,

    isNewGrowth
  };
}