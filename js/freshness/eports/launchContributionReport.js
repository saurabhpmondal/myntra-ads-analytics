export function buildLaunchContributionReport(
  matrix
) {

  const brandSet =
    new Set();

  matrix.rows.forEach(r => {

    Object.keys(r.brands)
      .forEach(b => {

        brandSet.add(b);
      });
  });

  const brands =
    Array.from(brandSet)
      .sort();

  return {

    brands,

    rows:
      matrix.rows
  };
}