import { readFileSync } from "node:fs";
import path from "node:path";

let JSDOM;
try {
  ({ JSDOM } = await import("jsdom"));
} catch (e) {
  console.warn("WARN: jsdom not installed, skipping idempotence DOM test");
  process.exit(0);
}

const html = readFileSync("index.html", "utf8");
const navJs = readFileSync(path.join("assets","core","navigation.js"), "utf8");

function runOnce(dom) {
  dom.window.eval(navJs);
}

const dom = new JSDOM(html, { runScripts: "outside-only", resources: "usable", url: "http://localhost/" });

runOnce(dom);
runOnce(dom);

const doc = dom.window.document;

const counts = {
  op: doc.querySelectorAll("#pms-op-nav").length,
  bottom: doc.querySelectorAll("#pms-bottom-nav").length,
  fl: doc.querySelectorAll("#pms-float-left").length,
  fr: doc.querySelectorAll("#pms-float-right").length,
};

if (counts.op !== 1 || counts.bottom !== 1 || counts.fl !== 1 || counts.fr !== 1) {
  console.error("FAIL nav idempotence", counts);
  process.exit(1);
}

console.log("OK nav idempotence", counts);
