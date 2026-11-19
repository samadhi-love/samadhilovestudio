"use client";
import { MusicLanguageControl } from "./music-language-control";
import { defaultLanguageChoice, resolveLanguage, type LanguageChoice } from "./music-language";
import {SongOpeningControl} from "./song-opening-control";
import type {SongOpening} from "./song-opening";
import {productionFetch} from "./credits/client";
import { useState } from "react";
import type { Song } from "./studio-data";
import type { ElevenLabsKey } from "./elevenlabs-key";
import { TrackLengthControl } from "./track-length-control";
import { autoTrackTime, formatTrackTime, parseTrackTime } from "./track-duration";
export function CaptionReadyCreate({
  provider,
  generate,
  done,
  connect,
  audit,
  changeAudit,
  drafts,
}: {
  provider: ElevenLabsKey;
  generate: (
    payload: Record<string, string | number | boolean>,
  ) => Promise<Song | undefined>;
  done: (song: Song) => void;
  connect: () => void;
  audit: boolean;
  changeAudit: (value: boolean) => void;
  drafts: Song[];
}) {
  const [openingMode,setOpeningMode]=useState<SongOpening>("auto");
  const [languageChoice,setLanguageChoice]=useState<LanguageChoice>(defaultLanguageChoice);
  const [idea, setIdea] = useState(""),
    [title, setTitle] = useState(""),
    [lyrics, setLyrics] = useState(""),
    [direction, setDirection] = useState(
      "Warm, clear solo lead; restrained reverb; leave a breath between lines.",
    ),
    [arrangement, setArrangement] = useState("solo"),
    [autoLength,setAutoLength]=useState(true),
    [manualTime,setManualTime]=useState("3:00"),
    [templateSeconds,setTemplateSeconds]=useState<number>(),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const timing=autoTrackTime({vocals:true,lyrics,bpm:120,cinematic:false,prompt:idea,templateSeconds});
  const seconds=autoLength?timing.seconds:parseTrackTime(manualTime);
  async function draft() {
    if(autoLength&&timing.overLimit){setError("Songs can be up to 6:00. Choose a shorter length.");return;}
    if(seconds===null){setError("Choose Auto or a song length from 0:03 to 6:00.");return;}
    try { resolveLanguage(languageChoice, ""); } catch (e) { setError((e as Error).message); return; }
    setBusy(true);
    setError("");
    try {
      const r = await productionFetch("/api/studio/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lyric-plan",
          ...languageChoice,
          prompt:
            `${idea}\n${arrangement}. ${direction}`.slice(
              0,
              1600,
            ),
          duration: seconds, openingMode,
        }),
      });
      const data = (await r.json()) as { lyrics: string; error?: string };
      if (!r.ok) throw new Error(data.error);
      setLyrics(data.lyrics);
      setApproved(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The lyric draft could not finish.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    if(autoLength&&timing.overLimit){setError("Songs can be up to 6:00. Choose a shorter length.");return;}
    if(seconds===null){setError("Choose Auto or a song length from 0:03 to 6:00.");return;}
    try { resolveLanguage(languageChoice, lyrics); } catch (e) { setError((e as Error).message); return; }
    setBusy(true);
    setError("");
    try {
      const song = await generate({
        action: "song",
        ...languageChoice,
        title: title.trim() || "Caption-ready song",
        prompt:
          `${idea}\n${arrangement}. Clear vocal delivery, breathing space, restrained reverb and balanced instruments.`.slice(
            0,
            1600,
          ),
        lyrics,
        voice: `${arrangement}. ${direction}`.slice(
          0,
          1000,
        ),
        duration: seconds, openingMode,
        instrumental: false,
        captionReady: true,
      });
      if (!song)
        throw new Error(
          "Generation could not finish. Check My Originals before retrying to avoid a duplicate charge.",
        );
      done(song);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Song creation could not finish.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="lvp-create">
      <h2>Create Song + Lyric Video</h2>
      <SongOpeningControl value={openingMode} change={setOpeningMode} disabled={busy}/>
      <p>
        Approve the words, generate the performance, then prepare its captions
        automatically.
      </p>
      {!provider.connected && (
        <p className="lvp-note">
          Connect your existing ElevenLabs account to generate sung audio and
          align it.{" "}
          <button type="button" onClick={connect}>
            Provider settings
          </button>
        </p>
      )}
      <fieldset disabled={busy}>
        <label>
          Start from saved lyrics (optional)
          <select
            value=""
            onChange={(e) => {
              const song = drafts.find((s) => s.id === e.target.value);
              if (!song) return;
              setTitle(song.name);
              setIdea((song.notes.prompt || song.summary).slice(0, 1000));
              setLyrics(song.generation?.approvedLyrics || song.notes.lyrics);
              setLanguageChoice(song.generation?.languageProfile ?? defaultLanguageChoice);
              setTemplateSeconds(song.creationSeconds??song.instrumental?.seconds);
              setDirection(
                song.notes.vocals ||
                  "Clear forward lead, restrained reverb, breathing space between lines.",
              );
              setApproved(false);
            }}
          >
            <option value="">Choose a song…</option>
            {drafts
              .filter((s) => s.notes.lyrics.trim()&&(!["account-writing-simple","account-writing-custom"].includes(s.id)||!!s.audioFormat))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <div className="lvp-fields">
          <label>
            Song title
            <input
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Performance
            <select
              value={arrangement}
              onChange={(e) => setArrangement(e.target.value)}
            >
              <option value="solo">Solo</option>
              <option value="duet">Duet</option>
              <option value="call-and-response">Call-and-response</option>
              <option value="multilingual">Multilingual sections</option>
            </select>
          </label>
          <MusicLanguageControl value={languageChoice} change={setLanguageChoice} lyrics={lyrics} disabled={busy}/>
        </div>
        <label>
          Describe the music
          <textarea
            value={idea}
            maxLength={1000}
            rows={3}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="An uplifting melodic house duet, warm piano and oud…"
          />
        </label>
        <label>
          Vocal direction
          <textarea
            value={direction}
            maxLength={600}
            rows={2}
            onChange={(e) => setDirection(e.target.value)}
          />
        </label>
        <TrackLengthControl automatic={autoLength} onAutomatic={value=>{if(!value)setManualTime(formatTrackTime(timing.seconds));setAutoLength(value);}} suggested={timing.seconds} reason={timing.reason} manual={manualTime} onManual={setManualTime}/>
        <div className="lvp-actions">
          <button
            type="button"
            disabled={!provider.connected || !idea.trim() || seconds===null}
            onClick={draft}
          >
            Write lyrics with ElevenLabs
          </button>
        </div>
        <label>
          Approved lyrics &amp; section headings
          <textarea
            dir="auto"
            style={{unicodeBidi:"plaintext"}}
            value={lyrics}
            rows={10}
            maxLength={5000}
            onChange={(e) => {
              setLyrics(e.target.value);
              setApproved(false);
            }}
            placeholder="Enter your lyrics or use Write lyrics above. Keep headings such as [Verse 1] and [Chorus]."
          />
        </label>
        <button type="button" className="secondary small" disabled={busy} onClick={() => { setAutoLength(false); setManualTime("0:15"); }}>
          Set 15-second paid audition
        </button>
        <p className="lvp-note">Auto fits your lyrics and sections. Turn it off to choose a length up to 6:00.</p>
        <label className="lvp-check">
          <input
            type="checkbox"
            checked={approved}
            onChange={(e) => setApproved(e.target.checked)}
          />{" "}
          I approve these exact lyrics and have permission to use this material.
        </label>
        <p className="lvp-note">
          Clear production may help recognition but cannot guarantee perfect
          words, accents, or synchronization. Music generation uses the
          provider&apos;s available generated singers; saved Voice Design/TTS voices
          are not selected or cloned for singing. Dialect and mixed-language
          results vary. Review the audio and captions.
        </p>
        <label className="lvp-check">
          <input
            type="checkbox"
            checked={audit}
            onChange={(e) => changeAudit(e.target.checked)}
          />{" "}
          Compare recognized words after alignment (an additional ElevenLabs
          transcription request)
        </label>
        <p className="lvp-note">
          Uses your ElevenLabs credits. Generating then automatically
          requests lyric alignment. Optional recognized-word checking is a
          separate paid request. The provider&apos;s music response supplies audio
          rather than word timestamps, so Studio aligns the completed
          performance.
        </p>
        <button
          type="button"
          className="lvp-primary"
          disabled={
            !approved || !lyrics.trim() || !idea.trim() || !provider.connected || seconds===null
          }
          onClick={create}
        >
          {busy
            ? "Preparing your song…"
            : "Generate song + prepare lyric video"}
        </button>
      </fieldset>
      {busy && (
        <p role="status">
          This can take several minutes. Keep this page open. Your finished
          audio will save to My Originals.
        </p>
      )}
      {error && (
        <p role="alert" className="lvp-error">
          {error}
        </p>
      )}
    </section>
  );
}
