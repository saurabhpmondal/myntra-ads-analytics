const VALID_BRANDS = [

  "all about you",
  "DIVASTRI",
  "HERE&NOW",
  "KALINI",
  "Mitera",
  "Navibhu",
  "SAMAH",
  "Sangria",
  "SANISA",
  "Satrani",
  "SZN"

];

function txt(v){

  return String(v || "")
    .trim();
}

export function buildLiveCountListingMap(
  listings
){

  const styleBrandMap = {};

  const eligibleStyles =
    new Set();

  listings.forEach(row=>{

    const articleType =
      txt(
        row.article_type
      );

    const brand =
      txt(
        row.brand
      );

    const styleStatus =
      txt(
        row.style_status_description
      );

    const listingStatus =
      txt(
        row.listing_status_description
      );

    const styleId =
      txt(
        row.style_id
      );

    if(
      !styleId
    ){

      return;
    }

    if(
      articleType !==
      "Sarees"
    ){

      return;
    }

    if(
      !VALID_BRANDS.includes(
        brand
      )
    ){

      return;
    }

    if(
      styleStatus !==
      "Active"
    ){

      return;
    }

    if(
      listingStatus !==
      "Active"
    ){

      return;
    }

    eligibleStyles.add(
      styleId
    );

    styleBrandMap[
      styleId
    ] = {

      style_id:
        styleId,

      brand
    };
  });

  return {

    styleBrandMap,

    eligibleStyles:
      Array.from(
        eligibleStyles
      ),

    brands:
      [...VALID_BRANDS]
  };
}