"use client";
import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { Template } from "./studio-data";
import { genreFamilies } from "./music-genres";
import { filterSongTemplates } from "./song-presets";
import { GenrePicker } from "./genre-picker";

function TemplateFilters({ search, family, setSearch, setFamily, disabled = false }: { search: string; family: string; setSearch: (s: string) => void; setFamily: (s: string) => void; disabled?: boolean }) {
  return <div className="starter-filter-row"><label className="field">Search templates<input type="search" value={search} disabled={disabled} maxLength={100} placeholder="Try jazz, acoustic, dabke, or ambient…" onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}/></label><label className="field">Template family<select value={family} disabled={disabled} onChange={e => setFamily(e.target.value)}><option>All templates</option><option>Saved templates</option>{genreFamilies.map(group => <option key={group.name}>{group.name}</option>)}</select></label></div>;
}
export function NewSongForm({ templates, savedTemplateIds, initialTemplateId = "", saving, create }: { templates: Template[]; savedTemplateIds?: string[]; initialTemplateId?: string; saving: boolean; create: (name: string, templateId: string, genres: string[], stylePrompt?: string) => Promise<boolean> }) {
  const id = useId(), initial = templates.find(t => t.id === initialTemplateId);
  const [name, setName] = useState(""), [templateId, setTemplateId] = useState(initial?.id ?? ""), [genres, setGenres] = useState<string[]>(initial?.tags ?? []);
  const [stylePrompt, setStylePrompt] = useState("");
  const [search, setSearch] = useState(""), [family, setFamily] = useState("All templates"), [pending, setPending] = useState(false);
  const selected = templates.find(t => t.id === templateId), matches = filterSongTemplates(templates, search, family, savedTemplateIds), busy = saving || pending;
  return <form className="new-song-form" onSubmit={async event => { event.preventDefault(); if (busy || !name.trim()) return; setPending(true); try { await create(name.trim(), templateId, genres, stylePrompt); } finally { setPending(false); } }}>
    <label className="field">Song title<input name="name" value={name} onChange={event => setName(event.target.value)} autoFocus required maxLength={100} placeholder="Give your idea a name" disabled={busy}/></label>
    <TemplateFilters search={search} family={family} setSearch={setSearch} setFamily={setFamily} disabled={busy}/>
    <label className="field" htmlFor={`${id}-template`}>Start from a template<select id={`${id}-template`} value={templateId} disabled={busy} onChange={event => { setTemplateId(event.target.value); setGenres(templates.find(t => t.id === event.target.value)?.tags ?? []); }}>
      <option value="">Blank song · choose any genres below</option>
      {selected && !matches.some(t => t.id === selected.id) && <optgroup label="Current selection"><option value={selected.id}>{selected.name}</option></optgroup>}
      {matches.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select></label>
    <p className="muted starter-count" role="status">{matches.length} matching templates · {templates.length} available. Templates provide editable writing and arrangement notes.</p>
    {selected ? <div className="starter-preview"><strong>{selected.name}</strong><p>{selected.description}</p><details><summary>Preview vocal, instrument and section directions</summary><p><strong>Vocals:</strong> {selected.notes.vocals}</p><p><strong>Instruments:</strong> {selected.notes.instruments}</p><pre>{selected.notes.lyrics}</pre></details></div> : <p className="muted">Start blank, or choose an arrangement above. You can combine genres with any template.</p>}
    {selected&&/spoken|whisper|talk-sing/i.test([selected.notes.lyrics,selected.notes.vocals].join(" "))&&<p className="muted">This template requests spoken or whispered passages. Edit its vocal directions if you want singing throughout.</p>}
    {!matches.length && <p>No matching templates. Try another family or clear the search; your current selection is preserved.</p>}
    <GenrePicker prompt={stylePrompt} changePrompt={setStylePrompt} label="Choose genres & style blend" value={genres} change={setGenres} disabled={busy} initialBrowse maxSelected={Math.max(8, selected?.tags.length ?? 0)}/>
    <p className="muted">Your selected styles are saved with the new song and its creative prompt. This creates a private writing project; audio generation is a separate action.</p>
    <div className="actions"><button type="submit" className="primary" disabled={busy || !name.trim()}><Plus size={17}/>{busy ? "Creating song…" : "Create song"}</button></div>
  </form>;
}
export function SongTemplateBrowser({ templates, savedTemplateIds, render }: { templates: Template[]; savedTemplateIds?: string[]; render: (template: Template, index: number) => ReactNode }) {
  const [search, setSearch] = useState(""), [family, setFamily] = useState("All templates");
  const matches = filterSongTemplates(templates, search, family, savedTemplateIds);
  return <><TemplateFilters search={search} family={family} setSearch={setSearch} setFamily={setFamily}/><p className="muted" role="status">{matches.length} of {templates.length} templates. Customize a Studio preset to save your own version.</p><div className="card-grid">{matches.map((template, index) => render(template, index))}</div>{!matches.length && <p className="empty">No matching templates. Try another family or search.</p>}</>;
}
