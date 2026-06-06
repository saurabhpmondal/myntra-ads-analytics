function splitCSVLine(
  line
){

  const result = [];

  let current = "";

  let insideQuotes =
    false;

  for(
    let i = 0;
    i < line.length;
    i++
  ){

    const char =
      line[i];

    if(
      char === '"'
    ){

      insideQuotes =
        !insideQuotes;

      continue;
    }

    if(

      char === ","

      &&

      !insideQuotes

    ){

      result.push(
        current
      );

      current = "";

      continue;
    }

    current += char;
  }

  result.push(
    current
  );

  return result.map(
    v => String(v || "")
      .trim()
  );
}

function parseCSV(
  csvText
){

  const lines =
    csvText
      .replace(
        /\r/g,
        ""
      )
      .split("\n")
      .filter(Boolean);

  if(
    !lines.length
  ){

    return [];
  }

  const headers =
    splitCSVLine(
      lines[0]
    );

  return lines
    .slice(1)
    .map(line=>{

      const values =
        splitCSVLine(
          line
        );

      const row = {};

      headers.forEach(
        (
          header,
          index
        )=>{

          row[
            header
          ] =
            values[
              index
            ] || "";
        }
      );

      return row;
    });
}

export function parseLiveCountData(
  listingCSV,
  inventoryCSV
){

  return {

    listings:
      parseCSV(
        listingCSV
      ),

    inventory:
      parseCSV(
        inventoryCSV
      )
  };
}