import fs from "node:fs";
import path from "node:path";

const cfg = JSON.parse(fs.readFileSync(path.join("tools","link-audit.config.json"), "utf8"));
const BASE = cfg.base;

function isSkippable(u){
  return u.startsWith("http") || u.startsWith("mailto:") || u.startsWith("tel:") || u.startsWith("#");
}
function abs(u){
  return new URL(u, BASE).toString();
}
function extract(html){
  const out = new Set();
  const re = /(href|src)=["']([^"']+)["']/gi;
  let m;
  while((m = re.exec(html))){
    const u = (m[2]||"").trim();
    if(!u || isSkippable(u)) continue;
    out.add(u);
  }
  return [...out];
}
async function getText(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return await r.text();
}
async function check(url){
  try{
    let r = await fetch(url, { method:"HEAD" });
    if(!r.ok) r = await fetch(url, { method:"GET" });
    return { ok: r.ok, status: r.status };
  }catch(e){
    return { ok:false, status:"ERR" };
  }
}
function shouldIncludeBinary(u){
  return (cfg.includeBinaryExtensions||[]).some(ext => u.toLowerCase().includes(ext));
}

(async () => {
  const seen = new Map(); // url -> rel
  const pages = cfg.pages || ["index.html"];

  for(const p of pages){
    const url = abs(p);
    let html;
    try{
      html = await getText(url);
    }catch(e){
      seen.set(url, p);
      continue;
    }
    const links = extract(html);
    for(const rel of links){
      if(shouldIncludeBinary(rel) || rel.endsWith(".html") || rel.endsWith("/")){
        seen.set(abs(rel), rel);
      }
    }
  }

  const rows = [["url","rel","status","ok"]];
  for(const [url, rel] of seen.entries()){
    const res = await check(url);
    rows.push([url, rel, String(res.status), String(res.ok)]);
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  fs.writeFileSync(path.join("tools","link-report.csv"), csv, "utf8");
  console.log("Wrote tools/link-report.csv");
  const failed = rows.filter(r => r[3] === "false");
  if(failed.length > 1){
    console.error("Some links failed. See tools/link-report.csv");
    process.exit(2);
  }
})();
