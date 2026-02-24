import fs from "node:fs";
import path from "node:path";

const BASE = "https://ben2flandre-coder.github.io/plateforme-pms2/";
const START = "index.html";

function isAsset(u){
  return !u.startsWith("http") && !u.startsWith("mailto:") && !u.startsWith("#");
}
function abs(u){
  return new URL(u, BASE).toString();
}
async function fetchText(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return await r.text();
}
function extractLinks(html){
  const links = new Set();
  const re = /(href|src)=["']([^"']+)["']/gi;
  let m;
  while((m = re.exec(html))){
    const u = m[2].trim();
    if(isAsset(u)) links.add(u);
  }
  return [...links];
}
async function check(url){
  try{
    let r = await fetch(url, { method:"HEAD" });
    if(!r.ok) r = await fetch(url, { method:"GET" });
    return { ok: r.ok, status: r.status };
  }catch(e){
    return { ok:false, status: "ERR" };
  }
}

(async () => {
  const startUrl = abs(START);
  const html = await fetchText(startUrl);
  const rel = extractLinks(html);
  const all = rel.map(u => ({ rel:u, url:abs(u) }));

  // include docs page to crawl binaries
  const docsHtml = await fetchText(abs("documents-pms.html"));
  extractLinks(docsHtml).forEach(u => all.push({ rel:u, url:abs(u) }));

  const uniq = new Map();
  all.forEach(x => uniq.set(x.url, x.rel));

  const rows = [["url","rel","status","ok"]];
  for(const [url, rel] of uniq.entries()){
    const res = await check(url);
    rows.push([url, rel, String(res.status), String(res.ok)]);
  }
  const csv = rows.map(r => r.map(v => `"${v.replaceAll('"','""')}"`).join(",")).join("\n");
  fs.writeFileSync(path.join("tools","link-report.csv"), csv, "utf8");
  console.log("Wrote tools/link-report.csv");
})();
