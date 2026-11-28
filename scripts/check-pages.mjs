// Browser check for every page: opens each address at phone (375), tablet (768) and desktop (1440) widths in
// headless Chrome and reports anything wider than the screen, broken pictures, script errors and failed loads.
// It also presses the buttons and controls on each page and reports any script error that causes.
// Usage: start the site (PORT=3311 PREVIEW_PASSWORD=x node server.js), then
//   node scripts/check-pages.mjs                 every page
//   node scripts/check-pages.mjs /library /about  only these addresses
// Needs Google Chrome installed (google-chrome on the PATH, or set CHROME=/path/to/chrome).
import { spawn } from "node:child_process";
import { categories } from "../lib/content.js";

const base = process.env.BASE || "http://localhost:3311";
const auth = "Basic " + Buffer.from("x:" + (process.env.PREVIEW_PASSWORD || "x")).toString("base64");
const WIDTHS = [375, 768, 1440];
const fixed = ["/", "/library", "/about", "/music", "/contact", "/privacy", "/terms", "/credits", "/search", "/search?q=love", "/masters"];
const urls = process.argv.slice(2).length ? process.argv.slice(2)
  : [...new Set([...fixed, ...categories.flatMap((c) => [`/library?tab=${c.id}`, ...c.items.map((i) => `/teachings/${i.slug}`)])])];

const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(process.env.CHROME || "google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
let ws;
try {
  let list;
  for (let i = 0; i < 40 && !list; i++) { await new Promise((r) => setTimeout(r, 250)); list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).catch(() => null); }
  if (!list) throw new Error("Chrome did not start");
  ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener("open", r); ws.addEventListener("error", j); });
  let id = 0; const waits = new Map(), events = [];
  ws.addEventListener("message", (m) => { const d = JSON.parse(m.data); if (d.id && waits.has(d.id)) { waits.get(d.id)(d); waits.delete(d.id); } else events.push(d); });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  for (const m of ["Network.enable", "Runtime.enable", "Log.enable", "Page.enable"]) await cmd(m);
  await cmd("Network.setExtraHTTPHeaders", { headers: { Authorization: auth } });
  await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

  const probe = `(() => { const W = document.documentElement.clientWidth, out = [];
    for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect();
      if (!r.width || r.right <= W + 2 || getComputedStyle(el).position === "fixed") continue;
      let p = el.parentElement, clipped = false;
      while (p) { if (/auto|hidden|scroll|clip/.test(getComputedStyle(p).overflowX) && p.getBoundingClientRect().right <= W + 2) { clipped = true; break; } p = p.parentElement; }
      if (!clipped) out.push(el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : "")); }
    const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src")).map((i) => "BROKEN PICTURE " + i.getAttribute("src"));
    return JSON.stringify({ sw: document.documentElement.scrollWidth, W, out: [...new Set(out)].slice(0, 5), imgs }); })()`;
  const press = `(async () => { const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (const el of document.querySelectorAll("main button:not([type=submit]), main input[type=range], main input[type=checkbox], main input[type=radio], main select, .ticker button")) {
      try { if (el.type === "range") { el.value = el.max || 1; el.dispatchEvent(new Event("input", { bubbles: true })); }
        else if (el.tagName === "SELECT") { el.selectedIndex = el.options.length - 1; el.dispatchEvent(new Event("change", { bubbles: true })); }
        else el.click(); } catch (e) {}
      await sleep(60); }
    for (const b of document.querySelectorAll("[data-tk-end]")) b.click();
    return true; })()`;
  const problems = [];
  const settle = () => new Promise((r) => { const t0 = Date.now(); const iv = setInterval(() => { if (events.some((e) => e.method === "Page.loadEventFired") || Date.now() - t0 > 8000) { clearInterval(iv); r(); } }, 50); });
  const issues = () => [
    ...events.filter((e) => e.method === "Runtime.exceptionThrown").map((e) => "SCRIPT ERROR " + String(e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text).split("\n")[0]),
    ...events.filter((e) => e.method === "Log.entryAdded" && /Content Security Policy|Refused/.test(e.params.entry.text)).map((e) => "BLOCKED " + e.params.entry.text.slice(0, 120)),
    ...events.filter((e) => e.method === "Network.responseReceived" && e.params.response.status >= 400 && !/favicon/.test(e.params.response.url)).map((e) => "HTTP " + e.params.response.status + " " + e.params.response.url.replace(base, "")),
  ];
  for (const width of WIDTHS) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
    for (const u of urls) {
      events.length = 0;
      await cmd("Page.navigate", { url: base + u }); await settle(); await new Promise((r) => setTimeout(r, 200));
      const v = JSON.parse((await cmd("Runtime.evaluate", { expression: probe, returnByValue: true })).result.result.value || "{}");
      if (width === 1440) await cmd("Runtime.evaluate", { expression: press, awaitPromise: true });
      const found = [...(v.sw > v.W + 2 ? [`WIDER THAN SCREEN ${v.sw}>${v.W}: ${v.out.join(", ")}`] : []), ...(v.imgs || []), ...issues()];
      if (found.length) problems.push(`${width}px ${u}\n   ${[...new Set(found)].join("\n   ")}`);
    }
  }
  console.log(problems.length ? problems.join("\n") : "ALL CLEAN");
  console.log(`${urls.length} pages x ${WIDTHS.length} widths checked; buttons pressed at 1440px.`);
  process.exitCode = problems.length ? 1 : 0;
} finally { try { ws?.close(); } catch (e) {} chrome.kill(); }
