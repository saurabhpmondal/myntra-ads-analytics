export function parseCSV(
  csvText
){

  if(
    !csvText
  ){

    return [];
  }

  const rows =
    csvText
      .replace(
        /\r/g,
        ""
      )
      .split(
        "\n"
      )
      .filter(
        row =>
          row.trim()
      );

  if(
    !rows.length
  ){

    return [];
  }

  const headers =
    splitCSVLine(
      rows[0]
    );

  return rows
    .slice(1)
    .map(row=>{

      const values =
        splitCSVLine(
          row
        );

      const obj = {};

      headers.forEach(
        (
          header,
          index
        )=>{

          obj[
            header.trim()
          ] =
            (
              values[
                index
              ] || ""
            )
            .trim();
        }
      );

      return obj;
    });
}

function splitCSVLine(
  line
){

  const result = [];

  let current =
    "";

  let inQuotes =
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

      inQuotes =
        !inQuotes;

      continue;
    }

    if(
      char === ","
      &&
      !inQuotes
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

  return result;
}