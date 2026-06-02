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
  erpSku,
  brand,
  erpStatus,
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

      erpSkus:
        new Set(),

      brands:
        new Set(),

      erpStatuses:
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
    .erpSkus
    .add(
      erpSku
    );

  map[key]
    .brands
    .add(
      brand
    );

  map[key]
    .erpStatuses
    .add(
      erpStatus
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

      erpSkus:
        new Set(),

      brands:
        new Set(),

      erpStatuses:
        new Set(),

      soldUnits:0,

      totalValue:0
    };
  }

  const child =
    map[key]
      .children[
        detailValue
      ];

  child.styles.add(
    styleId
  );

  child.erpSkus.add(
    erpSku
  );

  child.brands.add(
    brand
  );

  child.erpStatuses.add(
    erpStatus
  );

  child.soldUnits +=
    units;

  child.totalValue +=
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

      master.erp_sku,

      master.brand,

      master.erp_status,

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

      master.erp_sku,

      master.brand,

      master.erp_status,

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

      master.erp_sku,

      master.brand,

      master.erp_status,

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

        brands:
          Array.from(
            child.brands
          ),

        erpStatuses:
          Array.from(
            child.erpStatuses
          ),

        erpSkus:
          Array.from(
            child.erpSkus
          ),

        styleIds:
          Array.from(
            child.styles
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

      brands:
        Array.from(
          r.brands
        ),

      erpStatuses:
        Array.from(
          r.erpStatuses
        ),

      erpSkus:
        Array.from(
          r.erpSkus
        ),

      styleIds:
        Array.from(
          r.styles
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