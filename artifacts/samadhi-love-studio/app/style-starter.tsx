"use client";
import { useId, useState } from "react";
import { addStyle, batchCount, hasStyle, pickedStyles, removeStyle, styleCategories, styleLimit, styleSuggestions, suggestionBatch, type StyleCategory } from "./style-suggestions";

const catalog = Object.values(styleSuggestions).flat();

export function StyleStarter({ value, change, disabled = false }: { value: string; change: (next: string) => void; disabled?: boolean }) {
  const id = useId();
  const [category, setCategory] = useState<StyleCategory>("genre");
  const [batches, setBatches] = useState<Record<StyleCategory, number>>({ genre: 0, beat: 0, regional: 0 });
  const [notice, setNotice] = useState("");
  const list = styleSuggestions[category];
  const shown = suggestionBatch(list, batches[category]);
  const picked = pickedStyles(value, catalog);
  function toggle(name: string) {
    if (hasStyle(value, name)) { change(removeStyle(value, name)); setNotice(""); return; }
    const next = addStyle(value, name);
    if (next === null) { setNotice(`Your style text is at the ${styleLimit}-character limit. Shorten it to add ${name}.`); return; }
    change(next); setNotice("");
  }
  return <section className="style-starter" aria-labelledby={`${id}-h`} data-testid="section-style-starter">
    <label className="style-starter-field" htmlFor={`${id}-text`}><span id={`${id}-h`}>Your style</span>
      <textarea id={`${id}-text`} data-testid="input-style-text" rows={2} maxLength={styleLimit} disabled={disabled} value={value}
        placeholder="Type or paste any style, e.g. warm acoustic soul with a slow dabke pulse" onChange={e => { change(e.target.value); setNotice(""); }}/>
      <small>{value.length}/{styleLimit} · Sent with your song exactly as written.</small>
    </label>
    <div className="style-starter-tabs" role="group" aria-label="Suggestion type">
      {styleCategories.map(c => <button type="button" key={c.id} className={`chip ${category === c.id ? "active" : ""}`} aria-pressed={category === c.id} disabled={disabled} data-testid={`button-style-category-${c.id}`} onClick={() => setCategory(c.id)}>{c.label}</button>)}
    </div>
    <div className="style-starter-options" aria-label={`${styleCategories.find(c => c.id === category)?.label} suggestions`} aria-live="polite">
      {shown.map(name => { const on = hasStyle(value, name); return <button type="button" key={name} className={`genre-pill${on ? " selected" : ""}`} aria-pressed={on} disabled={disabled} data-testid={`button-style-suggestion-${name}`} onClick={() => toggle(name)}>{on ? "Added · " : "+ "}{name}</button>; })}
    </div>
    <button type="button" className="text-button" disabled={disabled} data-testid="button-style-more" onClick={() => setBatches(b => ({ ...b, [category]: b[category] + 1 }))}>More suggestions <small>{(batches[category] % batchCount(list)) + 1}/{batchCount(list)}</small></button>
    {picked.length > 0 && <div className="genre-selected style-starter-picked" aria-label="Added suggestions"><span>Added</span>
      {picked.map(name => <button type="button" key={name} className="genre-pill selected" aria-label={`Remove ${name}`} disabled={disabled} data-testid={`button-style-remove-${name}`} onClick={() => toggle(name)}>{name}<span aria-hidden="true">×</span></button>)}
    </div>}
    {notice && <p className="notice" role="alert">{notice}</p>}
  </section>;
}
