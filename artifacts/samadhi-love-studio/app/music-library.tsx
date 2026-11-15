"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Globe2, Play, Square, Star } from "lucide-react";
import { HelpControl, HelpField } from "./help-tip";
import { genreSearchKey } from "./music-genres";
import { musicCatalog, promptTemplates, type CatalogEntry } from "./music-catalog";
import type { Discovery } from "./music-workspace-data";

const categories = ["All", "Genre", "Instrument", "Rhythm", "Vocal", "Technique", "Mood"];
const moods = [...new Set(musicCatalog.flatMap(entry => entry.moods ?? []))].sort();
const languages = [...new Set(musicCatalog.flatMap(entry => entry.languages ?? []))].sort();
const vocals = [...new Set(musicCatalog.flatMap(entry => entry.vocals ?? []))].sort();

function auditionLoop(context: AudioContext, rhythm: NonNullable<CatalogEntry["rhythm"]>, tempo: number) {
  const subdivision = (60 / tempo) * rhythm.beats / rhythm.pulse.length;
  const first = context.currentTime + 0.04;
  for (let cycle = 0; cycle < 2; cycle++) {
    [...rhythm.pulse].forEach((hit, step) => {
      if (hit === ".") return;
      const at = first + (cycle * rhythm.pulse.length + step) * subdivision;
      const tone = context.createOscillator();
      const envelope = context.createGain();
      const low = hit.toLowerCase() === "d";
      tone.type = low ? "sine" : "triangle";
      tone.frequency.setValueAtTime(low ? 130 : 1050, at);
      tone.frequency.exponentialRampToValueAtTime(low ? 55 : 380, at + 0.05);
      envelope.gain.setValueAtTime(hit === "d" ? 0.1 : low ? 0.24 : 0.085, at);
      envelope.gain.exponentialRampToValueAtTime(0.001, at + (low ? 0.14 : 0.06));
      tone.connect(envelope).connect(context.destination);
      tone.start(at);
      tone.stop(at + 0.16);
    });
  }
  return 1000 * (2 * rhythm.beats * 60 / tempo + 0.2);
}

export function MusicLibrary({ atlas, data, saving, save, openPrompt }: {
  atlas: boolean; data: Discovery; saving: boolean;
  save: (value: Discovery) => Promise<boolean>; openPrompt: (prompt: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(60);
  const [renameName,setRenameName]=useState("");
  const [removedCollection,setRemovedCollection]=useState<Discovery["collections"][number]|null>(null);
  const changingCollection=useRef(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [country, setCountry] = useState("");
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("");
  const [vocal, setVocal] = useState("");
  const [bpm, setBpm] = useState("");
  const [filter, setFilter] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const creatingCollection = useRef(false);
  const [collectionName, setCollectionName] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [rhythmId, setRhythmId] = useState("");
  const [previewTempo, setPreviewTempo] = useState("");
  const [playing, setPlaying] = useState("");
  const [previewError, setPreviewError] = useState("");
  const playback = useRef<{ context: AudioContext; timer?: number } | null>(null);
  const stop = () => {
    if (!playback.current) return;
    window.clearTimeout(playback.current.timer);
    void playback.current.context.close().catch(() => {});
    playback.current = null;
  };
  useEffect(() => stop, []);
  const collection = data.collections.find(item => item.id === filter);
  const filtered = musicCatalog.filter(entry => {
    const beats = entry.bpm ?? (entry.rhythm ? [entry.rhythm.bpm - 12, entry.rhythm.bpm + 12] : undefined);
    const searchable = [entry.name, entry.id, entry.kind, entry.family, entry.region, entry.description, entry.combine,
      ...entry.languages ?? [], ...entry.moods ?? [], ...entry.vocals ?? [], entry.rhythm?.meter].filter(Boolean).join(" ");
    return (atlas ? entry.kind === "Rhythm" : category === "All" || entry.kind === category) &&
      query.trim().split(/\s+/).map(genreSearchKey).every(token => genreSearchKey(searchable).includes(token)) &&
      genreSearchKey(entry.region).includes(genreSearchKey(country)) &&
      (!mood || entry.name === mood || entry.moods?.includes(mood)) && (!language || entry.languages?.includes(language)) &&
      (!vocal || entry.vocals?.includes(vocal)) && (!bpm || beats && +bpm >= beats[0] && +bpm <= beats[1]) &&
      (!filter || (filter === "favorites" ? data.favorites : collection?.entries ?? []).includes(entry.id));
  });
  useEffect(() => setVisibleCount(60), [query, category, country, mood, language, vocal, bpm, filter, atlas]);
  useEffect(()=>setRenameName(collection?.name??""),[collection?.id,collection?.name]);
  async function manageCollection(action:"rename"|"remove"|"restore"){
    if(saving||changingCollection.current)return;
    const target=action==="restore"?removedCollection:collection;if(!target)return;
    const name=renameName.trim();
    if(action==="rename"&&(!name||name.length>60||data.collections.some(c=>c.id!==target.id&&c.name.trim().toLocaleLowerCase()===name.toLocaleLowerCase()))){setCollectionError("Choose a unique collection name of 1–60 characters.");return;}
    if(action==="restore"&&(data.collections.length>=30||data.collections.some(c=>c.id===target.id||c.name.trim().toLocaleLowerCase()===target.name.toLocaleLowerCase()))){setCollectionError("A collection with this name already exists or the collection limit was reached. Rename it or free a slot, then retry Undo.");return;}
    changingCollection.current=true;setCollectionError("");
    try{const collections=action==="restore"?[...data.collections,target]:action==="remove"?data.collections.filter(c=>c.id!==target.id):data.collections.map(c=>c.id===target.id?{...c,name}:c);if(await save({...data,collections})){if(action==="remove"){setRemovedCollection(target);setFilter("");}else if(action==="restore"){setRemovedCollection(null);setFilter(target.id);}}else setCollectionError("The collection change could not save. Retry; your saved references are unchanged.");}catch{setCollectionError("The collection change could not save. Retry.");}finally{changingCollection.current=false;}
  }
  const rhythm = musicCatalog.find(entry => entry.id === rhythmId);
  const targetTempo = Number(previewTempo || rhythm?.rhythm?.bpm);
  const validTempo = Number.isInteger(targetTempo) && targetTempo >= 40 && targetTempo <= 240;
  const selectedInstruments = musicCatalog.filter(entry => instruments.includes(entry.id));
  const fusion = rhythm && validTempo
    ? `An original arrangement inspired by ${rhythm.name}, at ${targetTempo} BPM in ${rhythm.rhythm?.meter}. Feature ${selectedInstruments.map(entry => entry.name).join(", ") || rhythm.combine}. Introduce the rhythm alone, bring in a clear motif, then build toward a celebratory finale. Keep the writing uplifting and family-friendly.` : "";
  async function preview(entry: CatalogEntry) {
    const same = playing === entry.id;
    stop();
    setPlaying("");
    setPreviewError("");
    if (same || !entry.rhythm) return;
    let current: NonNullable<typeof playback.current> | undefined;
    try {
      current = { context: new AudioContext() };
      playback.current = current;
      await current.context.resume();
      if (playback.current !== current) return;
      setPlaying(entry.id);
      current.timer = window.setTimeout(() => { stop(); setPlaying(""); },
        auditionLoop(current.context, entry.rhythm, entry.id === rhythmId && validTempo ? targetTempo : entry.rhythm.bpm));
    } catch {
      if (playback.current !== current) return;
      stop();
      setPlaying("");
      setPreviewError("Rhythm playback is unavailable in this browser.");
    }
  }

  return <div className="music-tools">
    <header className="page-title"><div className="page-title-copy"><p className="eyebrow">DISCOVER · LEARN · COMBINE</p>
      <h1>{atlas ? <Globe2 size={26}/> : <BookOpen size={26}/>} {atlas ? "World Rhythm Atlas" : "Universal Music Library"}</h1>
      <p>{atlas ? "Hear rhythm studies, explore their cultural context, and build a palette for your next song." : "Explore genres, instruments, vocals, moods, and production techniques. Save what inspires you."}</p></div></header>
    <section className="section">
      <div className="music-fields">
        <HelpField label="Search the catalog" tip="Search names, related instruments, descriptions, and terms such as oud, duet, or 4/4."><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try oud, piano, or 4/4"/></HelpField>
        <HelpField label="Country or region" tip="Filter by a place associated with the tradition. A tradition can span several places."><input value={country} onChange={event => setCountry(event.target.value)} placeholder="Try Lebanon or Brazil"/></HelpField>
        <HelpField label="Tempo (BPM)" tip="Find rhythms or genres near this speed. Genre tempo ranges are creative starting points."><input type="number" min="30" max="300" value={bpm} onChange={event => setBpm(event.target.value)} placeholder="Any tempo"/></HelpField>
        {!atlas && <>
          <HelpField label="Category" tip="Narrow the catalog to one kind of entry."><select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(kind => <option key={kind}>{kind}</option>)}</select></HelpField>
          {([{ label: "Mood", value: mood, set: setMood, list: moods }, { label: "Language", value: language, set: setLanguage, list: languages }, { label: "Vocal type", value: vocal, set: setVocal, list: vocals }]).map(field =>
            <HelpField key={field.label} label={field.label} tip="Find catalog entries tagged with this quality."><select value={field.value} onChange={event => field.set(event.target.value)}><option value="">Any</option>{field.list.map(item => <option key={item}>{item}</option>)}</select></HelpField>)}
        </>}
        <HelpField label="Show saved entries" tip="See favorites or the entries in a named private collection."><select value={filter} onChange={event => setFilter(event.target.value)}><option value="">All entries</option><option value="favorites">Favorites</option>{data.collections.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></HelpField>
      </div>
      <form className="music-inline" onSubmit={async event => {
        event.preventDefault();
        if (creatingCollection.current || saving || !collectionName.trim() || data.collections.length >= 30) return;
        if (data.collections.some(c => c.name.trim().toLocaleLowerCase() === collectionName.trim().toLocaleLowerCase())) { setCollectionError("A collection with this name already exists. Choose it above or use another name."); return; }
        creatingCollection.current = true; setCollectionError("");
        const next = { id: crypto.randomUUID(), name: collectionName.trim(), entries: [] };
        try { if (await save({ ...data, collections: [...data.collections, next] })) { setFilter(next.id); setCollectionName(""); } }
        catch { setCollectionError("The collection could not save. Your name is preserved; retry."); }
        finally { creatingCollection.current = false; }
      }}>
        <HelpField label="New collection" tip="Group favorite sounds for a project. Choose All entries to add cards after creating it."><input maxLength={60} value={collectionName} onChange={event => { setCollectionName(event.target.value); setCollectionError(""); }} placeholder="e.g. Lebanese dance palette"/></HelpField>
        <button className="secondary small" disabled={saving || !collectionName.trim() || data.collections.length >= 30}>Create collection</button>
      </form>
      {collection&&<div className="music-inline"><label>Rename collection<input maxLength={60} value={renameName} onChange={e=>setRenameName(e.target.value)}/></label><button type="button" className="secondary small" disabled={saving||!renameName.trim()} onClick={()=>void manageCollection("rename")}>Rename collection</button><button type="button" className="secondary small" disabled={saving} onClick={()=>void manageCollection("remove")}>Remove collection</button><p className="muted">Removes only this reference group. Songs, favorites and catalog entries remain intact. Undo is available here until you leave this workspace.</p></div>}
      {removedCollection&&<p role="status">Collection “{removedCollection.name}” removed. <button type="button" disabled={saving} onClick={()=>void manageCollection("restore")}>Undo remove collection</button></p>}
      <p className="muted">Favorites: {data.favorites.length}/300 · Each collection can hold up to 300 references.</p>
      {collectionError && <p className="notice" role="alert">{collectionError}</p>}
      <p className="muted" role="status">{filtered.length} of {atlas ? musicCatalog.filter(item => item.kind === "Rhythm").length : musicCatalog.length} entries</p>
    </section>
    {atlas && <section className="section">
      <h2>Build a rhythm palette</h2><p className="section-sub">Loop previews are synthesized teaching sketches. Each uses simple low and high tones.</p>
      <div className="music-fields">
        <HelpField label="Rhythm" tip="Pick the main rhythmic cycle for the arrangement."><select value={rhythmId} onChange={event => { setRhythmId(event.target.value); setPreviewTempo(""); }}><option value="">Choose a rhythm</option>{musicCatalog.filter(entry => entry.rhythm).map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></HelpField>
        <HelpField label="Preview tempo" tip="Change playback speed without changing the rhythm’s pattern."><input type="number" min="40" max="240" value={previewTempo} onChange={event => setPreviewTempo(event.target.value)} placeholder={String(rhythm?.rhythm?.bpm ?? "40–240")}/></HelpField>
        <HelpField label="Add an instrument" tip="Add up to six sounds to your arrangement prompt. The audio preview plays the rhythm pulse."><select value="" disabled={instruments.length >= 6} onChange={event => setInstruments([...instruments, event.target.value])}><option value="">Choose an instrument</option>{musicCatalog.filter(entry => entry.kind === "Instrument" && !instruments.includes(entry.id)).map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></HelpField>
      </div>
      <div className="chips">{selectedInstruments.map(entry => <button key={entry.id} className="chip active" type="button" aria-label={`Remove ${entry.name}`} onClick={() => setInstruments(instruments.filter(id => id !== entry.id))}>{entry.name} ×</button>)}</div>
      {fusion && <div className="version-preview"><p>{fusion}</p><HelpControl subject="Edit this arrangement" tip="Take the rhythm and instrument combination into Prompt Lab for editing or saving."><button className="primary small" onClick={() => openPrompt(fusion)}>Edit in Prompt Lab</button></HelpControl></div>}
    </section>}
    {previewError && <p className="notice" role="alert">{previewError}</p>}
    <div className="music-grid">{filtered.slice(0, visibleCount).map(entry => {
      const favorite = data.favorites.includes(entry.id);
      return <article className="section music-card" key={entry.id}>
        <p className="eyebrow">{entry.kind} · {entry.family ?? entry.region}</p>
        <h2>{entry.name}</h2>
        {entry.family && <p className="muted">{entry.region}</p>}
        <p>{entry.description}</p>
        {entry.combine && <p className="muted"><strong>Try with </strong>{entry.combine}</p>}
        {entry.rhythm && <p className="music-pulse"><strong>{entry.rhythm.meter}</strong> · {entry.rhythm.bpm} BPM · <code>{entry.rhythm.pulse.replaceAll(".", "·")}</code></p>}
        <div className="actions">
          <button className="secondary small" type="button" disabled={saving || (!favorite && data.favorites.length >= 300)} aria-pressed={favorite} onClick={() => void save({ ...data, favorites: favorite ? data.favorites.filter(id => id !== entry.id) : [...new Set([...data.favorites, entry.id])] })}><Star size={15} fill={favorite ? "currentColor" : "none"}/>{favorite ? "Favorited" : "Favorite"}</button>
          {entry.rhythm && <HelpControl subject="Play rhythm study" tip="Hear two cycles using synthesized pulses. D marks a low stroke, t a high stroke, and a dot a rest."><button className="secondary small" type="button" onClick={() => void preview(entry)}>{playing === entry.id ? <><Square size={14}/> Stop</> : <><Play size={14}/> Hear rhythm</>}</button></HelpControl>}
          <button className="text-button" type="button" onClick={() => openPrompt(`Create an uplifting original piece featuring ${entry.name}. ${entry.combine ? "Combine " + entry.combine + "." : entry.description}${entry.rhythm ? ` Work at ${entry.rhythm.bpm} BPM in ${entry.rhythm.meter}.` : ""}`)}>Use in prompt</button>
        </div>
        {!!data.collections.length && <HelpField label="Add to collection" tip="Save this entry in an existing collection."><select value="" disabled={saving} onChange={event => {
          const id = event.target.value;
          const target = data.collections.find(c => c.id === id);
          if (target && target.entries.length < 300 && !target.entries.includes(entry.id)) void save({ ...data, collections: data.collections.map(item => item.id === id ? { ...item, entries: [...new Set([...item.entries, entry.id])] } : item) });
        }}><option value="">Choose collection</option>{data.collections.filter(item => !item.entries.includes(entry.id)).map(item => <option key={item.id} value={item.id} disabled={item.entries.length >= 300}>{item.name}{item.entries.length >= 300 ? " · Full (300)" : ""}</option>)}</select></HelpField>}
        {collection?.entries.includes(entry.id) && <button type="button" className="text-button" disabled={saving} onClick={() => void save({ ...data, collections: data.collections.map(item => item.id === collection.id ? { ...item, entries: item.entries.filter(id => id !== entry.id) } : item) })}>Remove from collection</button>}
      </article>;
    })}</div>
    {visibleCount < filtered.length && <button type="button" className="secondary" onClick={() => setVisibleCount(n => n + 60)}>Show more catalog entries ({Math.min(visibleCount, filtered.length)} of {filtered.length})</button>}
    {!filtered.length && <p className="empty">No entries match. Adjust your filters or add entries to this collection.</p>}
    {!atlas && <section className="section"><h2>Ready-to-edit templates</h2><div className="music-grid">{promptTemplates.map(template =>
      <article key={template.name} className="music-card"><h3>{template.name}</h3><p>{template.text}</p><button type="button" className="secondary small" onClick={() => openPrompt(template.text)}>Edit template</button></article>)}</div></section>}
    <details className="section"><summary>About the catalog and listening examples</summary><p className="section-sub">Tempo ranges and combinations are creative suggestions. No licensed instrument recordings are attached to this edition.</p>
      <p><a href="https://ich.unesco.org/en/examples-of-regional-living-heritage-00379" target="_blank" rel="noreferrer">UNESCO · Levantine living heritage</a></p>
      <p><a href="https://scalar.usc.edu/works/music-in-global-america/traditional-music-in-the-arab-world" target="_blank" rel="noreferrer">USC · Traditional music in the Arab world</a></p>
      <p><a href="https://www.metmuseum.org/es/essays/musical-instruments-of-the-indian-subcontinent" target="_blank" rel="noreferrer">The Met · Instruments of the Indian subcontinent</a></p>
    </details>
  </div>;
}
