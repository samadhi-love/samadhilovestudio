"use client";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";

import { useState } from "react";
import { ArrowRight, Copy, Globe2 } from "lucide-react";
import { AccentReferences } from "./accent-references";
import { sectionNames, type SectionDirection } from "./song-section-directions";
import { CleanLyricsChecker } from "./clean-lyrics-checker";
import { hasExplicitWords } from "./clean-content";
import { HelpField } from "./help-tip";
import type { CreateSeed } from "./music-workspace-data";

const traditions = [
  { id: "lebanese", name: "Lebanese Arabic", native: "لبناني", lang: "ar-LB", style: "Lebanese Dabke", bpm: 128,
    instruments: "mijwiz, derbakki, oud", groove: "Dabke-inspired stomps and a rising group refrain",
    diction: "Use conversational Beirut Lebanese Arabic and natural word stress.",
    source: "https://ich.unesco.org/es/00379" },
  { id: "khaleeji", name: "Khaleeji Gulf Arabic", native: "خليجي", lang: "ar-KW", style: "Gulf ṣawt-inspired", bpm: 104,
    instruments: "oud, mirwas, violin", groove: "a swaying pulse with space for oud answers",
    diction: "Use Kuwaiti Gulf Arabic unless the song idea specifies a different Gulf dialect.",
    source: "https://qdl.qa/en/cradle-arabic-sawt-music-early-musician-generations-kuwait" },
  { id: "egyptian", name: "Egyptian Arabic", native: "مصري", lang: "ar-EG", style: "Egyptian baladi-inspired", bpm: 112,
    instruments: "tabla, riq, accordion", groove: "a baladi-inspired groove with drum and accordion exchanges",
    diction: "Use conversational Cairene Egyptian Arabic with natural vowels and stress.",
    source: "https://africanmusiclibrary.org/blog/baladi-music-in-egypt" },
  { id: "turkish", name: "Turkish", native: "Türkçe", lang: "tr", style: "Anatolian folk-inspired", bpm: 116,
    instruments: "bağlama, davul, ney", groove: "plucked bağlama phrases over a lively folk-inspired groove",
    diction: "Use natural Turkish stress and keep ı, i, ö, and ü distinct.",
    source: "https://www.ktb.gov.tr/EN-98662/baglama.html" },
  { id: "russian", name: "Russian", native: "Русский", lang: "ru", style: "Russian folk-pop", bpm: 108,
    instruments: "balalaika, bayan, strings", groove: "a plucked folk motif that builds into a broad refrain",
    diction: "Use natural Russian word stress. Keep supplied Cyrillic lyrics as written.",
    source: "https://sites.duke.edu/dumic/instruments/strings/east-europe-and-north-asia/balalaika/" },
] as const;

type TraditionId = typeof traditions[number]["id"];
const sections = ["Verse 1", "Verse 2", "Bridge", "Finale"];
const production = ["Melodic House", "Acoustic Folk", "R&B", "Clean Hip-Hop", "Cinematic Pop", "Traditional-inspired", "Lebanese Dabke", "Egyptian Baladi", "Gulf Pop", "Anatolian Folk", "Russian Folk-Pop"] as const;
const vocals = {
  solo: "One lead vocalist with a clear, memorable hook.",
  duet: "Deep male and soaring female leads trade lines and sing the final hook together.",
  response: "A lead vocalist sings each call and a small group sings the response.",
};

export function InternationalMusicTent({ active, send, copy, openVocalStudio }: {
  active: boolean;
  send: (seed: CreateSeed) => void;
  copy: (prompt: string) => Promise<void>;
  openVocalStudio: () => void;
}) {
  const [selection, setSelection] = useState<TraditionId[]>(["lebanese"]);
  const [crossover, setCrossover] = useState(false);
  const [style, setStyle] = useState<typeof production[number]>("Melodic House");
  const [multiGenre, setMultiGenre] = useState(false);
  const [genres, setGenres] = useState<Partial<Record<typeof sectionNames[number], typeof production[number]>>>({ "Verse 1": "Acoustic Folk", "Verse 2": "R&B" });
  const [accent, setAccent] = useState<TraditionId>("lebanese");
  const [pronunciation, setPronunciation] = useState<Partial<Record<TraditionId, string>>>({});
  const [voice, setVoice] = useState<keyof typeof vocals>("duet");
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [lyrics, setLyrics] = useState("");
  const recovery = useDraftRecovery("world-music", { selection, crossover, style, multiGenre, genres, accent, pronunciation, voice, title, idea, lyrics }, value => { setSelection(value.selection); setCrossover(value.crossover); setStyle(value.style); setMultiGenre(value.multiGenre); setGenres(value.genres); setAccent(value.accent); setPronunciation(value.pronunciation); setVoice(value.voice); setTitle(value.title); setIdea(value.idea); setLyrics(value.lyrics);  }, true);
  const selected = selection.map(id => traditions.find(item => item.id === id)!);
  const lead = selected[0];
  const blocked = hasExplicitWords(title, idea, lyrics, ...selected.map(item => pronunciation[item.id]));
  const accentId = selection.includes(accent) ? accent : lead.id;
  const accentName = selected.find(item => item.id === accentId)!.name;
  const voiceDirection = (item: typeof lead) => [item.diction, pronunciation[item.id]?.trim()].filter(Boolean).join(" ");
  const changes = multiGenre ? sectionNames.filter(section => genres[section] && genres[section] !== style) : [];
  const sectionDirections: SectionDirection[] | undefined = changes.length ? sectionNames.filter(section =>
    section === "Verse 1" || section === "Chorus" || changes.includes(section) || sections.slice(0, selected.length).includes(section)
  ).map(name => {
    const item = selected[sections.indexOf(name)] ?? lead;
    return { name, genre: genres[name] ?? style, instruments: item.instruments, voice: voiceDirection(item) };
  }) : undefined;
  const arrangement = selected.length > 1
    ? selected.map((item, i) => `${sections[i]} in ${item.name} with ${item.instruments}`).join(". ") +
      `. Use ${lead.name} for the main hook. Let each section keep its own pronunciation and share one melodic motif.`
    : `Build around ${lead.style}, ${lead.groove}, and ${lead.instruments}.`;
  const vocal = [vocals[voice], ...selected.map((item, i) => selected.length === 1 ? voiceDirection(item)
    : (i === 0 ? "Verse 1 and main hook. " : sections[i] + ". ") + voiceDirection(item))].join(" ");
  const prompt = [
    `Original, uplifting ${style} at ${lead.bpm} BPM. ${idea.trim() || "Celebrate connection across cultures."}`,
    arrangement,
    sectionDirections ? "Use the specified section headings: " + sectionDirections.map(item => "[" + item.name + "] " + item.genre).join(", ") +
      ". Keep one tempo and recurring melody through the changes." : undefined,
    sectionDirections ? vocals[voice] : vocal,
  ].filter(Boolean).join("\n");
  const fallbackTitle = selected.length > 1 ? "One Heart Across Borders" : lead.name + " · New Song";

  function choose(id: TraditionId) {
    if (!crossover) { setSelection([id]); return; }
    if (selection.includes(id)) {
      if (selection.length > 1) setSelection(selection.filter(item => item !== id));
      return;
    }
    if (selection.length < 4) setSelection([...selection, id]);
  }

  return <div hidden={!active} className="music-tools music-tent"><RecoveryPanel recovery={recovery}/>
    <header className="create-banner tent-banner">
      <p className="eyebrow"><Globe2 size={16}/> SAMADHI LOVE · WORLD MUSIC</p>
      <h1>International Music Tent</h1>
      <p>Choose a language and musical tradition, or bring several together in one original song.</p>
    </header>

    <section className="panel form-panel" aria-labelledby="tent-traditions">
      <div className="section-head">
        <h2 id="tent-traditions">Choose your traditions</h2>
        <div className="chips" role="group" aria-label="Tradition selection mode">
          <button type="button" className={crossover ? "chip" : "chip active"} aria-pressed={!crossover}
            onClick={() => { setCrossover(false); setSelection([lead.id]); }}>Single tradition</button>
          <button type="button" className={crossover ? "chip active" : "chip"} aria-pressed={crossover}
            onClick={() => setCrossover(true)}>Crossover</button>
        </div>
      </div>
      <p className="muted">{crossover ? "Pick up to four in the order you want to hear them. The first leads the chorus. Tap a selected card to remove it." : "Pick one to set the language, suggested instruments, and vocal direction."}</p>
      <div className="tent-options">{traditions.map(item => {
        const order = selection.indexOf(item.id);
        return <button key={item.id} type="button" className="tent-option" aria-pressed={order >= 0}
          disabled={crossover && selection.length === 4 && order < 0} onClick={() => choose(item.id)}>
          <span className="tent-native" lang={item.lang} dir="auto">{item.native}</span>
          <strong>{item.name}</strong>
          <small>{item.style}</small>
          <small>{item.instruments}</small>
          {order >= 0 && <span className="tent-order">{order === 0 ? "Lead tradition" : "Part " + (order + 1)}</span>}
        </button>;
      })}</div>
      <p className="muted tent-references">Explore the traditions
        {selected.map(item => <a href={item.source} key={item.id} target="_blank" rel="noreferrer">{item.name} ↗</a>)}
      </p>
    </section>

    <div className="create-layout">
      <section className="panel form-panel" aria-labelledby="tent-song">
        <h2 id="tent-song">Shape the song</h2>
        <div className="field-grid">
          <HelpField label="Production style" tip="Set the overall arrangement while keeping the selected traditions and their vocal direction.">
            <select value={style} onChange={event => setStyle(event.target.value as typeof style)}>
              {production.map(item => <option key={item}>{item}</option>)}
            </select>
          </HelpField>
          <HelpField label="Vocal arrangement" tip="Choose one singer, a male and female duet, or a group response.">
            <select value={voice} onChange={event => setVoice(event.target.value as typeof voice)}>
              <option value="solo">Solo lead</option><option value="duet">Male and female duet</option><option value="response">Call and response</option>
            </select>
          </HelpField>
        </div>
        <label className="checkline"><input type="checkbox" checked={multiGenre} onChange={event => setMultiGenre(event.target.checked)}/> Change genres within one song</label>
        {multiGenre && <div className="version-preview">
          <p className="muted">Pick a genre for each part. The production style above is the default.</p>
          <div className="field-grid">{sectionNames.map(section => <HelpField key={section} label={section + " genre"} tip="Choose a production style for this section of the same track.">
            <select value={genres[section] ?? ""} onChange={event => {
              const genre = production.find(item => item === event.target.value);
              setGenres(current => ({ ...current, [section]: genre }));
            }}>
              <option value="">Use production style</option>{production.map(item => <option key={item}>{item}</option>)}
            </select>
          </HelpField>)}</div>
          {sectionDirections && <p className="muted">For your own lyrics, put each section on its own heading line. Use {sectionDirections.map(item => "[" + item.name + "]").join(", ")}.</p>}
        </div>}
        <label className="field">Track title<input value={title} maxLength={100} placeholder={fallbackTitle} onChange={event => setTitle(event.target.value)}/></label>
        <label className="field">Song idea<textarea rows={2} maxLength={160} value={idea} onChange={event => setIdea(event.target.value)}
          placeholder="A song about finding our way home through love"/></label>
        <HelpField label="Your lyrics (optional)" tip="Paste your words in Arabic, Turkish, or Cyrillic as written. You can continue editing in Create.">
          <textarea dir="auto" rows={5} maxLength={5000} value={lyrics} onChange={event => setLyrics(event.target.value)}/>
        </HelpField>
        <CleanLyricsChecker lyrics={lyrics} change={setLyrics}/>
        {selected.length > 1 && <HelpField label="Reference accent" tip="Choose which of your traditions to listen to or add pronunciation notes for.">
          <select value={accentId} onChange={event => setAccent(event.target.value as TraditionId)}>{selected.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
        </HelpField>}
        <AccentReferences id={accentId} name={accentName} notes={pronunciation[accentId] ?? ""} update={value => setPronunciation(current => ({ ...current, [accentId]: value }))}
          openVocalStudio={openVocalStudio} active={active}/>
      </section>
      <section className="panel form-panel" aria-labelledby="tent-brief">
        <h2 id="tent-brief">Song brief</h2>
        <pre className="tent-prompt">{prompt}</pre>
        {sectionDirections && <ul>{sectionDirections.map(item => <li key={item.name}><strong>{item.name}</strong> · {item.genre} with {item.instruments}. {item.voice}</li>)}</ul>}
        <p className="muted">These choices guide the music provider. Review the pronunciation before using a generated take.</p>
        {blocked && <p className="notice" role="alert">Review the title, song idea, and lyrics for clean wording before continuing.</p>}
        <div className="actions">
          <button type="button" className="primary" disabled={blocked}
            onClick={() => send({ title: title.trim() || fallbackTitle, idea: prompt, vocal: sectionDirections ? vocals[voice] : vocal,
              bpm: String(lead.bpm), lyrics, instrumental: false, sectionDirections })}>
            Open in Create <ArrowRight size={16}/>
          </button>
          <button type="button" className="secondary" disabled={blocked} onClick={() => copy([prompt, ...(sectionDirections ?? []).map(item => item.name + " · " + item.genre + " with " + item.instruments + ". " + item.voice)].join("\n"))}><Copy size={16}/> Copy brief</button>
        </div>
      </section>
    </div>
  </div>;
}
