"use client";
import { musicLanguages, musicDialects, dialectsFor, musicCapabilityRegistry, resolveLanguage, type LanguageChoice, type LanguageProfile } from "./music-language";

export function MusicLanguageControl({ value, change, lyrics = "", prompt = "", disabled = false, compact = false, detailsOnly = false }: {
  value: LanguageChoice; change: (next: LanguageChoice) => void; lyrics?: string; prompt?: string; disabled?: boolean; compact?: boolean; detailsOnly?: boolean;
}) {
  let profile: LanguageProfile | undefined;
  try { profile=resolveLanguage(value,lyrics,prompt); } catch { /* Invalid stored choices display the safe English default until changed. */ }
  const resolved=profile?.resolved;
  const singingName=profile?.dialect ? musicDialects[profile.dialect] : musicLanguages[resolved ?? "en"];
  const reason=profile?.source === "selected" ? "your choice" : profile?.source === "prompt" ? "from your description" : profile?.source === "script-suggestion" ? "from your lyrics" : "English by default";
  const capability = resolved ? musicCapabilityRegistry.forLanguage(resolved) : undefined;
  return <fieldset disabled={disabled} className="optional-song-controls" style={compact ? {border:0,padding:0,minWidth:0,maxWidth:"100%",width:"fit-content"} : undefined}>
    <legend className={compact ? "sr-only" : undefined}>{compact ? "Language" : "Singing language & dialect"}</legend>
    {!detailsOnly && <><label className="field" style={compact ? {display:"flex",alignItems:"center",gap:8} : undefined}>Language:
      <select aria-label="Singing language" style={compact ? {maxWidth:250,minWidth:0} : undefined} value={value.selected === false ? "auto" : value.language} onChange={e => {
        const language = e.target.value as LanguageChoice["language"];
        change({ language, selected: language !== "auto", dialect: value.dialect && (language === "auto" || dialectsFor(language).includes(value.dialect)) ? value.dialect : "" });
      }}>
        <option value="auto">Auto · English by default</option>
        {Object.entries(musicLanguages).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
    <p className="muted" role="status" data-testid="text-singing-language">Singing in {singingName} ({reason}) · <button type="button" onClick={event => event.currentTarget.closest("fieldset")?.querySelector("select")?.focus()}>change</button></p></>}
    {!compact && <>
    <details open={compact ? undefined : true}><summary>Dialect & language details</summary>
    <label className="field">Dialect or accent (optional)
      <select value={value.dialect} disabled={!resolved || !dialectsFor(resolved).length} onChange={e => change({ ...value, language: resolved ?? "en", selected: true, dialect: e.target.value as LanguageChoice["dialect"] })}>
        <option value="">{resolved && dialectsFor(resolved).length ? "No dialect or accent target" : "No accents for this language yet"}</option>
        {(resolved ? dialectsFor(resolved) : []).map(id => <option key={id} value={id}>{musicDialects[id]}</option>)}
      </select>
    </label>
    <p className="muted">Your supplied lyrics are never translated. Use Mixed languages for code-switching; keep each passage in its own script.</p>
    <p className="muted">Language, dialect, music genre and vocal character are separate directions. No guide recording is needed.</p>
    <details><summary>Language capability & cost</summary>
      {capability && <ul>{Object.entries(capability).map(([key, status]) => <li key={key}>{
        ({ lyricWriting: "Lyric writing", sungAudio: "Sung audio", dialectFidelity: "Dialect fidelity", transcriptionAlignment: "Transcription / alignment", captionRendering: "Caption rendering" } as Record<string, string>)[key]}: {status}</li>)}</ul>}
      <p>No singing language has been listening-tested here. Lebanese authenticity requires a native-speaker listening review. Speech voice IDs and speech pronunciation dictionaries do not control song generation.</p>
      <p>Mixed Arabic/Latin captions use full-line emphasis rather than potentially misplaced word highlights. Font availability varies by device; review the preview and exported video for missing glyphs and correct joining.</p>
      <a href={musicCapabilityRegistry.sources[1]} target="_blank" rel="noreferrer">Official music controls</a>
    </details>
    </details>
    </>}
  </fieldset>;
}
