export async function fetchCSV(url){
  const res = await fetch(url, { cache: 'no-store' });
  const txt = await res.text();
  return txt;
}