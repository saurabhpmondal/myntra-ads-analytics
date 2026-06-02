const URLS = {

  catalogueMaster:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1400591915&single=true&output=csv",

  sales:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1679615114&single=true&output=csv",

  productMaster:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=205952585&single=true&output=csv"
};

async function fetchCSV(
  url
){

  const res =
    await fetch(
      url,
      {
        cache:
          "no-store"
      }
    );

  if(
    !res.ok
  ){

    throw new Error(
      `Failed: ${url}`
    );
  }

  return await res.text();
}

export async function fetchAttributeData(){

  const [

    catalogueMaster,

    sales,

    productMaster

  ] = await Promise.all([

    fetchCSV(
      URLS.catalogueMaster
    ),

    fetchCSV(
      URLS.sales
    ),

    fetchCSV(
      URLS.productMaster
    )

  ]);

  return {

    catalogueMaster,

    sales,

    productMaster

  };
}