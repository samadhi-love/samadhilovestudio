// Checks every outside link in the site's content and lists the ones that do not open.
// Run with: node scripts/check-links.mjs
import { readFileSync, readdirSync } from "node:fs";

const urls = new Set();
for (const f of readdirSync("lib").filter((n) => n.endsWith(".js"))) {
  const text = readFileSync(`lib/${f}`, "utf8");
  for (const m of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) urls.add(m[1]);
}

const list = [...urls].sort();
const bad = [];
async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(20000),
        headers: { "User-Agent": "Mozilla/5.0 (link check for samadhi-love.com)" } });
      if (res.ok) return null;
      if (method === "GET") return res.status;
    } catch (e) {
      if (method === "GET") return e.name === "TimeoutError" ? "timeout" : "error";
    }
  }
}
let i = 0;
async function worker() {
  while (i < list.length) {
    const url = list[i++];
    const result = await check(url);
    if (result) bad.push(`${result}\t${url}`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`Checked ${list.length} links. Not opening: ${bad.length}`);
for (const line of bad.sort()) console.log(line);
