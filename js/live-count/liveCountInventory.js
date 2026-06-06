function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  const n =
    Number(v);

  return Number.isNaN(n)
    ? 0
    : n;
}

function parseSnapshotDate(
  dateStr
){

  const [
    day,
    month,
    year
  ] = String(
    dateStr || ""
  ).split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
}

export function buildLiveCountInventoryMap(
  inventory
){

  const snapshotMap = {};

  inventory.forEach(row=>{

    const snapshotDate =
      txt(
        row.snapshot_date
      );

    const styleId =
      txt(
        row.style_id
      );

    const inventoryCount =
      num(
        row.inventory_count
      );

    if(
      !snapshotDate
      ||
      !styleId
    ){

      return;
    }

    if(
      !snapshotMap[
        snapshotDate
      ]
    ){

      snapshotMap[
        snapshotDate
      ] = {};
    }

    if(
      !snapshotMap[
        snapshotDate
      ][
        styleId
      ]
    ){

      snapshotMap[
        snapshotDate
      ][
        styleId
      ] = 0;
    }

    snapshotMap[
      snapshotDate
    ][
      styleId
    ] +=
      inventoryCount;
  });

  const snapshotDates =
    Object.keys(
      snapshotMap
    )
    .sort(
      (a,b)=>

        parseSnapshotDate(a)
        -
        parseSnapshotDate(b)
    );

  return {

    snapshotMap,

    snapshotDates
  };
}