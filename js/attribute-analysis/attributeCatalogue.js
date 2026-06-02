function txt(v){

  return String(v || "")
    .trim();
}

export function buildAttributeCatalogueMap(
  catalogueMaster
){

  const catalogueMap = {};

  catalogueMaster.forEach(r=>{

    const erpSku =
      txt(
        r.erp_sku
      );

    if(
      !erpSku
    ){

      return;
    }

    catalogueMap[
      erpSku
    ] = {

      erp_sku:
        erpSku,

      master_color:
        txt(
          r.master_color
        ),

      detailed_saree_color:
        txt(
          r.detailed_saree_color
        ),

      master_fabric:
        txt(
          r.master_fabric
        ),

      detailed_saree_fabric:
        txt(
          r.detailed_saree_fabric
        ),

      master_work:
        txt(
          r.master_work
        ),

      detailed_saree_work:
        txt(
          r.detailed_saree_work
        )
    };
  });

  return catalogueMap;
}