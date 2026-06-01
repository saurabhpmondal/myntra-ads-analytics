export function parseCSV(csvText){

  if(
    !csvText ||
    !csvText.trim()
  ){

    return [];
  }

  const rows = [];

  let current = "";
  let row = [];
  let inQuotes = false;

  for(
    let i = 0;
    i < csvText.length;
    i++
  ){

    const char =
      csvText[i];

    const next =
      csvText[i + 1];

    if(
      char === '"'
    ){

      if(
        inQuotes &&
        next === '"'
      ){

        current += '"';

        i++;

      }else{

        inQuotes =
          !inQuotes;
      }

      continue;
    }

    if(
      char === "," &&
      !inQuotes
    ){

      row.push(
        current
      );

      current = "";

      continue;
    }

    if(
      (
        char === "\n" ||
        char === "\r"
      )
      &&
      !inQuotes
    ){

      if(
        current !== "" ||
        row.length
      ){

        row.push(
          current
        );

        rows.push(
          row
        );

        row = [];

        current = "";
      }

      continue;
    }

    current += char;
  }

  if(
    current !== "" ||
    row.length
  ){

    row.push(
      current
    );

    rows.push(
      row
    );
  }

  if(
    !rows.length
  ){

    return [];
  }

  const headers =
    rows[0].map(
      h =>
        String(h || "")
          .trim()
    );

  return rows
    .slice(1)
    .map(r=>{

      const obj = {};

      headers.forEach(
        (header,index)=>{

          obj[header] =
            String(
              r[index] || ""
            ).trim();
        }
      );

      return obj;
    });
}