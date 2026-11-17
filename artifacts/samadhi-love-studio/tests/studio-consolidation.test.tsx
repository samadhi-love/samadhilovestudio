import "./browser-platform";
import test from "node:test";
import assert from "node:assert/strict";
import { act } from "react";
import { JSDOM } from "jsdom";
import { StudioNavigation, ScreenSections } from "../app/studio-navigation";
import { QuickCreate } from "../app/quick-create";
import { RadioSourceSwitch, RecordSwitch, SongSteps } from "../app/studio-screens";
import { VibeLookPicker, featuredVibes, activeVibe } from "../app/vibe-look-picker";
import type { LyricProject } from "../app/lyric-video-data";
import { freshSong, type Template } from "../app/studio-data";
import { legacyPageRedirect, resolveLocation, resolveView, screenOf, studioUrl } from "../app/studio-routes";

const legacy: Record<string, [string, string]> = {
  overview: ["create", "overview"], create: ["create", "overview"], "prompt-lab": ["create", "overview"], "vocal-director": ["create", "overview"], templates: ["create", "overview"],
  "music-library": ["world-sounds", "music-library"], "rhythm-atlas": ["world-sounds", "rhythm-atlas"], "international-tent": ["world-sounds", "international-tent"], "meditative-vibes": ["world-sounds", "meditative-vibes"],
  recording: ["record", "recording"], podcast: ["record", "podcast"], "vocal-studio": ["record", "vocal-studio"],
  multitrack: ["mix-edit", "multitrack"], compare: ["mix-edit", "compare"],
  songs: ["songs", "songs"], workflow: ["songs", "workflow"], releases: ["songs", "songs"], distribution: ["songs", "songs"],
  radio: ["explore", "radio"], "lyric-video": ["lyric-video", "lyric-video"],
};
test("every legacy view ID resolves to its consolidated screen and subsection", () => {
  for (const [id, [screen, view]] of Object.entries(legacy)) {
    const r = resolveView(id)!; assert.equal(r.screen, screen, id); assert.equal(r.view, view, id);
  }
  assert.equal(resolveView("create", "create")!.view, "overview");
  assert.equal(resolveView("create", "create")!.panel, "pro");
  assert.equal(resolveView("world-sounds", "meditation")!.view, "meditative-vibes");
  assert.equal(resolveView("record", "podcast")!.view, "podcast");
  assert.equal(resolveView("mix-edit")!.pro, true);
  assert.equal(resolveView("nope"), null);
});
test("query and hash deep links keep song IDs and reject unsafe ones", () => {
  assert.deepEqual(resolveLocation("?studio=songs&song=abc-1"), { screen: "songs", view: "songs", pro: false, song: "abc-1" });
  assert.equal(resolveLocation("?studio=releases&song=x")!.view, "songs");
  assert.equal(resolveLocation("?studio=releases&song=x")!.release, true);
  assert.equal(resolveLocation("?studio=songs&song=<bad>")!.song, undefined);
  assert.equal(resolveLocation("", "#prompt-lab")!.panel, "prompts");
  assert.equal(resolveLocation("", "#studio=world-sounds&section=rhythms")!.view, "rhythm-atlas");
  assert.equal(resolveLocation("?studio=plan-credits&section=credits")!.screen, "plan-credits");
});
test("canonical URLs keep the base path and round-trip", () => {
  const url = studioUrl("/creator", "podcast", "s1");
  assert.equal(url, "/creator?studio=record&section=podcast&song=s1");
  assert.equal(resolveLocation(url.split("?")[1] ? "?" + url.split("?")[1] : "")!.view, "podcast");
  assert.equal(studioUrl("/owner", "recording"), "/owner?studio=record");
  assert.equal(screenOf("promote"), "promote");
  assert.equal(legacyPageRedirect("/credits", "owner"), "/owner?studio=plan-credits&section=credits");
  assert.equal(legacyPageRedirect("/party", "subscriber"), "/creator?studio=explore&section=party");
});
async function setup() {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  return { dom, root: createRoot(document.getElementById("root")!) };
}
test("Simple shows five screens; Pro adds World Sounds, Mix & Edit and Promote; Plan & Credits sits under Settings & Help", async () => {
  const h = await setup(); const opened: string[] = [];
  const props = { activeView: "overview" as const, owner: false, navigate: () => true, openScreen: (s: string) => { opened.push(s); return true; }, settings: () => {}, guide: () => {} };
  await act(async () => h.root.render(<StudioNavigation {...props} beginner/>));
  for (const id of ["create", "songs", "lyric-video", "record", "explore"]) assert(document.querySelector(`[data-testid="nav-${id}"]`), id);
  for (const id of ["world-sounds", "mix-edit", "promote"]) assert.equal(document.querySelector(`[data-testid="nav-${id}"]`), null);
  assert.equal(document.querySelector('[data-testid="nav-plan-credits"]'), null);
  await act(async () => (document.querySelector('[data-testid="toggle-settings-help"]') as HTMLElement).click());
  await act(async () => (document.querySelector('[data-testid="nav-plan-credits"]') as HTMLElement).click());
  assert.deepEqual(opened, ["plan-credits"]);
  await act(async () => h.root.render(<StudioNavigation {...props} beginner={false}/>));
  for (const id of ["world-sounds", "mix-edit", "promote"]) assert(document.querySelector(`[data-testid="nav-${id}"]`), id);
  assert.equal(document.body.textContent!.includes("Moderation"), false);
  await act(async () => h.root.unmount());
});
test("screen sections: World Sounds tabs stay; Create and Record have no tab strip", async () => {
  const h = await setup(); let went = "";
  await act(async () => h.root.render(<ScreenSections activeView="meditative-vibes" beginner navigate={v => { went = v; return true; }}/>));
  await act(async () => (document.querySelector('[data-testid="tab-section-rhythm-atlas"]') as HTMLElement).click());
  assert.equal(went, "rhythm-atlas");
  for (const v of ["overview", "recording"] as const) {
    await act(async () => h.root.render(<ScreenSections activeView={v} beginner={false} navigate={() => true}/>));
    assert.equal(document.querySelector('[data-testid^="tab-section-"]'), null, v);
  }
  await act(async () => h.root.unmount());
});

test("hash deep links keep song IDs in path and key=value forms; legacy pages carry songs to Release", () => {
  assert.equal(resolveLocation("", "#songs/abc-9")!.song, "abc-9");
  assert.equal(resolveLocation("", "#songs/workflow/abc-9")!.song, "abc-9");
  assert.equal(resolveLocation("", "#studio=releases&song=r1")!.song, "r1");
  assert.equal(resolveLocation("", "#studio=releases&song=r1")!.release, true);
  assert.equal(resolveLocation("?recording=r2&studio=songs")!.song, "r2");
  assert.match(legacyPageRedirect("/community/artist-dashboard", "creator", "s-1"), /studio=songs&section=release&song=s-1/);
  assert.match(legacyPageRedirect("/subscriber", "owner"), /^\/owner\?studio=explore/);
});

async function mount(node: React.ReactNode) {
  const h = await setup();
  Object.assign(globalThis, { Event: h.dom.window.Event });
  h.dom.window.scrollTo = () => {};
  globalThis.confirm = () => true;
  await act(async () => h.root.render(node));
  return { div: document.getElementById("root")!, unmount: () => act(() => h.root.unmount()) };
}
const recipe: Template = { id: "r-1", name: "Desert Dawn", description: "Warm oud groove", tags: ["Arabic Pop"], notes: { lyrics: "[Verse]\nSun on the sand", prompt: "Hopeful sunrise", vocals: "warm female", instruments: "oud", cover: "", video: "", promotion: "" } };
const qcBase = { connected: false, saving: false, drafts: [], settings() {}, guided() {}, openDrafts() {}, generateSong: async () => undefined, saveSketch: async () => undefined };

test("Create: recipe picker on top, Custom fold-outs for helpers and vocals, no Logo Creator, seed prefills without submitting", async () => {
  let generated = 0;
  const m = await mount(<QuickCreate {...qcBase} generateSong={async () => { generated++; return undefined; }} recipes={[recipe]} editRecipe={() => {}}
    promptHelpers={() => <p data-testid="prompt-helper">helper</p>} vocalHelpers={() => <p data-testid="vocal-helper">vocal</p>}
    seed={{ id: "s1", panel: "vocals", custom: true }}/>);
  const q = (id: string) => m.div.querySelector(`[data-testid="${id}"]`);
  assert.ok(q("section-recipes"));
  assert.equal(q("button-open-logo"), null);
  assert.ok((q("fold-vocals") as HTMLDetailsElement).open);
  assert.ok(q("prompt-helper") && q("vocal-helper"));
  const select = q("select-recipe") as unknown as HTMLSelectElement;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")!.set!;
  await act(async () => { setter.call(select, "r-1"); select.dispatchEvent(new window.Event("change", { bubbles: true })); });
  await act(async () => void (q("button-use-recipe") as HTMLButtonElement).click());
  assert.equal((q("input-song-title") as HTMLInputElement).value, "Desert Dawn");
  assert.match((q("input-lyrics") as HTMLTextAreaElement).value, /Sun on the sand/);
  assert.equal(generated, 0);
  m.unmount();
  const p = await mount(<QuickCreate {...qcBase} seed={{ id: "p1", panel: "pro" }} proProduction={<form data-testid="engine"><input/></form>}/>);
  const fold = p.div.querySelector('[data-testid="fold-pro-production"]') as HTMLDetailsElement;
  assert.ok(fold.open && !fold.hidden);
  assert.equal(fold.closest("form"), null);
  const engine = p.div.querySelector('[data-testid="engine"]');
  await act(async () => void (p.div.querySelector('[data-testid="tab-mode-simple"]') as HTMLButtonElement).click());
  assert.ok(fold.hidden);
  assert.equal(p.div.querySelector('[data-testid="engine"]'), engine);
  p.unmount();
});

test("Record switch and song steps wire their actions", async () => {
  const went: string[] = [];
  const r = await mount(<RecordSwitch view="recording" beginner={false} capturing={false} navigate={v => { went.push(v); return true; }}/>);
  await act(async () => void (r.div.querySelector('[data-testid="radio-record-podcast"]') as HTMLButtonElement).click());
  await act(async () => void (r.div.querySelector('[data-testid="toggle-vocal-studio"]') as HTMLButtonElement).click());
  assert.deepEqual(went, ["podcast", "vocal-studio"]); r.unmount();
  const locked = await mount(<RecordSwitch view="recording" beginner={false} capturing navigate={() => true}/>);
  assert.ok((locked.div.querySelector('[data-testid="radio-record-podcast"]') as HTMLButtonElement).disabled); locked.unmount();
  const song = { ...freshSong("song-1", "Moon", 0), audioFormat: "mp3" as const };
  const calls: string[] = [];
  const s = await mount(<SongSteps song={song} busy={false} listening={false} listen={() => calls.push("listen")} fix={() => calls.push("fix")} video={() => calls.push("video")} release={() => calls.push("release")}/>);
  for (const id of ["listen", "fix", "video", "release"]) await act(async () => void (s.div.querySelector(`[data-testid="button-${id}-song-1"]`) as HTMLButtonElement).click());
  assert.deepEqual(calls, ["listen", "fix", "video", "release"]); s.unmount();
});

test("Video: six featured vibes apply locally and keep captions and IDs", async () => {
  assert.deepEqual(featuredVibes.map(v => v.name), ["Awaken", "Violet Flame", "Sacred Bloom", "Aurora Silk", "Star Stories", "Neon Skyline"]);
  const start = { cues: [{ time: 1, end: 3, text: "Hello light" }], theme: "cosmic", motion: "drift", format: "vertical" } as unknown as LyricProject;
  let latest = start;
  const m = await mount(<VibeLookPicker project={start} change={next => { latest = next; }}/>);
  await act(async () => void (m.div.querySelector('[data-testid="button-vibe-neon-skyline"]') as HTMLButtonElement).click());
  assert.equal(activeVibe(latest), "neon-skyline");
  assert.deepEqual(latest.cues.map(c => [c.time, c.text]), [[1, "Hello light"]]);
  assert.equal(latest.format, "vertical");
  m.unmount();
});

test("Explore Radio offers one source at a time and /radio maps to the community station", async () => {
  const r = resolveLocation(new URL("https://x" + legacyPageRedirect("/radio", "creator")).search)!;
  assert.equal(r.view, "radio"); assert.equal(r.section, "community-radio");
  const picked: string[] = [];
  const m = await mount(<RadioSourceSwitch value="personal" change={v => picked.push(v)}/>);
  await act(async () => void (m.div.querySelector('[data-testid="radio-source-personal"]') as HTMLButtonElement).click());
  await act(async () => void (m.div.querySelector('[data-testid="radio-source-community"]') as HTMLButtonElement).click());
  assert.deepEqual(picked, ["community"]); m.unmount();
});
