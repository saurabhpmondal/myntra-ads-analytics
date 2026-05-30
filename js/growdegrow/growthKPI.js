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

export function renderGrowthKPIs(kpi) {

  const growthText =
    kpi.growthPct === null
      ? "NEW"
      : `${Number(
          kpi.growthPct || 0
        ).toFixed(2)}%`;

  return `

    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(5,minmax(0,1fr));
        gap:12px;
        margin-bottom:16px;
      "
    >

      <div class="kpi-card">
        <span>Current Month</span>
        <strong>${kpi.currentUnits}</strong>
      </div>

      <div class="kpi-card">
        <span>Projection</span>
        <strong>${kpi.projection}</strong>
      </div>

      <div class="kpi-card">
        <span>Previous 1</span>
        <strong>${kpi.prev1Units}</strong>
      </div>

      <div class="kpi-card">
        <span>Previous 2</span>
        <strong>${kpi.prev2Units}</strong>
      </div>

      <div class="kpi-card">
        <span>Growth</span>
        <strong>${growthText}</strong>
      </div>

    </div>
  `;
}