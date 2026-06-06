const LISTING_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_-6UqSlJOryIiFpP51m4raSp-Vo5S2NZYTSzYU4RNWfpkvPMGfF_JT39WSBdbc4OwCwpVB1FpSMpq/pub?gid=0&single=true&output=csv";

const INVENTORY_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_-6UqSlJOryIiFpP51m4raSp-Vo5S2NZYTSzYU4RNWfpkvPMGfF_JT39WSBdbc4OwCwpVB1FpSMpq/pub?gid=654272602&single=true&output=csv";

async function fetchCSV(
  url
){

  const response =
    await fetch(
      url,
      {
        cache:
          "no-store"
      }
    );

  if(
    !response.ok
  ){

    throw new Error(
      `Failed to fetch ${url}`
    );
  }

  return await response.text();
}

export async function fetchLiveCountData(){

  const [

    listingCSV,

    inventoryCSV

  ] = await Promise.all([

    fetchCSV(
      LISTING_URL
    ),

    fetchCSV(
      INVENTORY_URL
    )

  ]);

  return {

    listingCSV,

    inventoryCSV

  };
}