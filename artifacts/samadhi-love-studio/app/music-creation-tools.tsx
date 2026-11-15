"use client";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";

import { useState } from "react";
import { FlaskConical, Mic } from "lucide-react";
import { HelpControl, HelpField } from "./help-tip";
import { cleanWordsMessage, hasExplicitWords } from "./clean-content";
import { CleanLyricsChecker } from "./clean-lyrics-checker";
import { musicCatalog, promptTemplates } from "./music-catalog";
import { languageChoices, moodChoices, productionChoices, vocalChoices } from "./music-dna";
import type { CreateSeed, Discovery } from "./music-workspace-data";

function ToolTitle({ mode }: { mode: "prompt" | "vocal" }) {
  const [title, sub, Icon] = mode === "prompt" ? ["Creative Prompt Lab", "Build, compare, and save production directions for your next song.", FlaskConical] as const :
    ["Vocal Director", "Plan how each voice enters, answers, and supports the lead.", Mic] as const;
  return <header className="page-title"><div className="page-title-copy"><p className="eyebrow">SAMADHI LOVE · CREATE</p><h1><Icon size={26}/> {title}</h1><p>{sub}</p></div></header>;
}

const genres = musicCatalog.filter(item => item.kind === "Genre").map(item => item.name);
const instruments = musicCatalog.filter(item => item.kind === "Instrument").map(item => item.name);
const rhythms = musicCatalog.filter(item => item.kind === "Rhythm").map(item => item.name);

export function PromptLab({ seed, data, saving, save, copy, send }: {
  seed: CreateSeed | null; data: Discovery; saving: boolean; save: (value: Discovery) => Promise<boolean>;
  copy: (value: string) => void; send: (value: CreateSeed) => void;
}) {
  const [text, setText] = useState(seed?.idea ?? "");
  const [name, setName] = useState(seed?.title ?? "");
  const [parts, setParts] = useState({ genre: "", fusion: "", instrument: "", rhythm: "", mood: "", vocal: "", language: "", effect: "" });
  const [savedOnly, setSavedOnly] = useState(false);
  const [comparison, setComparison] = useState<{ title: string; text: string } | null>(null);
  const [variant, setVariant] = useState(0);
  const recovery = useDraftRecovery(`prompt:${seed?.title ?? "new"}:${seed?.idea ?? ""}`, { text, name, parts, comparison, variant }, value => { setText(value.text); setName(value.name); setParts(value.parts); setComparison(value.comparison); setVariant(value.variant); }, !!text.trim());
  const fields: { id: keyof typeof parts; label: string; list: readonly string[]; tip: string }[] = [
    { id: "genre", label: "Main genre", list: genres, tip: "The musical style that leads the track." },
    { id: "fusion", label: "Fusion genre", list: genres, tip: "A second genre that can contribute its rhythm or instrumentation." },
    { id: "instrument", label: "Lead instrument", list: instruments, tip: "The main sound that carries the tune or a repeating phrase." },
    { id: "rhythm", label: "Rhythm", list: rhythms, tip: "A repeating pattern of accents underneath the melody." },
    { id: "mood", label: "Mood", list: moodChoices, tip: "The feeling that should come through in the performance." },
    { id: "vocal", label: "Vocal style", list: vocalChoices, tip: "Who sings and how they deliver the words. These are directions for the generator." },
    { id: "language", label: "Language", list: languageChoices, tip: "The language of the lyrics. Pronunciation can vary by provider." },
    { id: "effect", label: "Production effect", list: productionChoices, tip: "The treatment applied to the sound. Look up individual effects in the Music Library." },
  ];
  const genre = [parts.genre, parts.fusion].filter(Boolean).join(" × ");
  const added = [genre && "Style: " + genre, parts.instrument && "Lead sound: " + parts.instrument,
    parts.rhythm && "Rhythmic pattern: " + parts.rhythm, parts.mood && "Mood: " + parts.mood,
    parts.vocal && "Vocal delivery: " + parts.vocal, parts.language && "Lyric language: " + parts.language,
    parts.effect && "Sound treatment: " + parts.effect].filter(Boolean).map(part => part + ".").join("\n");
  const improvement = "Introduce a memorable motif, give the chorus more space, and use the bridge to change the texture. Keep the words uplifting and family-friendly.";
  const variations = [
    "Open on a single instrument, then let the vocal enter without drums. Bring the full rhythm in at the first chorus.",
    "Lead with percussion and a repeating motif. Answer the main phrase with a contrasting sound in the second verse.",
    "Save the widest harmonies for the last chorus. Close on one quiet statement of the motif.",
  ];
  const canUse = !!text.trim() && !hasExplicitWords(text, name) && text.length <= 1000;
  const append = (value: string) => setText(current => [current.trim(), value].filter(Boolean).join("\n"));
  const possible = genres.length * (genres.length - 1) * instruments.length * rhythms.length * moodChoices.length * vocalChoices.length * languageChoices.length * productionChoices.length;
  return <div className="music-tools"><ToolTitle mode="prompt"/><RecoveryPanel recovery={recovery}/>
    <section className="section"><h2>Build an arrangement prompt</h2><p className="section-sub">{possible.toLocaleString()} possible combinations when you select one option in every field.</p>
      <div className="music-fields">{fields.map(field => <HelpField key={field.id} label={field.label} tip={field.tip}><select value={parts[field.id]} onChange={event => setParts({ ...parts, [field.id]: event.target.value })}><option value="">Choose an option</option>{field.list.filter(item => field.id !== "fusion" || item !== parts.genre).map(item => <option key={item}>{item}</option>)}</select></HelpField>)}</div>
      <div className="actions">
        <button type="button" className="secondary small" disabled={!added || text.length + added.length + 1 > 1000} onClick={() => append(added)}>Add selections to prompt</button>
        <HelpField label="Load a template" tip="Load a ready-to-edit example. Copy any text you want to keep before replacing the editor."><select value="" onChange={event => { const selected = promptTemplates[Number(event.target.value)]; if (selected && (!text.trim() || confirm("Replace the current prompt with this template?"))) { setName(selected.name); setText(selected.text); } }}><option value="">Choose a template</option>{promptTemplates.map((template, index) => <option key={template.name} value={index}>{template.name}</option>)}</select></HelpField>
      </div>
    </section>
    <section className="section">
      <HelpField label="Prompt title" tip="Use a short title you can recognize when reopening the prompt or creating the track."><input maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Untitled prompt"/></HelpField>
      <HelpField label="Editable prompt" tip="Put the most important instructions first. Include the rhythm, main sound, and feeling you want."><textarea rows={8} value={text} onChange={event => setText(event.target.value)} maxLength={1200}/></HelpField>
      <CleanLyricsChecker lyrics={text} change={setText} direction label="Clean production direction"/>
      {hasExplicitWords(name) && <p className="notice">{cleanWordsMessage}</p>}
      <p className="muted">{text.length.toLocaleString()} / 1,000 characters for Create</p>
      <div className="actions">
        <HelpControl subject="Improve prompt" tip="Add practical advice about a motif, chorus, and bridge."><button type="button" className="secondary small" disabled={!canUse || text.includes(improvement) || text.length + improvement.length + 1 > 1000} onClick={() => append(improvement)}>Improve prompt</button></HelpControl>
        <HelpControl subject="Compare variation" tip="Show an alternate arrangement alongside your current prompt. Choose it explicitly to update the editor."><button type="button" className="secondary small" disabled={!canUse || text.length + Math.max(...variations.map(item => item.length)) + 1 > 1000} onClick={() => { setComparison({ title: "Arrangement variation " + (variant + 1), text: text + "\n" + variations[variant] }); setVariant((variant + 1) % variations.length); }}>Compare variation</button></HelpControl>
        <button type="button" className="secondary small" disabled={!canUse} onClick={() => copy(text)}>Copy prompt</button>
        <button type="button" className="secondary small" disabled={!canUse || saving || data.prompts.length >= 60} onClick={() => void save({ ...data, prompts: [{ id: crypto.randomUUID(), title: name.trim() || "Untitled prompt", text, favorite: false }, ...data.prompts] })}>Save prompt</button>
        <button type="button" className="primary small" disabled={!canUse} onClick={() => send({ ...seed, title: name.trim(), idea: text, vocal: [parts.vocal, seed?.vocal].filter(Boolean).join(". ") })}>Continue to Create</button>
      </div>
    </section>
    {comparison && <section className="section"><h2>Compare prompts</h2><div className="music-grid">
      <div className="version-preview"><h3>Current editor</h3><pre>{text}</pre></div>
      <div className="version-preview"><h3>{comparison.title}</h3><pre>{comparison.text}</pre>
        <button type="button" className="secondary small" onClick={() => { setText(comparison.text); setComparison(null); }}>Use this prompt</button></div>
    </div></section>}
    <section className="section"><h2>Saved prompts</h2><label className="music-inline"><input type="checkbox" checked={savedOnly} onChange={event => setSavedOnly(event.target.checked)}/> Favorites only</label>
      <div className="music-grid">{data.prompts.filter(item => !savedOnly || item.favorite).map(item => <article className="music-card version-preview" key={item.id}>
        <h3>{item.title}</h3><pre>{item.text}</pre><div className="actions">
          <button className="secondary small" onClick={() => { if (!text.trim() || confirm("Replace the current prompt with this saved prompt?")) { setName(item.title); setText(item.text); } }}>Open</button>
          <button className="secondary small" onClick={() => setComparison(item)}>Compare</button>
          <button className="secondary small" aria-pressed={item.favorite} disabled={saving} onClick={() => void save({ ...data, prompts: data.prompts.map(prompt => prompt.id === item.id ? { ...prompt, favorite: !prompt.favorite } : prompt) })}>{item.favorite ? "Favorited" : "Favorite"}</button>
          <button className="text-button" disabled={saving} onClick={() => { if (confirm("Remove this saved prompt?")) void save({ ...data, prompts: data.prompts.filter(prompt => prompt.id !== item.id) }); }}>Remove</button>
        </div></article>)}</div>
      {!data.prompts.some(item => !savedOnly || item.favorite) && <p className="muted">Save a prompt to build your collection.</p>}
    </section>
  </div>;
}

export function VocalDirector({ ready, connect, copy, send }: {
  ready: boolean; connect: () => void; copy: (value: string) => void; send: (value: CreateSeed) => void;
}) {
  const [lead, setLead] = useState("Male and female duet");
  const [language, setLanguage] = useState("English");
  const [mood, setMood] = useState("Uplifting");
  const [layers, setLayers] = useState<string[]>([]);
  const [pronunciation, setPronunciation] = useState("");
  const recovery = useDraftRecovery("vocal-direction", { lead, language, mood, layers, pronunciation }, value => { setLead(value.lead); setLanguage(value.language); setMood(value.mood); setLayers(value.layers); setPronunciation(value.pronunciation); });
  const direction = [
    `${lead}. Sing in ${language} with a ${mood.toLowerCase()} delivery.`,
    lead.includes("duet") && "Let the male lead open the first verse and the female lead answer. Bring both leads together for the chorus.",
    layers.length > 0 && `Performance cues: ${layers.join(", ")}.`,
    pronunciation.trim() && `Pronunciation guidance: ${pronunciation.trim()}.`,
  ].filter(Boolean).join(" ");
  return <div className="music-tools"><ToolTitle mode="vocal"/><RecoveryPanel recovery={recovery}/>
    <section className="section"><h2>Performance directions</h2>
      <p className="section-sub">Plan the delivery here. ElevenLabs Music accepts written performance cues. Exact singer assignment, language pronunciation, and individual vocal layers depend on the generated take.</p>
      {!ready && <p className="guide-tip">Connect ElevenLabs before sending these directions to track creation. <button type="button" className="text-button" onClick={connect}>Open AI Music Providers</button></p>}
      <div className="music-fields">
        <HelpField label="Lead vocals" tip="Choose one lead voice or describe a duet with alternating parts."><select value={lead} onChange={event => setLead(event.target.value)}>{vocalChoices.slice(0, 3).map(value => <option key={value}>{value}</option>)}</select></HelpField>
        <HelpField label="Language" tip="Add the language you want the lead to sing. For multilingual lyrics, mark each section in your draft."><select value={language} onChange={event => setLanguage(event.target.value)}>{languageChoices.map(value => <option key={value}>{value}</option>)}</select></HelpField>
        <HelpField label="Vocal emotion" tip="Describe the feeling you want the singer to convey."><select value={mood} onChange={event => setMood(event.target.value)}>{moodChoices.map(value => <option key={value}>{value}</option>)}</select></HelpField>
        <HelpField label="Pronunciation guidance" tip="Spell an unfamiliar word phonetically and mark its stressed syllable. Review the result before release."><input maxLength={180} value={pronunciation} onChange={event => setPronunciation(event.target.value)} placeholder="e.g. Samadhi: suh-MAH-dee"/></HelpField>
      </div>
      <div className="chips">{vocalChoices.slice(3).map(value => <button type="button" key={value} className={`chip ${layers.includes(value) ? "active" : ""}`} aria-pressed={layers.includes(value)} onClick={() => setLayers(layers.includes(value) ? layers.filter(item => item !== value) : [...layers, value])}>{value}</button>)}</div>
      <div className="version-preview"><pre>{direction}</pre></div>
      {hasExplicitWords(direction) && <p className="notice" role="alert">{cleanWordsMessage}</p>}
      <div className="actions">
        <button type="button" className="secondary small" disabled={hasExplicitWords(direction)} onClick={() => copy(direction)}>Copy vocal directions</button>
        <button type="button" className="primary small" disabled={!ready || hasExplicitWords(direction)} onClick={() => send({ idea: "An uplifting original song with expressive vocals, clear phrasing, and a memorable hook.", vocal: direction, instrumental: false })}>Use in Create</button>
      </div>
    </section>
  </div>;
}
