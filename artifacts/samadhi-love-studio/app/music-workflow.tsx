"use client";

import {brand} from "./brand";
import { useState } from "react";
import { ArrowRight, Layers3 } from "lucide-react";
import { HelpControl, HelpField } from "./help-tip";
import type { Song } from "./studio-data";

export type WorkflowStep = "idea" | "prompt" | "lyrics" | "generate" | "record" | "edit" | "mix" | "master" | "video" | "release" | "template" | "podcast" | "distribution";
const steps = [
  ["idea", "Song idea", "Start a blank song or use one of your templates."],
  ["prompt", "Creative prompt", "Combine styles, instruments, and performance cues."],
  ["lyrics", "Lyrics in Create", "Write lyrics and musical directions in the shared song creator."],
  ["generate", "Generate", "Render a browser instrumental or request a track through ElevenLabs."],
  ["record", "Record & produce", "Record your own voice, reuse saved performances, and edit a private vocal session."],
  ["mix", "Mix", "Arrange separate tracks or stems, adjust levels and effects, then save an editable session and render."],
  ["master", "Select soundtrack", "Compare mix versions and pin the final recording before lyric alignment or release preparation."],
  ["video", "Visualize", "Confirm the soundtrack version, align and review lyrics, then apply visuals and export."],
  ["release", "Prepare release", "Review rights, credits and delivery assets; distribution and publishing use supported destinations."],
] as const;

export function MusicWorkflow({ songs, open }: { songs: Song[]; open: (step: WorkflowStep, song?: Song) => void }) {
  const [selected, setSelected] = useState("");
  const song = songs.find(item => item.id === selected);
  return <div className="music-tools">
    <header className="page-title"><div className="page-title-copy"><p className="eyebrow">{brand.name} · PRODUCTION</p><h1><Layers3 size={26}/> Project Workflow</h1><p>Take an idea from its first sketch through production and release. Jump to the stage you need.</p></div></header>
    <section className="section">
      <HelpField label="Working song" tip="Select a song to carry its notes or recording into compatible tools. An empty selection opens the tool on its own."><select value={selected} onChange={event => setSelected(event.target.value)}><option value="">New idea or browse tools</option>{songs.filter(item=>!["account-writing-simple","account-writing-custom"].includes(item.id)||!!item.audioFormat).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></HelpField>
      <div className="music-grid">{steps.map(([id, label, tip], index) => <article key={id} className="music-card version-preview">
        <p className="eyebrow">{String(index + 1).padStart(2, "0")} / {label.toUpperCase()}</p><p>{tip}</p>
        <button type="button" className="secondary small" onClick={() => open(id, song)}>Open {label} <ArrowRight size={14}/></button>
      </article>)}</div>
    </section>
    <section className="section"><h2>More production tools</h2><div className="actions">
      <button type="button" className="secondary small" onClick={()=>open("edit",song)}>Production notes</button>
      <HelpControl subject="Song templates" tip="Open reusable writing and production starting points."><button className="secondary small" onClick={() => open("template", song)}>Templates</button></HelpControl>
      <HelpControl subject="Podcast Studio" tip="Record and polish spoken audio or a spoken intro."><button className="secondary small" onClick={() => open("podcast", song)}>Podcast Studio</button></HelpControl>
      <HelpControl subject="Release tools" tip="Prepare promotional clips and open supported distributor websites."><button className="secondary small" onClick={() => open("distribution", song)}>Release tools</button></HelpControl>
    </div></section>
  </div>;
}
