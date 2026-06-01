const URLS = {

  productMaster:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=205952585&single=true&output=csv",

  sales:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1679615114&single=true&output=csv",

  cpr:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=1490735065&single=true&output=csv",

  traffic:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=533529379&single=true&output=csv",

  sellerStock:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGOsj66mo-CpS5eTerQgEcjYvr5GuOkQUIQ_9Sy4bwFu6FjGv9wBvCZn5UQBcFB7M-dcuJdbxMxSnj/pub?gid=325497638&single=true&output=csv"
};

async function fetchCSV(url){

  const response =
    await fetch(url);

  if(
    !response.ok
  ){

    throw new Error(
      `Failed to fetch: ${url}`
    );
  }

  return await response.text();
}

export async function fetchLaunchTrackerData(){

  const [

    productMaster,
    sales,
    cpr,
    traffic,
    sellerStock

  ] = await Promise.all([

    fetchCSV(
      URLS.productMaster
    ),

    fetchCSV(
      URLS.sales
    ),

    fetchCSV(
      URLS.cpr
    ),

    fetchCSV(
      URLS.traffic
    ),

    fetchCSV(
      URLS.sellerStock
    )
  ]);

  return {

    productMaster,

    sales,

    cpr,

    traffic,

    sellerStock
  };
}