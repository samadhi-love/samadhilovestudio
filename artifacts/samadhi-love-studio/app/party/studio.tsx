"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Disc3,
  Download,
  Headphones,
  Heart,
  Music2,
  Pause,
  Play,
  Plus,
  Radio,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import {
  attribution,
  blankParty,
  mediaUrl,
  offlineLimit,
  sources,
  vibes,
  type Party,
  type PartyData,
  type PartyTrack,
} from "./data";
import { partyRuntime, type Engine, type OfflineData } from "./runtime";
import {PartyFileBuilder} from "./file-builder";
import {newPartyFile,partyFileTracks,type PartyFile} from "./file-data";
import { wavAudio } from "../recording-dsp";
import { encodeMp3 } from "../vocal/mp3";

const clock = (seconds: number) =>
  !seconds
    ? "Duration on preview"
    : Math.floor(seconds / 60) +
      ":" +
      String(Math.floor(seconds % 60)).padStart(2, "0");
const fileName = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 90) || "Party Mix";
async function api(input: object,workspace?:string) {
  const response = await fetch("/api/party", {
    method: "POST",
    headers: { "Content-Type": "application/json",...(workspace?{"X-Party-Workspace":workspace}:{}) },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as {
    error?: string;
    party: Party;
    message?: string;
  };
  if (!response.ok) throw new Error(data.error || "Party Mix could not save.");
  return data;
}
export function PartyMix() {
  const [data, setData] = useState<PartyData | null>(null);
  const [party, setParty] = useState<Party>(blankParty);
  const [dirty, setDirty] = useState(false);
  const [filePending,setFilePending]=useState(false);
  const [tab, setTab] = useState("Build a party");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [vibe, setVibe] = useState("");
  const [source, setSource] = useState("");
  const [minBpm, setMinBpm] = useState("");
  const [maxBpm, setMaxBpm] = useState("");
  const [maxMinutes, setMaxMinutes] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [offline, setOffline] = useState<OfflineData>({
    used: 0,
    files: [],
    parties: [],
  });
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const engine = useRef<Engine | null>(null);
  const lock = useRef(false);
  const partySnapshot=useRef(party);partySnapshot.current=party;
  const drag = useRef("");
  const comments = useRef<Record<string, string>>({});
  const preview = useRef<HTMLAudioElement>(null);
  const [previewTrack, setPreviewTrack] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const importFile = useRef<HTMLInputElement>(null);
  const signature = JSON.stringify([
    party.id,
    !!party.files?.length,
    party.tracks,
    party.tempos,
    party.fade,
    party.beatmatch,
  ]);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/party" + location.search, {
      cache: "no-store",
    });
    const result = (await response.json()) as PartyData & {
      error?: string;
      message?: string;
    };
    if (!response.ok)
      throw new Error(result.error || "Party Mix could not load.");
    setData(result);
    return result as PartyData;
  }, []);
  const refreshOffline = useCallback(async (viewer: string) => {
    const runtime = await partyRuntime();
    setOffline(await runtime.offlineData(viewer));
  }, []);
  useEffect(() => {
    void refresh()
      .then((next) => {
        const id = new URLSearchParams(location.search).get("party");
        if (id) {
          setTab("Discover parties");
          const selected = next.feed.find((p) => p.id === id);
          if (selected) setMessage("Shared party · " + selected.name);
          else
            setMessage(
              "This party is no longer published. Browse available parties below.",
            );
        }
        return refreshOffline(next.viewer);
      })
      .catch((e) => setError(e.message));
    return () => {
      engine.current?.close();
    };
  }, [refresh, refreshOffline]);
  useEffect(() => {
    engine.current?.close();
    engine.current = null;
    setPrepared(false);
    setPlaying(false);
    setLength(0);
    setPosition(0);
  }, [signature]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const audio = engine.current;
      if (!audio?.playing) return;
      const value = audio.position();
      setPosition(value);
      if (value >= audio.length) {
        audio.pause();
        setPlaying(false);
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function task(label: string, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This action could not finish.",
      );
    } finally {
      lock.current = false;
      setBusy("");
    }
  }
  function change(patch: Partial<Party>) {
    setError("");
    setParty((p) => ({ ...p, ...patch }));
    setDirty(true);
  }
  async function persistFiles(files:PartyFile[],mix?:Party["fileMix"]){
    const next={...partySnapshot.current,files,tracks:partyFileTracks(files),published:false,...(mix?{fileMix:mix}:{})};
    const response=await fetch("/api/party",{method:"POST",headers:{"Content-Type":"application/json","X-Party-Workspace":data?.viewer??""},body:JSON.stringify({action:"save",party:next})});const result=await response.json() as {error?:string;party?:Party};if(!response.ok||!result.party)throw new Error(result.error||"Party files could not save. Your source songs are preserved.");partySnapshot.current=result.party;setParty(result.party);setDirty(false);return result.party;
  }
  async function save(publish?: boolean) {
    await task("Saving party…", async () => {
      const result = await api({
        action: "save",
        party: { ...party, published: publish ?? party.published },
      },data?.viewer);
      setParty(result.party);
      setDirty(false);
      setMessage(
        publish
          ? "Party published to the feed."
          : "Party saved to your profile.",
      );
      await refresh();
    });
  }
  useEffect(() => {
    if (error || !dirty || !party.name.trim() || (!party.tracks.length&&!party.files?.length) || busy)
      return;
    const timer = setTimeout(() => {
      void save();
    }, 1800);
    return () => clearTimeout(timer);
    // Saving is triggered only by the current editable snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [party, dirty, busy, error]);
  const trackMap = new Map(
    (data?.tracks ?? []).map((track) => [track.id, track]),
  );
  const chosen = party.tracks
    .map((id) => trackMap.get(id))
    .filter((t): t is PartyTrack => !!t);
  function reorder(id: string, index: number) {
    const rest = party.tracks.filter((item) => item !== id);
    rest.splice(Math.max(0, Math.min(index, rest.length)), 0, id);
    change({ tracks: rest });
  }
  function openParty(selected: Party, copy = false) {
    if (
      dirty &&
      !confirm(
        "Open another party? Save your current changes first to keep them.",
      )
    )
      return;
    setParty(
      copy
        ? {
            ...selected,
            id: crypto.randomUUID(),
            name: selected.name + " · My mix",
            published: false,
            featured: false,
            revision: 0,
          }
        : selected,
    );
    setDirty(copy);
    setTab("Build a party");
    setError("");
    setMessage("");
  }
  async function playSet() {
    await task("Preparing continuous playback…", async () => {
      preview.current?.pause();
      const runtime = await partyRuntime();
      if (!prepared) {
        if (chosen.length !== party.tracks.length || !chosen.length)
          throw new Error("Remove unavailable tracks before playing.");
        engine.current?.close();
        const audio = new runtime.PartyEngine();
        engine.current = audio;
        audio.setVolume(volume);
        await audio.prepare(
          party,
          chosen,
          (track) => runtime.loadAudio(data!.viewer, track),
          setBusy,
        );
        setLength(audio.length);
        setPrepared(true);
      }
      engine.current!.play();
      setPlaying(true);
      setMessage("Playing your continuous set.");
    });
  }
  async function previewOne(track: PartyTrack) {
    await task("Opening preview…", async () => {
      engine.current?.pause();
      setPlaying(false);
      const runtime = await partyRuntime();
      const blob = await runtime.loadAudio(data!.viewer, track);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewTrack(track.title);
      if (preview.current) {
        preview.current.src = url;
        await preview.current.play();
      }
    });
  }
  async function exportTrack(track: PartyTrack, format: string) {
    await task("Preparing licensed download…", async () => {
      const runtime = await partyRuntime();
      let blob =
        format === "video"
          ? await runtime.fetchAudio(track, true)
          : await runtime.loadAudio(data!.viewer, track);
      if (format !== "video" && format !== track.format) {
        const context = new AudioContext();
        try {
          const audio = await context.decodeAudioData(await blob.arrayBuffer());
          if (audio.duration > 1200)
            throw new Error("Convert tracks up to 20 minutes in the browser.");
          blob =
            format === "mp3"
              ? await encodeMp3(audio)
              : wavAudio(
                  audio.getChannelData(0),
                  audio.numberOfChannels > 1
                    ? audio.getChannelData(1)
                    : undefined,
                  audio.sampleRate,
                );
        } finally {
          await context.close();
        }
      }
      const metadata = {
        ...track,
        downloadedAt: new Date().toISOString(),
        outputFormat: format,
        changes:
          format !== track.format
            ? "Format converted by SAMADHI LOVE Studio"
            : "Unmodified source file",
      };
      const zip = await runtime.zipFiles([
        {
          name:
            fileName(track.title) + "." + (format === "video" ? "mp4" : format),
          blob,
        },
        {
          name: "LICENSE.txt",
          blob: new Blob([attribution(track) + "\n\n" + metadata.changes]),
        },
        {
          name: "metadata.json",
          blob: new Blob([JSON.stringify(metadata, null, 2)]),
        },
      ]);
      runtime.download(zip, fileName(track.title) + " - " + format + ".zip");
      setMessage("Downloaded with license and attribution files.");
    });
  }
  async function exportSet(format: "wav" | "mp3") {
    await task("Rendering the continuous mix…", async () => {
      const audio = engine.current;
      if (!audio || !prepared)
        throw new Error("Preview this set first to load all recordings.");
      audio.pause();
      setPlaying(false);
      const buffer = await audio.render();
      const blob =
        format === "mp3"
          ? await encodeMp3(buffer)
          : wavAudio(
              buffer.getChannelData(0),
              buffer.getChannelData(1),
              buffer.sampleRate,
            );
      const runtime = await partyRuntime();
      const license =
        chosen.map(attribution).join("\n\n") +
        "\n\nChanges: track order, crossfades, tempo adjustment and estimated intro trimming when enabled, gain and peak compression. Original catalog rights remain with each artist.";
      runtime.download(
        await runtime.zipFiles([
          { name: fileName(party.name) + "." + format, blob },
          { name: "LICENSES.txt", blob: new Blob([license]) },
          {
            name: "party.json",
            blob: new Blob([
              JSON.stringify({ party, tracks: chosen }, null, 2),
            ]),
          },
        ]),
        fileName(party.name) + " - mix.zip",
      );
    });
  }
  async function setupDownload(selected: Party) {
    const runtime = await partyRuntime();
    runtime.download(
      new Blob(
        [
          JSON.stringify(
            {
              version: 1,
              party: selected,
              tracks: selected.tracks
                .map((id) => trackMap.get(id))
                .filter(Boolean),
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      fileName(selected.name) + " - party.json",
    );
  }
  async function cache(selected: Party) {
    await task("Downloading party for offline listening…", async () => {
      if (dirty && selected.id === party.id)
        throw new Error(
          "Save the party before downloading it for offline use.",
        );
      const runtime = await partyRuntime();
      if (!("serviceWorker" in navigator))
        throw new Error(
          "Offline playback needs a browser with service worker support.",
        );
      const registration = await navigator.serviceWorker.register(
        "/party-sw.js",
        { scope: "/" },
      );
      await navigator.serviceWorker.ready;
      if (!registration.active && !registration.installing)
        throw new Error("Offline player could not install.");
      await runtime.cacheParty(
        data!.viewer,
        selected,
        data!.tracks,
        runtime.fetchAudio,
      );
      await refreshOffline(data!.viewer);
      setMessage(
        "Party saved on this device. Open Offline parties after disconnecting.",
      );
    });
  }
  async function engage(input: object) {
    await task("Updating party…", async () => {
      const result = await api(input);
      await refresh();
      if (result.message) setMessage(result.message ?? "Updated.");
    });
  }
  const filtered = (data?.tracks ?? []).filter(
    (track) =>
      (!query ||
        [track.title, track.artist, ...track.tags]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!vibe ||
        track.tags.some((tag) => tag.toLowerCase() === vibe.toLowerCase())) &&
      (!source || track.source === source) &&
      (!minBpm || track.bpm >= Number(minBpm)) &&
      (!maxBpm || (track.bpm > 0 && track.bpm <= Number(maxBpm))) &&
      (!maxMinutes ||
        (track.seconds > 0 && track.seconds <= Number(maxMinutes) * 60)),
  );
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    await task("Saving reviewed library audio…", async () => {
      const response = await fetch("/api/party/upload", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json()) as PartyData & {
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      form.reset();
      await refresh();
      setMessage("Track added to the curated library.");
    });
  }
  return (
    <main className="party-shell">
      <header className="party-header">
        <a href="/" className="party-brand">
          <Disc3 /> SAMADHI LOVE <span>STUDIO</span>
        </a>
        <div className="actions">
          <a href="/community">Community</a>
          <a href="/owner">Studio</a>
          <a href="/party-offline.html">Offline parties</a>
        </div>
      </header>
      <section className="party-hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> YOUR MUSIC. ONE SHARED FREQUENCY.
          </p>
          <h1>
            Party Mix<span>Bring the room together.</span>
          </h1>
          <p>
            From a quiet meditation to a Dabke celebration. Choose your songs,
            shape the flow, and make the set your own.
          </p>
          <div className="party-pills">
            <span>
              <Headphones size={14} /> Continuous crossfades
            </span>
            <span>
              <ShieldCheck size={14} /> Reviewed music licenses
            </span>
            <span>
              <WifiOff size={14} /> Offline listening
            </span>
          </div>
        </div>
        <div className="party-record" aria-hidden="true">
          <div>
            <Disc3 size={76} />
            <small>
              SAMADHI LOVE
              <br />
              PARTY COLLECTION
            </small>
          </div>
        </div>
      </section>
      <nav className="party-tabs" aria-label="Party Mix sections">
        {[
          "Build a party",
          "My parties",
          "Discover parties",
          ...(data?.admin ? ["Library curation"] : []),
        ].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={tab === item}
            disabled={!!busy} onClick={() => {if(filePending){setError("Save, download or dismiss the pending party render before leaving this workspace.");return;}setTab(item);}}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="party-status" aria-live="polite">
        {busy ||
          message ||
          (!data
            ? "Opening Party Mix…"
            : dirty
              ? "Unsaved changes · autosave starts after naming your party"
              : "Your profile · changes save automatically")}
      </div>
      {error && (
        <p className="party-error" role="alert">
          {error}{" "}
          <button
            type="button"
            disabled={!!busy}
            onClick={() =>
              void task("Refreshing…", async () => {
                await refresh();
              })
            }
          >
            Refresh
          </button>
        </p>
      )}
      {data && (
        <>
          <aside className="party-storage">
            <div>
              <WifiOff size={17} />
              <strong>Offline storage</strong>
              <span>
                {(offline.used / 1048576).toFixed(1)} / 200 MB on this device
              </span>
            </div>
            <progress max={offlineLimit} value={offline.used} />
            <small>
              Per profile, on this browser. Browser storage can be cleared by
              the device. <a href="/party-offline.html">Open offline player</a>
            </small>
          </aside>
          {tab === "Build a party" && data && (party.files?.length?<PartyFileBuilder party={party} data={data} disabled={!!busy} settings={change} change={files=>change({files,tracks:partyFileTracks(files),published:false})} persist={persistFiles} refresh={refresh} working={setBusy} unsaved={setFilePending}/>:<section className="party-panel party-files-intro"><h2>Build a continuous party file</h2><p>Combine your songs, authorized uploads and voice recordings into up to four files of 30 minutes each. Stream or download your finished MP3 mixes.</p><button type="button" disabled={!!busy} onClick={()=>change({name:party.name||"My Party",files:[{...newPartyFile(),tracks:party.tracks.slice(0,24)}],published:false})}>Create party files · upload, record & blend</button><p className="party-muted">Or use the classic track-set builder below.</p></section>)}
          {tab === "Build a party" && !party.files?.length && (
            <div className="party-builder">
              <section className="party-panel">
                <div className="party-section-title">
                  <div>
                    <p className="eyebrow">01 · FIND YOUR SOUND</p>
                    <h2>The track library</h2>
                  </div>
                  <Music2 />
                </div>
                <p className="party-muted">
                  Your originals and reviewed downloads. Unknown BPM or duration
                  is measured on preview and excluded from numeric filters.
                </p>
                <div className="party-filters">
                  <label>
                    Search
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Artist, song, or feeling"
                    />
                  </label>
                  <label>
                    Vibe
                    <select
                      value={vibe}
                      onChange={(e) => setVibe(e.target.value)}
                    >
                      <option value="">All vibes</option>
                      {[
                        ...new Set([
                          ...vibes,
                          ...data.tracks.flatMap((t) => t.tags),
                        ]),
                      ].map((tag) => (
                        <option key={tag}>{tag}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Source
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    >
                      <option value="">All sources</option>
                      {sources.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Min BPM
                    <input
                      type="number"
                      min="40"
                      max="240"
                      value={minBpm}
                      onChange={(e) => setMinBpm(e.target.value)}
                    />
                  </label>
                  <label>
                    Max BPM
                    <input
                      type="number"
                      min="40"
                      max="240"
                      value={maxBpm}
                      onChange={(e) => setMaxBpm(e.target.value)}
                    />
                  </label>
                  <label>
                    Max minutes
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={maxMinutes}
                      onChange={(e) => setMaxMinutes(e.target.value)}
                    />
                  </label>
                </div>
                <p className="party-muted">{filtered.length} tracks found</p>
                <div className="party-track-list">
                  {filtered.map((track) => (
                    <article key={track.id} className="party-track">
                      <div className="party-track-icon">
                        <Music2 size={18} />
                      </div>
                      <div>
                        <strong>{track.title}</strong>
                        <p>
                          {track.artist} · {track.source}
                        </p>
                        <small>
                          {clock(track.seconds)} ·{" "}
                          {track.bpm ? track.bpm + " BPM" : "Tempo on analysis"}
                        </small>
                        <div className="party-track-tags">
                          {track.tags.slice(0, 3).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                        <details>
                          <summary>{track.license}</summary>
                          <p>{track.attribution}</p>
                          <a
                            href={track.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Source page
                          </a>
                          {track.licenseUrl && (
                            <>
                              {" "}
                              ·{" "}
                              <a
                                href={track.licenseUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                License terms
                              </a>
                            </>
                          )}
                        </details>
                        <div className="party-track-actions">
                          <button
                            disabled={!!busy}
                            onClick={() => void previewOne(track)}
                          >
                            Preview
                          </button>
                          <details>
                            <summary>Download</summary>
                            <div className="actions">
                              <button
                                disabled={!!busy}
                                onClick={() => void exportTrack(track, "mp3")}
                              >
                                MP3 + license
                              </button>
                              <button
                                disabled={!!busy}
                                onClick={() => void exportTrack(track, "wav")}
                              >
                                WAV + license
                              </button>
                              <button
                                disabled={!!busy || !track.video}
                                onClick={() => void exportTrack(track, "video")}
                              >
                                Video{!track.video && " · unavailable"}
                              </button>
                            </div>
                            <small>
                              Conversions use the available source audio. WAV
                              conversion preserves the source’s quality.
                            </small>
                          </details>
                        </div>
                      </div>
                      <button
                        className="party-add"
                        aria-label={"Add " + track.title}
                        disabled={
                          !!busy ||
                          party.tracks.includes(track.id) ||
                          party.tracks.length >= 24
                        }
                        onClick={() =>
                          change({ tracks: [...party.tracks, track.id] })
                        }
                      >
                        {party.tracks.includes(track.id) ? (
                          "Added"
                        ) : (
                          <Plus size={20} />
                        )}
                      </button>
                    </article>
                  ))}
                </div>
                {!filtered.length && (
                  <div className="party-empty">
                    <Music2 />
                    <h3>A little space for new sounds.</h3>
                    <p>
                      {data.tracks.length
                        ? "Try another filter."
                        : "Save an original recording, publish music to Community, or ask the owner to curate licensed downloads."}
                    </p>
                    {data.admin && (
                      <button onClick={() => setTab("Library curation")}>
                        Add library music
                      </button>
                    )}
                  </div>
                )}
                <div hidden={!previewTrack} className="party-preview">
                  <strong>Preview · {previewTrack}</strong>
                  <audio
                    ref={preview}
                    controls
                    onError={() =>
                      setError(
                        "This audio cannot be decoded by the browser. Try another format.",
                      )
                    }
                    onPlay={() => {
                      engine.current?.pause();
                      setPlaying(false);
                    }}
                  />
                </div>
              </section>
              <section className="party-panel party-set">
                <p className="eyebrow">02 · SHAPE YOUR SET</p>
                <h2>Your party, your flow.</h2>
                <fieldset disabled={!!busy}>
                  <label>
                    Party name
                    <input
                      maxLength={80}
                      value={party.name}
                      onChange={(e) => change({ name: e.target.value })}
                      placeholder="One Heart, One Dance"
                    />
                  </label>
                  <label>
                    Cover
                    <select
                      value={
                        party.cover.startsWith("data:") ? "custom" : party.cover
                      }
                      onChange={(e) => {
                        if (e.target.value !== "custom")
                          change({ cover: e.target.value });
                      }}
                    >
                      <option value="solar">Golden sunrise</option>
                      <option value="violet">Violet frequency</option>
                      <option value="ocean">Ocean calm</option>
                      <option value="rose">Rose celebration</option>
                      {party.cover.startsWith("data:") && (
                        <option value="custom">Uploaded cover</option>
                      )}
                    </select>
                  </label>
                  <label>
                    Upload cover · under 200 KB
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (
                          file.size > 200000 ||
                          !["image/png", "image/jpeg", "image/webp"].includes(
                            file.type,
                          )
                        ) {
                          setError(
                            "Choose a PNG, JPEG or WebP cover under 200 KB.",
                          );
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () =>
                          change({ cover: String(reader.result) });
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <div
                    className={
                      "party-cover party-cover-" +
                      (party.cover.startsWith("data:") ? "custom" : party.cover)
                    }
                  >
                    {party.cover.startsWith("data:") ? (
                      <img src={party.cover} alt="Your party cover" />
                    ) : (
                      <>
                        <Disc3 size={38} />
                        <span>{party.name || "YOUR NEXT FAVORITE SET"}</span>
                      </>
                    )}
                  </div>
                  <label>Vibe tags</label>
                  <div className="party-tag-buttons">
                    {[...new Set([...vibes, ...party.tags])].map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        aria-pressed={party.tags.includes(tag)}
                        onClick={() =>
                          change({
                            tags: party.tags.includes(tag)
                              ? party.tags.filter((t) => t !== tag)
                              : [...party.tags, tag].slice(0, 12),
                          })
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="actions">
                    <input
                      aria-label="Custom vibe tag"
                      maxLength={35}
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="Add your own vibe"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customTag.trim()) {
                          change({
                            tags: [
                              ...new Set([...party.tags, customTag.trim()]),
                            ].slice(0, 12),
                          });
                          setCustomTag("");
                        }
                      }}
                    >
                      Add tag
                    </button>
                  </div>
                  <div className="party-order-heading">
                    <strong>Set order · {party.tracks.length} / 24</strong>
                    <span>Drag to reorder</span>
                  </div>
                  <ol className="party-order">
                    {party.tracks.map((id, index) => {
                      const track = trackMap.get(id);
                      return (
                        <li
                          key={id}
                          draggable={!busy}
                          onDragStart={(e) => {
                            drag.current = id;
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", id);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (
                              drag.current &&
                              party.tracks.includes(drag.current)
                            )
                              reorder(drag.current, index);
                            drag.current = "";
                          }}
                        >
                          <span className="party-order-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <strong>
                              {track?.title ??
                                "Unavailable track · remove to continue"}
                            </strong>
                            <small>{track?.artist}</small>
                            <label>
                              BPM
                              <input
                                aria-label={"BPM for track " + (index + 1)}
                                type="number"
                                min="40"
                                max="240"
                                value={party.tempos[id] ?? (track?.bpm || "")}
                                onChange={(e) => {
                                  const tempos = { ...party.tempos };
                                  if (e.target.value)
                                    tempos[id] = Number(e.target.value);
                                  else delete tempos[id];
                                  change({ tempos });
                                }}
                              />
                            </label>
                          </div>
                          <div className="party-order-controls">
                            <button
                              aria-label={"Move track " + (index + 1) + " up"}
                              disabled={index === 0}
                              onClick={() => reorder(id, index - 1)}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              aria-label={"Move track " + (index + 1) + " down"}
                              disabled={index === party.tracks.length - 1}
                              onClick={() => reorder(id, index + 1)}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              aria-label={"Remove track " + (index + 1)}
                              onClick={() =>
                                change({
                                  tracks: party.tracks.filter((t) => t !== id),
                                })
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  {!party.tracks.length && (
                    <p className="party-empty-small">
                      Tap + beside a song to start your party.
                    </p>
                  )}
                  <label>
                    Crossfade · {party.fade} seconds
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={party.fade}
                      onChange={(e) => change({ fade: Number(e.target.value) })}
                    />
                  </label>
                  <label className="party-check">
                    <input
                      type="checkbox"
                      checked={party.beatmatch}
                      onChange={(e) => change({ beatmatch: e.target.checked })}
                    />{" "}
                    Basic tempo matching
                  </label>
                  <p className="party-muted">
                    Matches known tempos within 8% of the first track and places
                    estimated first beats on a common grid. Larger tempo
                    differences keep their original speed. Intro audio before
                    the estimated beat may be trimmed. Speed changes pitch.
                    Check each transition by ear.
                  </p>
                  <div className="actions">
                    <button
                      disabled={!prepared}
                      onClick={() =>
                        void task("Analyzing tempo…", async () => {
                          const runtime = await partyRuntime();
                          const tempos = { ...party.tempos };
                          engine.current?.buffers.forEach((b, i) => {
                            const bpm = runtime.estimateTempo(b);
                            if (bpm) tempos[chosen[i].id] = bpm;
                          });
                          change({ tempos });
                          setMessage(
                            "Estimated tempos applied. Check by ear and adjust BPM if needed.",
                          );
                        })
                      }
                    >
                      Estimate BPM from preview
                    </button>
                    <button
                      className="party-primary"
                      onClick={() => void save()}
                      disabled={!party.name.trim() || !party.tracks.length}
                    >
                      <Save size={16} /> Save party
                    </button>
                  </div>
                </fieldset>
                <div className="party-transport">
                  <div className="actions">
                    <button
                      className="party-primary"
                      disabled={!!busy || !party.tracks.length}
                      onClick={() => {
                        if (playing) {
                          engine.current?.pause();
                          setPlaying(false);
                        } else void playSet();
                      }}
                    >
                      {playing ? <Pause size={17} /> : <Play size={17} />}{" "}
                      {playing ? "Pause set" : "Play set"}
                    </button>
                    <button
                      disabled={!prepared || !!busy}
                      onClick={() => {
                        engine.current?.pause();
                        engine.current?.seek(0);
                        setPlaying(false);
                        setPosition(0);
                      }}
                    >
                      Stop
                    </button>
                    <span>
                      {clock(position) === "Duration on preview"
                        ? "0:00"
                        : clock(position)}{" "}
                      / {length ? clock(length) : "—"}
                    </span>
                  </div>
                  <input
                    aria-label="Set playhead"
                    disabled={!prepared || !!busy}
                    type="range"
                    min="0"
                    max={length || 1}
                    step="0.1"
                    value={position}
                    onChange={(e) => {
                      engine.current?.seek(Number(e.target.value));
                      setPosition(Number(e.target.value));
                    }}
                  />
                  <label>
                    Volume
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setVolume(v);
                        engine.current?.setVolume(v);
                      }}
                    />
                  </label>
                  <small>
                    Keep this page open for continuous playback. Set length is
                    limited by available browser memory.
                  </small>
                </div>
                <div className="party-export actions">
                  <button
                    disabled={!prepared || !!busy}
                    onClick={() => void exportSet("wav")}
                  >
                    Mixed WAV + credits
                  </button>
                  <button
                    disabled={!prepared || !!busy}
                    onClick={() => void exportSet("mp3")}
                  >
                    Mixed MP3 + credits
                  </button>
                  <button
                    disabled={!!busy || !party.revision || dirty}
                    onClick={() => void cache(party)}
                  >
                    <WifiOff size={15} /> Save offline
                  </button>
                  <button
                    disabled={!!busy || !party.tracks.length}
                    onClick={() => void setupDownload(party)}
                  >
                    Download setup
                  </button>
                  <button
                    disabled={
                      !!busy || !party.name.trim() || !party.tracks.length
                    }
                    onClick={() => void save(!party.published)}
                  >
                    {party.published
                      ? "Unpublish party"
                      : "Publish to party feed"}
                  </button>
                </div>
                <p className="party-muted">
                  Published setups share track order, settings, cover, and tags
                  with people who can access the Studio. Private original songs
                  must be published in Community first.
                </p>
              </section>
            </div>
          )}
          {(tab === "My parties" || tab === "Discover parties") && (
            <section>
              <div className="party-section-title">
                <div>
                  <p className="eyebrow">
                    {tab === "My parties"
                      ? "MADE BY YOU"
                      : "MADE TO BRING US TOGETHER"}
                  </p>
                  <h2>
                    {tab === "My parties"
                      ? "Your saved parties"
                      : "The party feed"}
                  </h2>
                </div>
                <div className="actions">
                  <button
                    onClick={() => {
                      if (
                        dirty &&
                        !confirm("Open a new party? Save any changes first.")
                      )
                        return;
                      setParty(blankParty());
                      setDirty(false);
                      setTab("Build a party");
                    }}
                  >
                    New party
                  </button>
                  <button onClick={() => importFile.current?.click()}>
                    Import setup
                  </button>
                </div>
              </div>
              <div className="party-cards">
                {(tab === "My parties"
                  ? data.parties
                  : [...data.feed].sort(
                      (a, b) =>
                        Number(
                          b.id ===
                            new URLSearchParams(location.search).get("party"),
                        ) -
                        Number(
                          a.id ===
                            new URLSearchParams(location.search).get("party"),
                        ),
                    )
                ).map((item) => (
                  <article className="party-panel party-card" key={item.id}>
                    <div
                      className={
                        "party-cover party-cover-" +
                        (item.cover.startsWith("data:") ? "custom" : item.cover)
                      }
                    >
                      {item.cover.startsWith("data:") ? (
                        <img src={item.cover} alt="Party cover" />
                      ) : (
                        <Disc3 size={52} />
                      )}
                    </div>
                    {item.featured && <p className="eyebrow">FEATURED PARTY</p>}
                    <h3>{item.name}</h3>
                    <p>
                      {item.artist} · {item.tracks.length} tracks ·{" "}
                      {item.published ? "Published" : "Private"}
                    </p>
                    <div className="party-track-tags">
                      {item.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <ol>
                      {item.tracks.map((id) => (
                        <li key={id}>
                          {trackMap.get(id)?.title ??
                            "Track currently unavailable"}
                        </li>
                      ))}
                    </ol>
                    <div className="actions">
                      <button onClick={() => openParty(item, !item.mine)}>
                        {item.mine ? "Open & edit" : "Make my version"}
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() => void setupDownload(item)}
                      >
                        <Download size={14} /> Setup
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() => void cache(item)}
                      >
                        Save offline
                      </button>
                      {item.published && (
                        <button
                          disabled={!!busy}
                          aria-pressed={item.liked}
                          onClick={() =>
                            void engage({
                              action: "like",
                              id: item.id,
                              value: !item.liked,
                            })
                          }
                        >
                          <Heart size={14} /> {item.likes || 0}
                        </button>
                      )}
                    </div>
                    {item.published && (
                      <>
                        <button
                          disabled={!!busy}
                          onClick={() =>
                            void task("Copying party link…", async () => {
                              await navigator.clipboard.writeText(
                                new URL(
                                  "/party?party=" + encodeURIComponent(item.id),
                                  location.origin,
                                ).href,
                              );
                              setMessage(
                                "Party link copied. Listeners need access to the Studio.",
                              );
                            })
                          }
                        >
                          Copy party link
                        </button>
                        <div className="party-comments">
                          <h4>Good words, good energy</h4>
                          {(data.comments[item.id] ?? []).map((comment) => (
                            <div key={comment.id}>
                              <p>
                                {comment.body}{" "}
                                {comment.pending && (
                                  <small>· Awaiting review</small>
                                )}
                              </p>
                              {data.admin && (
                                <div className="actions">
                                  {comment.pending && (
                                    <button
                                      disabled={!!busy}
                                      onClick={() =>
                                        void engage({
                                          action: "moderate",
                                          id: item.id,
                                          commentId: comment.id,
                                          approve: true,
                                        })
                                      }
                                    >
                                      Approve
                                    </button>
                                  )}
                                  <button
                                    disabled={!!busy}
                                    onClick={() =>
                                      void engage({
                                        action: "moderate",
                                        id: item.id,
                                        commentId: comment.id,
                                        approve: false,
                                      })
                                    }
                                  >
                                    Hide comment
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              void engage({
                                action: "comment",
                                id: item.id,
                                body: comments.current[item.id] || "",
                              });
                            }}
                          >
                            <textarea
                              aria-label={"Comment on " + item.name}
                              maxLength={500}
                              placeholder="Leave an encouraging comment"
                              onChange={(e) => {
                                comments.current[item.id] = e.target.value;
                              }}
                            />
                            <button disabled={!!busy}>
                              Send comment for review
                            </button>
                          </form>
                        </div>
                      </>
                    )}
                    {data.admin && item.published && (
                      <div className="actions">
                        <button
                          disabled={!!busy}
                          onClick={() =>
                            void engage({
                              action: "feature",
                              id: item.id,
                              value: !item.featured,
                            })
                          }
                        >
                          {item.featured ? "Unfeature" : "Feature on home"}
                        </button>
                        <button
                          disabled={!!busy}
                          onClick={() =>
                            void engage({
                              action: "remove",
                              id: item.id,
                              value: true,
                            })
                          }
                        >
                          Remove from feed
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              {!(tab === "My parties" ? data.parties : data.feed).length && (
                <div className="party-empty">
                  <Radio />
                  <h3>The first set starts with you.</h3>
                  <p>Build a party and save it to your profile.</p>
                  <button onClick={() => setTab("Build a party")}>
                    Create a party
                  </button>
                </div>
              )}
            </section>
          )}
          {!!offline.parties.length && (
            <details className="party-panel">
              <summary>
                Manage offline parties · {offline.parties.length}
              </summary>
              <p>
                Removing a cached party frees audio used only by that party.
                Your online party stays saved.
              </p>
              {offline.parties.map((item) => (
                <div className="actions" key={item.party.id}>
                  <strong>{item.party.name}</strong>
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      void task("Freeing offline storage…", async () => {
                        const runtime = await partyRuntime();
                        await runtime.removeOffline(data.viewer, item.party.id);
                        await refreshOffline(data.viewer);
                      })
                    }
                  >
                    Remove offline copy
                  </button>
                </div>
              ))}
            </details>
          )}
          {tab === "Library curation" && data.admin && (
            <section className="party-panel">
              <p className="eyebrow">OWNER CURATION</p>
              <h2>Music with permission. Chosen with care.</h2>
              <p>
                Admit CC0 and CC BY audio after checking clean content and all
                recording, composition, sample, and video rights. Other CC
                license types stay outside the mixing library.
              </p>
              <div className="party-admin-grid">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void task("Importing source metadata…", async () => {
                      const result = await api({
                        action: "import",
                        source: f.get("source"),
                        id: f.get("track"),
                      });
                      await refresh();
                      setMessage(result.message ?? "Updated.");
                    });
                  }}
                >
                  <h3>Import provider metadata</h3>
                  <label>
                    Provider
                    <select name="source">
                      <option>Jamendo</option>
                      <option>ccMixter</option>
                    </select>
                  </label>
                  <label>
                    Numeric track ID
                    <input name="track" required pattern="[0-9]+" />
                  </label>
                  <button disabled={!!busy}>Import for review</button>
                  <p>
                    Jamendo needs the server setting JAMENDO_CLIENT_ID. ccMixter
                    uses its public Query API. Imported tracks start hidden
                    until reviewed.
                  </p>
                </form>
                <form onSubmit={upload}>
                  <h3>Upload a reviewed licensed file</h3>
                  <p>
                    FMA files must be hosted by the app. Use this form for any
                    source when automatic import is unavailable.
                  </p>
                  <fieldset disabled={!!busy}>
                    <label>
                      Title
                      <input name="title" required maxLength={120} />
                    </label>
                    <label>
                      Artist
                      <input name="artist" required maxLength={120} />
                    </label>
                    <label>
                      Source
                      <select name="source">
                        {sources.slice(1).map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Track page URL
                      <input name="sourceUrl" type="url" required />
                    </label>
                    <label>
                      CC0 or CC BY license URL
                      <input
                        name="licenseUrl"
                        type="url"
                        required
                        placeholder="https://creativecommons.org/licenses/by/4.0/"
                      />
                    </label>
                    <label>
                      Required credits and sample attributions
                      <textarea name="attribution" required maxLength={3000} />
                    </label>
                    <label>
                      Duration in seconds
                      <input
                        name="seconds"
                        type="number"
                        min="1"
                        max="1200"
                        required
                      />
                    </label>
                    <label>
                      BPM · 0 if unknown
                      <input
                        name="bpm"
                        type="number"
                        min="0"
                        max="240"
                        defaultValue="0"
                        required
                      />
                    </label>
                    <label>
                      Vibe tags · comma separated
                      <input name="tags" placeholder="chill, uplifting" />
                    </label>
                    <label>
                      MP3 or WAV
                      <input
                        name="audio"
                        type="file"
                        accept=".mp3,.wav"
                        required
                      />
                    </label>
                    <label>
                      Optional licensed MP4 · same license
                      <input name="video" type="file" accept=".mp4" />
                    </label>
                    <label className="party-check">
                      <input type="checkbox" name="reviewed" required /> I
                      reviewed the clean audio, source license, all required
                      credits, and permission for downloads, mixing, and any
                      video.
                    </label>
                    <button>Upload reviewed track</button>
                  </fieldset>
                </form>
              </div>
              <h3>Curated tracks</h3>
              {data.library.map((track) => (
                <article className="party-admin-row" key={track.id}>
                  <div>
                    <strong>{track.title}</strong>
                    <p>
                      {track.artist} · {track.source} · {track.license} ·{" "}
                      {track.active ? "Visible" : "Hidden"}
                    </p>
                    <a href={track.sourceUrl} target="_blank" rel="noreferrer">
                      Review source and credits
                    </a>
                    <p>{track.attribution}</p>
                  </div>
                  <button
                    disabled={!!busy}
                    onClick={() => {
                      const reviewed = track.active
                        ? false
                        : confirm(
                            "Have you reviewed this track’s audio, license, composition and sample credits and confirmed permission for downloads and mixing?",
                          );
                      if (!track.active && !reviewed) return;
                      const credit = track.active
                        ? track.attribution
                        : prompt(
                            "Copy all required artist, composition, and sample credits from the source page.",
                            track.attribution,
                          );
                      if (credit === null) return;
                      void engage({
                        action: "library",
                        id: track.id,
                        active: !track.active,
                        attribution: credit,
                        reviewed,
                      });
                    }}
                  >
                    {track.active ? "Remove from library" : "Approve & enable"}
                  </button>
                </article>
              ))}
            </section>
          )}
          <input
            ref={importFile}
            type="file"
            hidden
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void task("Opening party setup…", async () => {
                if (file.size > 350000)
                  throw new Error("Choose a setup file under 350 KB.");
                const value = JSON.parse(await file.text());
                const p = value.party as Party;
                if (
                  !p ||
                  typeof p.name !== "string" ||
                  !Array.isArray(p.tracks) ||
                  p.tracks.length > 24 ||
                  p.tracks.some((id) => !trackMap.has(id)) ||
                  !Array.isArray(p.tags) ||
                  typeof p.cover !== "string" ||
                  !Number.isFinite(p.fade) ||
                  typeof p.beatmatch !== "boolean" ||
                  !p.tempos ||
                  typeof p.tempos !== "object"
                )
                  throw new Error(
                    "This setup is invalid or contains tracks that are no longer available.",
                  );
                openParty(p, true);
              });
            }}
          />
        </>
      )}
      <footer className="party-footer">
        <Disc3 size={18} />
        <span>SAMADHI LOVE · Every gathering has a frequency.</span>
        <a
          href="https://creativecommons.org/share-your-work/cclicenses/"
          target="_blank"
          rel="noreferrer"
        >
          About music licenses
        </a>
      </footer>
    </main>
  );
}
