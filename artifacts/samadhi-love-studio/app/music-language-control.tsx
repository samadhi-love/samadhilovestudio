"use client";
import { musicLanguages, musicDialects, musicCapabilityRegistry, suggestLyricLanguage, resolveLanguage, type LanguageChoice } from "./music-language";

export function MusicLanguageControl({ value, change, lyrics = "", prompt = "", disabled = false, compact = false }: {
  value: LanguageChoice; change: (next: LanguageChoice) => void; lyrics?: string; prompt?: string; disabled?: boolean; compact?: boolean;
}) {
  const detected = suggestLyricLanguage(lyrics);
  let resolved: keyof typeof musicLanguages | undefined;
  try { resolved=resolveLanguage(value,lyrics,prompt).resolved; } catch { /* The form displays unresolved/conflicting instructions before submission. */ }
  const capability = resolved ? musicCapabilityRegistry.forLanguage(resolved) : undefined;
  return <fieldset disabled={disabled} className="optional-song-controls">
    <legend>{compact ? "Song language" : "Singing language & dialect"}</legend>
    <label className="field">Singing language
      <select value={value.language} onChange={e => {
        const language = e.target.value as LanguageChoice["language"];
        change({ language, dialect: ["auto", "ar", "mixed"].includes(language) ? value.dialect : "" });
      }}>
        <option value="auto">{prompt.trim()?"Auto · follow description / lyrics":compact&&!lyrics.trim()?"Choose your song language…":"Auto · suggest from my lyrics"}</option>
        {Object.entries(musicLanguages).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
    <details open={compact ? undefined : true}><summary>Dialect & language details</summary>
    <label className="field">Dialect (optional)
      <select value={value.dialect} disabled={!["auto", "ar", "mixed"].includes(value.language)} onChange={e => change({ ...value, dialect: e.target.value as LanguageChoice["dialect"] })}>
        <option value="">No dialect target</option>
        {Object.entries(musicDialects).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
    </label>
    <p className="muted" role="status">{value.language === "auto" ?
      detected ? `Tentative suggestion: ${musicLanguages[detected]}; not a verified language detection. Change the selector to override.` :
        "Auto is uncertain. For new lyrics, short text or shared scripts, choose a language above before creating." : `Selected: ${musicLanguages[value.language]}.`}
      {" "}Your supplied lyrics are never translated. Use Mixed languages for code-switching; keep each passage in its own script.</p>
    <p className="muted">Language, dialect, music genre and vocal character are separate directions. No guide recording is needed.</p>
    <details><summary>Language capability & cost</summary>
      {capability && <ul>{Object.entries(capability).map(([key, status]) => <li key={key}>{
        ({ lyricWriting: "Lyric writing", sungAudio: "Sung audio", dialectFidelity: "Dialect fidelity", transcriptionAlignment: "Transcription / alignment", captionRendering: "Caption rendering" } as Record<string, string>)[key]}: {status}</li>)}</ul>}
      <p>No singing language has been listening-tested here. Lebanese authenticity requires a native-speaker listening review. Speech voice IDs and speech pronunciation dictionaries do not control song generation.</p>
      <p>Mixed Arabic/Latin captions use full-line emphasis rather than potentially misplaced word highlights. Font availability varies by device; review the preview and exported video for missing glyphs and correct joining.</p>
      <p>Provider planning and singing may use credits. There is no free audition here and no automatic retry. Use an explicitly chosen short song in the detailed editor for a paid audition; review the quoted cost before proceeding.</p>
      <a href={musicCapabilityRegistry.sources[1]} target="_blank" rel="noreferrer">Official music controls</a>
    </details>
    </details>
  </fieldset>;
}
