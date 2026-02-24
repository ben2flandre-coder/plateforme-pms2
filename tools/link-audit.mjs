import fs from "node:fs";
import path from "node:path";

const cfg = JSON.parse(fs.readFileSync(path.join("tools","link-audit.config.json"), "utf8"));

const exts = new Set(cfg.extensions || []);
const visited = new Set();
const rows = [["from","url","resolved_path","exists"]];

function isExternal(u){
  return u.startsWith("http") || u.startsWith("mailto:") || u.startsWith("tel:") || u.startsWith("#");
}
function extractLinks(html){
  const out = [];
  const re = /(href|src)=["']([^"']+)["']/gi;
  let m;
  while((m = re.exec(html))){
    const u = (m[2] || "").trim();
    if(!u || isExternal(u)) continue;
    out.push(u);
  }
  return out;
}
function shouldCheck(u){
  const lower = u.toLowerCase();
  for(const e of exts){
    if(lower.includes(e)) return true;
  }
  return lower.endsWith(".html") || lower.endsWith("/");
}
function resolveFrom(fromFile, rel){
  const base = path.dirname(fromFile);
  const p = rel.endsWith("/") ? rel + "index.html" : rel;
  return path.normalize(path.join(base, p));
}

function fileExists(p){
  try{
    return fs.existsSync(p) && fs.statSync(p).isFile();
  }catch{ return false; }
}

function crawl(file){
  if(visited.has(file)) return;
  visited.add(file);

  if(!fileExists(file)){
    rows.push([file, "(self)", file, "false"]);
    return;
  }

  const html = fs.readFileSync(file, "utf8");
  for(const u of extractLinks(html)){
    if(!shouldCheck(u)) continue;
    const resolved = resolveFrom(file, u);
    const ok = fileExists(resolved);
    rows.push([file, u, resolved, String(ok)]);
    if(u.endsWith(".html") || u.endsWith("/")){
      crawl(resolved);
    }
  }
}

for(const p of (cfg.pages || [])){
  crawl(p);
}

const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
fs.writeFileSync(path.join("tools","link-report.csv"), csv, "utf8");

const failures = rows.slice(1).filter(r => r[3] === "false");
if(failures.length){
  console.error("LINK AUDIT FAILURES:", failures.length);
  process.exit(2);
}
console.log("OK: all audited links exist.");
