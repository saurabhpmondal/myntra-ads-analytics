import {
  getAttributeStore
}
from "./attributeStore.js";

import {
  buildAttributeProductMaster
}
from "./attributeProductMaster.js";

import {
  buildAttributeCatalogueMap
}
from "./attributeCatalogue.js";

import {
  buildAttributeSalesMap
}
from "./attributeSales.js";

import {
  buildAttributeKPIs
}
from "./attributeKPI.js";

function txt(v){

  return String(v || "")
    .trim();
}

function num(v){

  return Number(v || 0);
}

function addToBucket(
  map,
  attribute,
  parentValue,
  detailValue,
  styleId,
  units,
  value
){

  if(
    !parentValue
  ){

    return;
  }

  const key =
    `${attribute}||${parentValue}`;

  if(
    !map[key]
  ){

    map[key] = {

      attribute,

      value:
        parentValue,

      styles:
        new Set(),

      soldUnits:0,

      totalValue:0,

      children:{}
    };
  }

  map[key]
    .styles
    .add(
      styleId
    );

  map[key]
    .soldUnits +=
      units;

  map[key]
    .totalValue +=
      value;

  if(
    !detailValue
  ){

    return;
  }

  if(
    !map[key]
      .children[
        detailValue
      ]
  ){

    map[key]
      .children[
        detailValue
      ] = {

      value:
        detailValue,

      styles:
        new Set(),

      soldUnits:0,

      totalValue:0
    };
  }

  map[key]
    .children[
      detailValue
    ]
    .styles
    .add(
      styleId
    );

  map[key]
    .children[
      detailValue
    ]
    .soldUnits +=
      units;

  map[key]
    .children[
      detailValue
    ]
    .totalValue +=
      value;
}

export async function buildAttributeData(
  selectedDays = 60
){

  const {

    productMaster,
    catalogueMaster,
    sales

  } =
    await getAttributeStore();

  const {

    styleMaster

  } =
    buildAttributeProductMaster(
      productMaster
    );

  const catalogueMap =
    buildAttributeCatalogueMap(
      catalogueMaster
    );

  const salesMap =
    buildAttributeSalesMap(
      sales,
      selectedDays
    );

  const bucketMap = {};

  Object.keys(
    salesMap
  ).forEach(styleId=>{

    const salesData =
      salesMap[
        styleId
      ];

    const master =
      styleMaster[
        styleId
      ];

    if(
      !master
    ){

      return;
    }

    if(

      selectedDays !==
      "ALL"

      &&

      master.launchAge >
      selectedDays

    ){

      return;
    }

    const catalogue =
      catalogueMap[
        master.erp_sku
      ];

    if(
      !catalogue
    ){

      return;
    }

    const units =
      num(
        salesData.units
      );

    const value =
      num(
        salesData.value
      );

    if(
      units <= 0
    ){

      return;
    }

    addToBucket(

      bucketMap,

      "COLOR",

      txt(
        catalogue.master_color
      ),

      txt(
        catalogue.detailed_saree_color
      ),

      styleId,

      units,

      value
    );

    addToBucket(

      bucketMap,

      "FABRIC",

      txt(
        catalogue.master_fabric
      ),

      txt(
        catalogue.detailed_saree_fabric
      ),

      styleId,

      units,

      value
    );

    addToBucket(

      bucketMap,

      "WORK",

      txt(
        catalogue.master_work
      ),

      txt(
        catalogue.detailed_saree_work
      ),

      styleId,

      units,

      value
    );
  });

  const rows = [];

  let grandUnits = 0;

  Object.values(
    bucketMap
  ).forEach(r=>{

    grandUnits +=
      r.soldUnits;
  });

  Object.values(
    bucketMap
  ).forEach(r=>{

    const children =

      Object.values(
        r.children
      )

      .map(child=>({

        value:
          child.value,

        stylesSold:
          child.styles.size,

        soldUnits:
          child.soldUnits,

        totalValue:
          Math.round(
            child.totalValue
          ),

        contribution:
          grandUnits

            ?

            Number(

              (
                child.soldUnits
                /
                grandUnits
              )

              * 100

            ).toFixed(2)

            :

            0
      }))

      .sort(
        (a,b)=>

          b.soldUnits -
          a.soldUnits
      );

    rows.push({

      attribute:
        r.attribute,

      value:
        r.value,

      stylesSold:
        r.styles.size,

      soldUnits:
        r.soldUnits,

      totalValue:
        Math.round(
          r.totalValue
        ),

      contribution:
        grandUnits

          ?

          Number(

            (
              r.soldUnits
              /
              grandUnits
            )

            * 100

          ).toFixed(2)

          :

          0,

      children
    });
  });

  rows.sort(
    (a,b)=>

      b.soldUnits -
      a.soldUnits
  );

  const kpis =
    buildAttributeKPIs(
      rows
    );

  return {

    rows,

    kpis
  };
}