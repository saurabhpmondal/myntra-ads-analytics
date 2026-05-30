export function evaluateOOS(
  sales,
  drr,
  oosDays
){

  let threshold = 7;

  if(
    sales > 100
  ){

    threshold = 1;

  }else if(
    sales >= 50
  ){

    threshold = 3;
  }

  const isFlagged =
    oosDays >= threshold;

  const salesLoss =
    Number(
      (
        drr *
        oosDays
      ).toFixed(2)
    );

  let severityFlag =
    "LOW";

  if(
    salesLoss >= 50
  ){

    severityFlag =
      "CRITICAL";

  }else if(
    salesLoss >= 20
  ){

    severityFlag =
      "HIGH";

  }else if(
    salesLoss >= 5
  ){

    severityFlag =
      "MEDIUM";
  }

  return {

    isFlagged,

    threshold,

    salesLoss,

    severityFlag
  };
}