export function parseCSV(text){

  const lines =
    text
      .replace(/\r/g,"")
      .split("\n")
      .filter(Boolean);

  if(!lines.length){

    return [];
  }

  const headers =
    lines[0]
      .split(",")
      .map(
        h => h.trim()
      );

  return lines
    .slice(1)
    .map(line=>{

      const values =
        line.split(",");

      const row = {};

      headers.forEach(
        (header,index)=>{

          row[header] =
            values[index] || "";
        }
      );

      return row;
    });
}