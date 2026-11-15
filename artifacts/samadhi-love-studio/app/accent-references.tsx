"use client";

import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "./audio-player";
import { HelpField } from "./help-tip";

export const accentSources = {
  lebanese: { title: "Spirelight · Lebanese Levantine conversations", url: "https://www.spirelight.ai/datasets/arabic-levantine",
    note: "Native speakers recorded in Lebanon. Request samples and check commercial licensing with the provider. Ask for Beirut speakers if that is your target." },
  khaleeji: { title: "UBC Casablanca · Emirati Arabic speech", url: "https://huggingface.co/datasets/UBC-NLP/Casablanca",
    note: "Listen to the UAE subset for Emirati pronunciation. For a Kuwaiti song, use a Kuwaiti speaker. Casablanca is listed as CC BY-NC-ND 4.0." },
  egyptian: { title: "UBC Casablanca · Egyptian Arabic speech", url: "https://huggingface.co/datasets/UBC-NLP/Casablanca",
    note: "Choose the Egypt subset for downloadable Egyptian speech clips. Listed as CC BY-NC-ND 4.0." },
  turkish: { title: "Mozilla Common Voice · Turkish", url: "https://mozilladatacollective.com/datasets?page=9",
    note: "Download the Turkish read-speech corpus from the catalog. It is listed as CC0 with restrictions on re-hosting the dataset and identifying speakers." },
  russian: { title: "Mozilla Common Voice · Russian", url: "https://mozilladatacollective.com/datasets/cmu5x45pn00dao107j4o9w2yv",
    note: "Download the Russian read-speech corpus. It is listed as CC0 with restrictions on re-hosting the dataset and identifying speakers." },
} as const;

type AccentId = keyof typeof accentSources;

export function AccentReferences({ id, name, notes, update, openVocalStudio, active }: {
  id: AccentId; name: string; notes: string; update: (value: string) => void; openVocalStudio: () => void; active: boolean;
}) {
  const [clips, setClips] = useState<Partial<Record<AccentId, { url: string; name: string }>>>({});
  const urls = useRef<Partial<Record<AccentId, string>>>({});
  const [error, setError] = useState("");
  const source = accentSources[id];
  useEffect(() => () => {
    for (const url of Object.values(urls.current)) URL.revokeObjectURL(url);
  }, []);

  function choose(file: File | undefined) {
    if (!file) return;
    if (!file.size || file.size > 25 * 1024 * 1024) { setError("Choose a non-empty audio clip up to 25 MB."); return; }
    setError("");
    const previous = urls.current[id];
    if (previous) URL.revokeObjectURL(previous);
    const url = URL.createObjectURL(file);
    urls.current[id] = url;
    setClips(current => ({ ...current, [id]: { url, name: file.name } }));
  }

  return <div className="version-preview">
    <h3>Native voice reference · {name}</h3>
    <p className="muted">{source.note}</p>
    <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>
    {id === "lebanese" && <p><a href="https://catalog.ldc.upenn.edu/LDC2007S01" target="_blank" rel="noreferrer">Listen to an LDC Levantine sample ↗</a> <span className="muted">The catalog offers a sample and licensed download of the full mixed-region corpus.</span></p>}
    <p className="muted">Use spoken clips to check vowel sounds, word stress, and phrasing. The player below stays in this browser. The song generator receives only your written pronunciation notes.</p>
    <HelpField label="Listen to a reference clip" tip="Choose a recording you have permission to use. Listen here and add the pronunciation cues you hear.">
      <input type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm" onChange={event => { choose(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}/>
    </HelpField>
    {active && clips[id] && <AudioPlayer key={clips[id].url} src={clips[id].url} label={clips[id].name}/>}
    {error && <p className="notice" role="alert">{error}</p>}
    <HelpField label="Pronunciation notes" tip="Add a place, preferred vowel sounds, or words that need special stress. Keep your lyric text as you want it sung.">
      <textarea rows={2} maxLength={100} value={notes} onChange={event => update(event.target.value)}
        placeholder="For example, keep the Beirut vowels and stress the last word of the hook"/>
    </HelpField>
    <button type="button" className="secondary small" onClick={openVocalStudio}>Record a native singer in Vocal Studio</button>
  </div>;
}
