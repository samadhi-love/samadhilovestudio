/** Central compatibility resolver: every legacy view ID, query/hash deep link and page URL
 * resolves to one of the consolidated screens and the internal subsection that renders it. */
export const screens = ["create", "world-sounds", "record", "mix-edit", "songs", "promote", "explore", "plan-credits", "lyric-video"] as const;
export type Screen = typeof screens[number];

/** Internal subsection views (engine-owning). Legacy IDs are preserved as subsections. */
export const sectionViews = [
  "overview", "create", "prompt-lab", "vocal-director", "templates",
  "music-library", "rhythm-atlas", "international-tent", "meditative-vibes",
  "recording", "podcast", "vocal-studio", "my-voices",
  "multitrack", "compare",
  "songs", "workflow", "releases", "distribution",
  "promote", "radio", "lyric-video",
] as const;
export type SectionView = typeof sectionViews[number];

export type Subsection = { view: SectionView; label: string; pro?: boolean };
/** Visible browse tabs per screen (Create, Record and My Songs use their own controls instead of tabs). */
export const screenSections: Record<Screen, Subsection[]> = {
  create: [],
  "world-sounds": [
    { view: "music-library", label: "Library" },
    { view: "rhythm-atlas", label: "Rhythms" },
    { view: "international-tent", label: "International" },
    { view: "meditative-vibes", label: "Meditative" },
  ],
  record: [],
  "mix-edit": [{ view: "multitrack", label: "Timeline" }, { view: "compare", label: "Compare mixes" }],
  songs: [{ view: "songs", label: "All songs" }, { view: "workflow", label: "Song steps board" }],
  promote: [], explore: [], "plan-credits": [], "lyric-video": [],
};
const sectionScreen: Record<SectionView, Screen> = {
  overview: "create", create: "create", "prompt-lab": "create", "vocal-director": "create", templates: "create",
  "music-library": "world-sounds", "rhythm-atlas": "world-sounds", "international-tent": "world-sounds", "meditative-vibes": "world-sounds",
  recording: "record", podcast: "record", "vocal-studio": "record", "my-voices": "record", multitrack: "mix-edit", compare: "mix-edit",
  songs: "songs", workflow: "songs", releases: "songs", distribution: "songs", promote: "promote", radio: "explore", "lyric-video": "lyric-video",
};
/** Which screen a subsection belongs to. */
export function screenOf(view: SectionView): Screen { return sectionScreen[view] ?? "create"; }
export const screenHome: Record<Screen, SectionView> = {
  create: "overview", "world-sounds": "music-library", record: "recording", "mix-edit": "multitrack",
  songs: "songs", promote: "promote", explore: "radio", "plan-credits": "songs", "lyric-video": "lyric-video",
};
/** Screens that only appear when Pro tools are on (still reachable via links). */
export const proScreens: Screen[] = ["world-sounds", "mix-edit", "promote"];
const proViews: SectionView[] = ["vocal-studio"];

/** Legacy helper views now open inside Create (Custom fold-outs / recipe picker); release views open the song Release step. */
export const createPanels: Partial<Record<SectionView, "prompts" | "vocals" | "recipes" | "pro">> = { create: "pro", "prompt-lab": "prompts", "vocal-director": "vocals", templates: "recipes" };

const sectionAliases: Record<string, SectionView> = {
  library: "music-library", atlas: "rhythm-atlas", rhythms: "rhythm-atlas", international: "international-tent", tent: "international-tent",
  meditation: "meditative-vibes", meditative: "meditative-vibes", voice: "recording", recipes: "templates", vocals: "vocal-director",
  prompts: "prompt-lab", timeline: "multitrack", "mix-lab": "compare", release: "releases", export: "distribution", steps: "workflow",
  detailed: "create", "artist-dashboard": "songs", voices: "my-voices", "my-voice": "my-voices",
};

export type Resolved = { screen: Screen; view: SectionView; legacy?: SectionView; panel?: "prompts" | "vocals" | "recipes" | "pro"; release?: boolean; external?: string; section?: string; song?: string; pro: boolean };
const idOk = (v: string | null | undefined) => !!v && /^[\w-]{1,100}$/.test(v);
function finish(legacy: SectionView, extra: Partial<Resolved> = {}): Resolved {
  const screen = screenOf(legacy);
  const panel = createPanels[legacy];
  const release = legacy === "releases" || legacy === "distribution";
  const view: SectionView = panel ? "overview" : release ? "songs" : legacy;
  return { screen, view, ...(legacy !== view ? { legacy } : {}), ...(panel ? { panel } : {}), ...(release ? { release } : {}), pro: proScreens.includes(screen) || proViews.includes(view), ...extra };
}

/** Resolve a legacy view ID, a canonical screen ID, or a screen + section pair. */
export function resolveView(id: string | null | undefined, section?: string | null): Resolved | null {
  if (!id) return null;
  const sec = section ? (sectionViews as readonly string[]).includes(section) ? section as SectionView : sectionAliases[section] : undefined;
  if ((screens as readonly string[]).includes(id)) {
    const screen = id as Screen;
    const view = sec && screenOf(sec) === screen ? sec : screenHome[screen];
    return { ...finish(view), screen, ...(section ? { section } : {}) };
  }
  if ((sectionViews as readonly string[]).includes(id)) return finish(id as SectionView);
  if (sectionAliases[id]) return resolveView(sectionAliases[id]);
  return null;
}

/** Old direct page URLs that moved into the studio (public pages stay reachable for their audience). */
export const legacyPages: Record<string, { screen: Screen; section: string }> = {
  "/members": { screen: "plan-credits", section: "membership" },
  "/plans": { screen: "plan-credits", section: "plans" },
  "/credits": { screen: "plan-credits", section: "credits" },
  "/party": { screen: "explore", section: "party" },
  "/community": { screen: "explore", section: "discover" },
  "/subscriber": { screen: "explore", section: "listening-room" },
  "/radio": { screen: "explore", section: "community-radio" },
  "/community/artist-dashboard": { screen: "songs", section: "artist-dashboard" },
};

/** Resolve the full initial URL: ?studio=&section=&song=, #hash deep links (#prompt-lab, #studio=templates). */
export function resolveLocation(search: string, hash = ""): Resolved | null {
  const params = new URLSearchParams(search);
  let song = params.get("song") ?? params.get("recording");
  let target = params.get("studio") ?? params.get("view"), section = params.get("section");
  if (!target && hash) {
    const raw = hash.replace(/^#/, "");
    const hp = new URLSearchParams(raw.includes("=") ? raw : "");
    target = raw.includes("=") ? hp.get("studio") ?? hp.get("view") : raw.split("/")[0];
    section = raw.includes("=") ? hp.get("section") : raw.split("/")[1] ?? null;
    song = song ?? (raw.includes("=") ? hp.get("song") ?? hp.get("recording") : raw.split("/")[2] ?? null);
    // "#songs/<id>" form: a second segment that is not a known section is the song ID.
    if (!raw.includes("=") && section && !song && !(sectionViews as readonly string[]).includes(section) && !sectionAliases[section]) { song = section; section = null; }
  }
  const resolved = resolveView(target, section);
  if (!resolved) return null;
  return { ...resolved, ...(idOk(song) ? { song: song! } : {}) };
}

/** Canonical studio URL for a subsection, preserving the base path and song ID. */
export function studioUrl(pathname: string, view: SectionView, song?: string, extra?: string) {
  const screen = screenOf(view), params = new URLSearchParams();
  params.set("studio", screen);
  if (view !== screenHome[screen] || extra) params.set("section", extra ?? view);
  if (idOk(song)) params.set("song", song!);
  return `${pathname}?${params.toString()}`;
}

/** Studio home for a signed-in private workspace (used by old page redirects; studio pages never redirect back). */
export function studioHomeFor(role: string) { return role === "owner" ? "/owner" : "/creator"; }
export function legacyPageRedirect(path: keyof typeof legacyPages, role: string, song?: string) {
  const target = legacyPages[path];
  const songPart = idOk(song) ? `&song=${encodeURIComponent(song!)}` : "";
  return `${studioHomeFor(role)}?studio=${target.screen}&section=${songPart ? "release" : target.section}${songPart}`;
}
