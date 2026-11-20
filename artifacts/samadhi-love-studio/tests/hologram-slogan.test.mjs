import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { build } from "esbuild";
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const bundle = await build({
  entryPoints: [new URL("../app/hologram-slogan.tsx", import.meta.url).pathname],
  bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic",
  external: ["react", "react/jsx-runtime"], loader: { ".css": "empty" },
});
const compiled = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(require, compiled, compiled.exports);
const { HologramScope, HologramSlogan, HologramSimpleViewNote, HologramOriginalsLine, HologramStartSongNote, HologramVideoDescription } = compiled.exports;
const slogan = "Your song. Your world. Your video.";
const videoDescription = "Turn your music into a lyric video, animated cover or social short. Choose cosmic and sacred scenes, cinematic backgrounds and animated lyric templates in the same studio.";
const render = props => renderToString(React.createElement(HologramSlogan, props));
const chosenLines = [
  ["slogan", HologramSlogan, slogan],
  ["simple-view", HologramSimpleViewNote, "Simple view · start with an idea"],
  ["originals", HologramOriginalsLine, "Originals in motion, one frequency at a time."],
  ["start-song", HologramStartSongNote, "Start a song to give your next idea a home."],
  ["video-description", HologramVideoDescription, videoDescription],
];

async function fixture({ reduced = false, forced = false, component = HologramSlogan } = {}) {
  const dom = new JSDOM(`<div id="root">${renderToString(React.createElement(component))}</div>`, { pretendToBeVisual: true });
  const previous = { window: globalThis.window, document: globalThis.document, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const mediaListeners = new Map();
  const queries = new Map();
  dom.window.matchMedia = query => {
    if (!queries.has(query)) queries.set(query, {
      matches: query.includes("reduced") ? reduced : forced,
      addEventListener: (_, callback) => mediaListeners.set(query, callback),
      removeEventListener: () => mediaListeners.delete(query),
    });
    return queries.get(query);
  };
  let intersect, disconnected = false, clock = 0, next = 0;
  const timers = new Map();
  dom.window.IntersectionObserver = class {
    constructor(callback) { intersect = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  };
  dom.window.performance.now = () => clock;
  dom.window.setTimeout = callback => { timers.set(++next, callback); return next; };
  dom.window.clearTimeout = id => timers.delete(id);
  const errors = [];
  let root;
  await act(async () => { root = hydrateRoot(dom.window.document.getElementById("root"), React.createElement(component), { onRecoverableError: error => errors.push(error) }); });
  const glyphs = () => [...dom.window.document.querySelectorAll(".hologram-slogan__glyph")].map(n => n.textContent).join("");
  return {
    dom, errors, timers, glyphs,
    get disconnected() { return disconnected; },
    async enter() { await act(async () => intersect([{ isIntersecting: true }])); },
    async advance(ms) { clock += ms; const callbacks = [...timers.values()]; timers.clear(); await act(async () => callbacks.forEach(callback => callback())); },
    async reduce() {
      const query = "(prefers-reduced-motion: reduce)";
      queries.get(query).matches = true;
      await act(async () => mediaListeners.get(query)());
    },
    async close() {
      await act(async () => root.unmount());
      assert.equal(timers.size, 0, "animation timer cleaned up");
      assert.equal(mediaListeners.size, 0, "preference listeners cleaned up");
      dom.window.close();
      if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
      if (previous.document === undefined) delete globalThis.document; else globalThis.document = previous.document;
      if (previous.act === undefined) delete globalThis.IS_REACT_ACT_ENVIRONMENT; else globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
    },
  };
}

test("SSR uses real English text and a stable accessible label, including each large phrase", () => {
  for (const [props, expected] of [[{}, slogan], [{ part: 0 }, "Your song."], [{ part: 1 }, "Your world."], [{ part: 2 }, "Your video."]]) {
    assert.equal(render(props), render(props));
    const document = new JSDOM(render(props)).window.document;
    assert.equal(document.querySelector('[role="img"]').getAttribute("aria-label"), expected);
    assert.equal(document.body.textContent, expected);
    assert.equal(document.querySelector(".hologram-slogan > span").getAttribute("aria-hidden"), "true");
  }
});
test("each screen scope retains exactly one chosen full effect and demotes every competing line", () => {
  for (const [primary, , expected] of chosenLines) {
    const html = renderToString(React.createElement(HologramScope, { primary },
      chosenLines.map(([id, Component]) => React.createElement(Component, { key: id }))));
    const document = new JSDOM(html).window.document;
    assert.equal(document.querySelectorAll(".hologram-slogan").length, 1);
    assert.equal(document.querySelector(".hologram-slogan").getAttribute("aria-label"), expected);
    assert.equal(document.querySelectorAll(".hologram-guide").length, 4);
    for (const node of document.querySelectorAll(".hologram-guide")) {
      assert.equal(node.querySelector("[aria-hidden]"), null, "ordinary accessible text, not a decoding layer");
      assert.equal(node.querySelector("[data-letter]"), null);
    }
  }
  const source = readFileSync(new URL("../app/studio.tsx", import.meta.url), "utf8");
  assert.match(source, /<HologramScope primary=\{view === "overview" && !song && !pane \? "video-description" : "simple-view"\}>/);
});
test("demoted lines are static client text, with no decode observer or timer", async () => {
  const component = () => React.createElement(HologramScope, { primary: "slogan" },
    chosenLines.filter(([kind]) => kind !== "slogan").map(([kind, Component]) => React.createElement(Component, { key: kind })));
  const view = await fixture({ component });
  try {
    assert.deepEqual(view.errors, []);
    assert.equal(view.dom.window.document.querySelectorAll(".hologram-guide").length, 4);
    assert.equal(view.dom.window.document.querySelectorAll(".hologram-slogan").length, 0);
    assert.equal(view.timers.size, 0);
  } finally { await view.close(); }
});
test("soft guidance has only color/glow declarations and leaves controls, warnings and plans alone", () => {
  const css = readFileSync(new URL("../app/hologram-slogan.css", import.meta.url), "utf8");
  const declarations = css.match(/\.hologram-guide\{([^}]+)\}/)[1];
  assert.deepEqual(declarations.split(";").filter(Boolean).map(d => d.split(":")[0]).sort(), ["color", "text-shadow"]);
  assert.match(css, /\.vl-pop\.vl-pop--soft\{animation:none;opacity:1;transform:none\}/);
  assert.match(css, /\.hologram-guide\{color:CanvasText !important;text-shadow:none\}/);
  for (const file of ["studio", "quick-create", "studio-screens", "recording-desk", "lyric-video-pro"]) {
    const source = readFileSync(new URL(`../app/${file}.tsx`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /<(?:label|input|textarea|button|select|option)[^>]*className="[^"]*hologram-guide/);
    assert.doesNotMatch(source, /className="[^"]*(?:error|warning|notice)[^"]*hologram-guide/);
  }
  const screens = readFileSync(new URL("../app/studio-screens.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(screens.slice(screens.indexOf("export function Plan"), screens.indexOf("export function Promote")), /hologram-guide/);
});
test("soft aqua guidance meets normal-text contrast on existing dark purple/gold panel grounds", () => {
  const luminance = hex => {
    const channels = hex.match(/../g).map(c => parseInt(c, 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  for (const background of ["04030d", "150c32", "1f1244", "1c1034", "2a1744", "443252"]) {
    assert.ok((luminance("b4e9ee") + 0.05) / (luminance(background) + 0.05) >= 4.5, background);
  }
});
test("Start-song line keeps exact SSR text, accessible wording and the existing empty-state container", () => {
  const text = "Start a song to give your next idea a home.";
  const html = renderToString(React.createElement(HologramStartSongNote));
  assert.equal(html, renderToString(React.createElement(HologramStartSongNote)));
  const document = new JSDOM(html).window.document;
  assert.equal(document.body.textContent, text);
  assert.equal(document.querySelector('[role="img"]').getAttribute("aria-label"), text);
  assert.equal(document.querySelector(".hologram-slogan--description"), null);
  const source = readFileSync(new URL("../app/studio.tsx", import.meta.url), "utf8");
  assert.ok(source.includes('!cleanLibrary.length && <div className="empty"><HologramStartSongNote/></div>'));
});
for (const preference of ["normal", "reduced", "forced"]) test(`Start-song line reuses the one-time slogan effect with ${preference} preferences`, async () => {
  const view = await fixture({ [preference]: true, component: HologramStartSongNote });
  const text = "Start a song to give your next idea a home.";
  try {
    assert.deepEqual(view.errors, []);
    await view.enter();
    if (preference === "normal") {
      assert.match(view.glyphs(), /^[01<>/#*+=.]+$/);
      await view.advance(900);
      assert.ok(view.glyphs().startsWith(text.slice(0, Math.floor(text.length / 2)).replaceAll(" ", "")));
      await view.advance(900);
    }
    assert.equal(view.dom.window.document.body.textContent, text);
    assert.equal(view.dom.window.document.querySelector('[role="img"]').getAttribute("aria-label"), text);
    assert.equal(view.timers.size, 0);
    await view.enter();
    assert.equal(view.timers.size, 0);
  } finally { await view.close(); }
});
test("Originals line preserves exact SSR wording, accessible text and existing paragraph placement", () => {
  const text = "Originals in motion, one frequency at a time.";
  const html = renderToString(React.createElement(HologramOriginalsLine));
  assert.equal(html, renderToString(React.createElement(HologramOriginalsLine)));
  const document = new JSDOM(html).window.document;
  assert.equal(document.body.textContent, text);
  assert.equal(document.querySelector('[role="img"]').getAttribute("aria-label"), text);
  assert.equal(document.querySelector(".hologram-slogan--description"), null, "use uppercase slogan styling, not prose");
  const source = readFileSync(new URL("../app/studio.tsx", import.meta.url), "utf8");
  assert.match(source, /<p className="section-sub"><HologramOriginalsLine\/><\/p>/);
});
for (const preference of ["normal", "reduced", "forced"]) test(`Originals line uses the shared once-only slogan decode with ${preference} preferences`, async () => {
  const view = await fixture({ [preference]: true, component: HologramOriginalsLine });
  const text = "Originals in motion, one frequency at a time.";
  try {
    assert.deepEqual(view.errors, []);
    await view.enter();
    if (preference === "normal") {
      assert.match(view.glyphs(), /^[01<>/#*+=.,]+$/);
      await view.advance(900);
      assert.ok(view.glyphs().startsWith(text.slice(0, Math.floor(text.length / 2)).replaceAll(" ", "")));
      await view.advance(900);
    }
    assert.equal(view.dom.window.document.body.textContent, text);
    assert.equal(view.dom.window.document.querySelector('[role="img"]').getAttribute("aria-label"), text);
    assert.equal(view.timers.size, 0);
    await view.enter();
    assert.equal(view.timers.size, 0);
  } finally { await view.close(); }
});
test("video description preserves both exact sentences in SSR and its accessible label", () => {
  const html = renderToString(React.createElement(HologramVideoDescription));
  assert.equal(html, renderToString(React.createElement(HologramVideoDescription)));
  const document = new JSDOM(html).window.document;
  assert.equal(document.body.textContent, videoDescription);
  assert.equal(document.querySelector('[role="img"]').getAttribute("aria-label"), videoDescription);
  assert.ok(document.querySelector(".hologram-slogan--description"));
  const source = readFileSync(new URL("../app/studio.tsx", import.meta.url), "utf8");
  assert.match(source, /<p className="muted"><HologramVideoDescription\/><\/p>/);
});
test("video description decodes whole words left to right, finishes at 1.5 seconds and never loops", async () => {
  const view = await fixture({ component: HologramVideoDescription });
  const words = videoDescription.split(" ");
  try {
    assert.deepEqual(view.errors, []);
    await view.enter();
    await view.advance(750);
    const visibleWords = [...view.dom.window.document.querySelectorAll(".hologram-slogan__word")].map(n => n.textContent);
    const resolved = Math.floor(words.length / 2);
    for (let i = 0; i < words.length; i++) {
      if (i < resolved) assert.equal(visibleWords[i], words[i]);
      else assert.match(visibleWords[i], /^[01<>/#*+=.,]+$/);
    }
    assert.equal(view.dom.window.document.querySelector('[role="img"]').getAttribute("aria-label"), videoDescription);
    await view.advance(700);
    assert.equal(view.timers.size, 1, "still decoding before the 1.5-second deadline");
    await view.advance(50);
    assert.equal(view.dom.window.document.body.textContent, videoDescription);
    assert.equal(view.timers.size, 0);
    await view.enter();
    assert.equal(view.timers.size, 0);
  } finally { await view.close(); }
});
for (const preference of ["reduced", "forced"]) test(`video description stays real and static with ${preference} preference`, async () => {
  const view = await fixture({ [preference]: true, component: HologramVideoDescription });
  try {
    await view.enter();
    assert.equal(view.dom.window.document.body.textContent, videoDescription);
    assert.equal(view.timers.size, 0);
  } finally { await view.close(); }
});
test("the prose-only style keeps sentence case, inherited size and gentle spacing; contrast override still wins", () => {
  const css = readFileSync(new URL("../app/hologram-slogan.css", import.meta.url), "utf8");
  const prose = css.match(/\.hologram-slogan--description\{([^}]+)\}/)[1];
  assert.match(prose, /text-transform:none/);
  assert.match(prose, /font-size:inherit/);
  assert.match(prose, /letter-spacing:\.02em/);
  assert.match(prose, /line-height:1\.65/);
  assert.ok(css.indexOf("@media(forced-colors:active)") > css.indexOf(".hologram-slogan--description"));
});
test("Simple view note retains exact SSR text and accessible words; only the Simple branch opts in", () => {
  const text = "Simple view · start with an idea";
  const html = renderToString(React.createElement(HologramSimpleViewNote));
  assert.equal(html, renderToString(React.createElement(HologramSimpleViewNote)));
  const document = new JSDOM(html).window.document;
  assert.equal(document.body.textContent, text);
  assert.equal(document.querySelector('[role="img"]').getAttribute("aria-label"), text);
  const navigation = readFileSync(new URL("../app/studio-navigation.tsx", import.meta.url), "utf8");
  // Simplified navigation (119fe3c) shows the note only in Simple view; Advanced view shows no note.
  assert.match(navigation, /\{beginner && <p className="studio-mode-note"><HologramSimpleViewNote\/><\/p>\}/);
  assert.doesNotMatch(navigation, /Advanced view · Pro screens are available below/);
});
for (const reduced of [false, true]) test(`Simple view note shares the once-only decode and respects reduced motion: ${reduced}`, async () => {
  const view = await fixture({ reduced, component: HologramSimpleViewNote });
  const final = "Simpleview·startwithanidea";
  try {
    assert.deepEqual(view.errors, []);
    assert.equal(view.glyphs(), final);
    await view.enter();
    if (!reduced) {
      assert.match(view.glyphs(), /^[01<>/#*+=·]+$/);
      await view.advance(1800);
    }
    assert.equal(view.glyphs(), final);
    assert.equal(view.timers.size, 0);
    await view.enter();
    assert.equal(view.timers.size, 0);
  } finally { await view.close(); }
});
test("hydrates without mismatch; decodes left to right only once on intersection", async () => {
  const view = await fixture();
  const noSpaces = slogan.replaceAll(" ", "");
  try {
    assert.deepEqual(view.errors, []);
    assert.equal(view.glyphs(), noSpaces);
    assert.equal(view.timers.size, 0, "wait for visibility");
    await view.enter();
    assert.ok(view.disconnected);
    assert.match(view.glyphs(), /^[01<>/#*+=.]+$/);
    assert.equal(view.dom.window.document.querySelector('[role="img"]').getAttribute("aria-label"), slogan);
    await view.advance(900);
    assert.ok(view.glyphs().startsWith(slogan.slice(0, Math.floor(slogan.length / 2)).replaceAll(" ", "")));
    await view.advance(900);
    assert.equal(view.glyphs(), noSpaces);
    assert.equal(view.timers.size, 0);
    await view.enter();
    assert.equal(view.timers.size, 0, "no repeated decode on re-entry");
  } finally { await view.close(); }
});
for (const preference of ["reduced", "forced"]) test(`${preference} preference keeps static final words`, async () => {
  const view = await fixture({ [preference]: true });
  try {
    await view.enter();
    assert.equal(view.glyphs(), slogan.replaceAll(" ", ""));
    assert.equal(view.timers.size, 0);
  } finally { await view.close(); }
});
test("turning on reduced motion cancels an active decode immediately", async () => {
  const view = await fixture();
  try {
    await view.enter();
    await view.reduce();
    assert.equal(view.glyphs(), slogan.replaceAll(" ", ""));
    assert.equal(view.timers.size, 0);
  } finally { await view.close(); }
});
test("hologram CSS is opt-in only and small-print slogan placements stay unchanged", () => {
  const css = readFileSync(new URL("../app/hologram-slogan.css", import.meta.url), "utf8");
  assert.match(css, /Orbitron/);
  assert.match(css, /forced-colors:active/);
  assert.doesNotMatch(css, /(?:^|\n)(?:body|html|h1|h2|button|label)[{ ,]/);
  const landing = readFileSync(new URL("../app/landing/index.tsx", import.meta.url), "utf8");
  assert.match(landing, /<p>© \{brand.name\} · \{brand.slogan\}/);
  const quick = readFileSync(new URL("../app/quick-create.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(quick, /HologramSlogan/);
});
