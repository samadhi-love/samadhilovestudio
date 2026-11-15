// Shared by the online builder and the offline player. Audio never leaves this browser during mixing.
export const LIMIT = 200 * 1024 * 1024;
const encoder = new TextEncoder();
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("samadhi-party-v1", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("files", { keyPath: "key" });
      db.createObjectStore("parties", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Offline storage is unavailable in this browser."));
  });
}
async function transaction(store, mode, action) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      let value;
      const request = action(tx.objectStore(store));
      if (request)
        request.onsuccess = () => {
          value = request.result;
        };
      tx.oncomplete = () => resolve(value);
      tx.onabort = tx.onerror = () =>
        reject(
          new Error(
            "Offline storage could not be updated. Check browser storage permissions.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function offlineData(viewer) {
  const [files, parties] = await Promise.all([
    transaction("files", "readonly", (s) => s.getAll()),
    transaction("parties", "readonly", (s) => s.getAll()),
  ]);
  return {
    files: files.filter((f) => f.viewer === viewer),
    parties: parties.filter((p) => p.viewer === viewer),
    used: files
      .filter((f) => f.viewer === viewer)
      .reduce((n, f) => n + f.blob.size, 0),
  };
}
export async function cachedAudio(viewer, track) {
  const row = await transaction("files", "readonly", (s) =>
    s.get(viewer + "|" + track.id + "|" + track.revision),
  );
  return row?.blob;
}
export async function cacheParty(viewer, party, tracks, loader) {
  if (!navigator.locks)
    throw new Error(
      "Offline saving needs Web Locks support. Use a current Chrome, Edge, Firefox or Safari browser.",
    );
  return navigator.locks.request("samadhi-party-cache-" + viewer, async () => {
    const before = await offlineData(viewer);
    const required = party.tracks.map((id) => tracks.find((t) => t.id === id));
    if (required.some((t) => !t))
      throw new Error("A party track is no longer available.");
    // Fetch first, then commit all audio and the setup in one transaction.
    const keep = new Set([
      ...before.parties
        .filter((p) => p.party.id !== party.id)
        .flatMap((p) =>
          p.tracks.map((t) => viewer + "|" + t.id + "|" + t.revision),
        ),
      ...required.map((t) => viewer + "|" + t.id + "|" + t.revision),
    ]);
    const additions = [];
    let used = before.files
      .filter((f) => keep.has(f.key))
      .reduce((sum, f) => sum + f.blob.size, 0);
    for (const track of required) {
      const key = viewer + "|" + track.id + "|" + track.revision;
      if (before.files.some((f) => f.key === key)) continue;
      const blob = await loader(track);
      used += blob.size;
      if (used > LIMIT)
        throw new Error(
          "This party exceeds your 200 MB offline limit. Remove a cached party first.",
        );
      additions.push({ key, viewer, track, blob });
    }
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(["files", "parties"], "readwrite");
        for (const row of before.files)
          if (!keep.has(row.key)) tx.objectStore("files").delete(row.key);
        for (const row of additions) tx.objectStore("files").put(row);
        tx.objectStore("parties").put({
          key: viewer + "|" + party.id,
          viewer,
          party,
          tracks: required,
        });
        tx.oncomplete = resolve;
        tx.onerror = tx.onabort = () =>
          reject(
            new Error(
              "The browser could not save the party. Free some device storage.",
            ),
          );
      });
      localStorage.setItem("samadhi-party-profile", viewer);
    } finally {
      db.close();
    }
  });
}
export async function removeOffline(viewer, partyId) {
  if (!navigator.locks) throw new Error("Storage locking is unavailable.");
  return navigator.locks.request("samadhi-party-cache-" + viewer, async () => {
    const data = await offlineData(viewer);
    const remaining = data.parties.filter((p) => p.party.id !== partyId);
    const keep = new Set(
      remaining.flatMap((p) =>
        p.tracks.map((t) => viewer + "|" + t.id + "|" + t.revision),
      ),
    );
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(["files", "parties"], "readwrite");
        tx.objectStore("parties").delete(viewer + "|" + partyId);
        for (const row of data.files)
          if (!keep.has(row.key)) tx.objectStore("files").delete(row.key);
        tx.oncomplete = resolve;
        tx.onerror = tx.onabort = () =>
          reject(new Error("Could not remove this offline party."));
      });
    } finally {
      db.close();
    }
  });
}
export async function fetchAudio(track, video = false) {
  const response = await fetch(
    "/api/party/media?id=" +
      encodeURIComponent(track.id) +
      "&v=" +
      encodeURIComponent(track.revision) +
      (video ? "&video=1" : ""),
    { cache: "no-store" },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "This recording is unavailable.");
  }
  const length = Number(response.headers.get("content-length"));
  if (length > 50 * 1024 * 1024)
    throw new Error("Choose tracks smaller than 50 MB.");
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (
      let part = await reader.read();
      !part.done;
      part = await reader.read()
    ) {
      size += part.value.byteLength;
      if (size > 50 * 1024 * 1024) {
        await reader.cancel();
        throw new Error("This track exceeds 50 MB.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new Error("The source returned an empty recording.");
  return new Blob(chunks, {
    type: response.headers.get("content-type") || "audio/mpeg",
  });
}
export async function loadAudio(viewer, track) {
  // Online requests recheck curation, source permissions and recording versions.
  if (navigator.onLine) return fetchAudio(track);
  const cached = await cachedAudio(viewer, track);
  if (!cached)
    throw new Error(
      "Save every party track for offline use before disconnecting.",
    );
  return cached;
}
export function estimateTempo(buffer) {
  const samples = buffer.getChannelData(0),
    window = Math.round(buffer.sampleRate / 100);
  const count = Math.min(18000, Math.floor(samples.length / window));
  const envelope = new Float32Array(count);
  let previous = 0;
  for (let i = 0; i < count; i++) {
    let energy = 0;
    for (let j = 0; j < window; j += 8)
      energy += Math.abs(samples[i * window + j] || 0);
    envelope[i] = Math.max(0, energy - previous);
    previous = energy;
  }
  let best = 0,
    bpm = 0;
  for (let tempo = 70; tempo <= 180; tempo++) {
    const lag = Math.round(6000 / tempo);
    let score = 0;
    for (let i = lag; i < count; i++) score += envelope[i] * envelope[i - lag];
    if (score > best) {
      best = score;
      bpm = tempo;
    }
  }
  return bpm;
}
export function estimateBeatOffset(buffer) {
  if (!buffer.getChannelData) return 0;
  const samples = buffer.getChannelData(0);
  const window = Math.max(1, Math.round(buffer.sampleRate / 100));
  const count = Math.min(200, Math.floor(samples.length / window));
  const envelope = [];
  for (let i = 0; i < count; i++) {
    let energy = 0;
    for (let j = 0; j < window; j += 8)
      energy += Math.abs(samples[i * window + j] || 0);
    envelope.push(energy);
  }
  const peak = Math.max(0, ...envelope);
  if (peak < 0.01) return 0;
  const first = envelope.findIndex(
    (energy, i) =>
      energy >= peak * 0.45 && (i === 0 || energy > envelope[i - 1] * 1.3),
  );
  return first > 0 ? (first * window) / buffer.sampleRate : 0;
}
export function planSet(party, tracks, buffers) {
  const target = party.tempos[party.tracks[0]] || tracks[0]?.bpm || 0;
  const plan = [];
  for (let i = 0; i < tracks.length; i++) {
    const bpm = party.tempos[tracks[i].id] || tracks[i].bpm;
    const ratio = target && bpm ? target / bpm : 0;
    const match = party.beatmatch && ratio >= 0.92 && ratio <= 1.08;
    const rate = match ? ratio : 1;
    const sourceOffset = match ? estimateBeatOffset(buffers[i]) : 0;
    const duration = (buffers[i].duration - sourceOffset) / rate;
    const prior = plan[i - 1];
    let fade = prior
      ? Math.min(party.fade, duration / 3, prior.duration / 3)
      : 0;
    let cursor = prior ? prior.start + prior.duration - fade : 0;
    if (prior && fade && match) {
      const beat = 60 / target;
      const aligned = Math.ceil(cursor / beat) * beat;
      if (aligned < prior.start + prior.duration) {
        cursor = aligned;
        fade = prior.start + prior.duration - cursor;
      }
    }
    plan.push({
      start: cursor,
      duration,
      rate,
      sourceOffset,
      fadeIn: fade,
      fadeOut: 0,
    });
    if (prior) prior.fadeOut = fade;
  }
  return plan;
}
function schedule(
  context,
  destination,
  buffers,
  plan,
  offset = 0,
  startAt = 0,
) {
  const nodes = [];
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    if (p.start + p.duration <= offset) continue;
    const source = context.createBufferSource(),
      gain = context.createGain();
    source.buffer = buffers[i];
    source.playbackRate.value = p.rate;
    const elapsed = Math.max(0, offset - p.start);
    const at = startAt + Math.max(0, p.start - offset);
    const amplitude = (t) =>
      Math.max(
        0,
        Math.min(
          1,
          p.fadeIn ? t / p.fadeIn : 1,
          p.fadeOut ? (p.duration - t) / p.fadeOut : 1,
        ),
      );
    gain.gain.setValueAtTime(amplitude(elapsed), at);
    if (p.fadeIn > elapsed)
      gain.gain.linearRampToValueAtTime(1, at + p.fadeIn - elapsed);
    if (p.duration - p.fadeOut > elapsed)
      gain.gain.setValueAtTime(1, at + p.duration - p.fadeOut - elapsed);
    gain.gain.linearRampToValueAtTime(0, at + p.duration - elapsed);
    source.connect(gain);
    gain.connect(destination);
    source.start(at, (p.sourceOffset || 0) + elapsed * p.rate);
    nodes.push(source);
  }
  return nodes;
}
export class PartyEngine {
  constructor() {
    this.context = null;
    this.nodes = [];
    this.offset = 0;
    this.started = 0;
    this.buffers = [];
    this.plan = [];
    this.length = 0;
    this.playing = false;
    this.volume = 0.8;
    this.cancelled = false;
  }
  async prepare(party, tracks, loader, progress) {
    this.cancelled = false;
    if (!this.context) this.context = new AudioContext();
    await this.context.resume();
    let bytes = 0;
    const buffers = [];
    try {
      for (let i = 0; i < tracks.length; i++) {
        progress?.(
          "Loading " +
            (i + 1) +
            " of " +
            tracks.length +
            " · " +
            tracks[i].title,
        );
        const blob = await loader(tracks[i]);
        if (this.cancelled) throw new Error("Playback cancelled.");
        // A conservative duration limit avoids large phone memory allocations.
        if (blob.size > 50 * 1024 * 1024)
          throw new Error("Choose tracks under 50 MB.");
        const buffer = await this.context.decodeAudioData(
          await blob.arrayBuffer(),
        );
        bytes += buffer.length * buffer.numberOfChannels * 4;
        if (buffer.duration > 1200 || bytes > 192 * 1024 * 1024)
          throw new Error(
            "This set exceeds the browser mixing memory limit. Use fewer or shorter tracks.",
          );
        buffers.push(buffer);
      }
      if (this.cancelled) throw new Error("Playback cancelled.");
      this.buffers = buffers;
      this.plan = planSet(party, tracks, buffers);
      const last = this.plan.at(-1);
      this.length = last ? last.start + last.duration : 0;
    } catch (error) {
      this.buffers = [];
      this.plan = [];
      this.length = 0;
      throw error;
    }
  }
  play() {
    if (!this.context || !this.buffers.length || this.playing) return;
    if (this.offset >= this.length) this.offset = 0;
    this.master = this.context.createGain();
    this.master.gain.value = this.volume;
    const limiter = this.context.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.ratio.value = 20;
    limiter.knee.value = 0;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;
    this.master.connect(limiter);
    limiter.connect(this.context.destination);
    this.started = this.context.currentTime;
    this.nodes = schedule(
      this.context,
      this.master,
      this.buffers,
      this.plan,
      this.offset,
      this.started + 0.05,
    );
    this.playing = true;
  }
  position() {
    return Math.min(
      this.length,
      this.offset +
        (this.playing
          ? Math.max(0, this.context.currentTime - this.started - 0.05)
          : 0),
    );
  }
  pause() {
    this.offset = this.position();
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {}
      node.disconnect();
    }
    this.nodes = [];
    this.master?.disconnect();
    this.playing = false;
  }
  seek(seconds) {
    const playing = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(this.length, seconds));
    if (playing) this.play();
  }
  setVolume(value) {
    this.volume = value;
    if (this.master) this.master.gain.value = value;
  }
  async render() {
    if (!this.buffers.length)
      throw new Error("Preview the set before exporting it.");
    if (this.length * 44100 * 8 > 128 * 1024 * 1024)
      throw new Error(
        "This mix is too long for browser export. Export a shorter party.",
      );
    const context = new OfflineAudioContext(
      2,
      Math.ceil(this.length * 44100),
      44100,
    );
    const gain = context.createGain();
    gain.gain.value = 0.85;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.ratio.value = 20;
    limiter.knee.value = 0;
    limiter.attack.value = 0.003;
    gain.connect(limiter);
    limiter.connect(context.destination);
    schedule(context, gain, this.buffers, this.plan);
    return context.startRendering();
  }
  close() {
    this.cancelled = true;
    this.pause();
    this.buffers = [];
    this.plan = [];
    this.context?.close().catch(() => {});
    this.context = null;
  }
}
// Store-only ZIP keeps the license and metadata beside each exported media file.
function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}
export async function zipFiles(files) {
  const parts = [],
    directory = [];
  let offset = 0,
    directorySize = 0;
  for (const file of files) {
    const name = encoder.encode(file.name),
      bytes = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(bytes),
      header = new Uint8Array(30),
      view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x800, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, bytes.length, true);
    view.setUint32(22, bytes.length, true);
    view.setUint16(26, name.length, true);
    parts.push(header, name, bytes);
    const central = new Uint8Array(46),
      cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x800, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, bytes.length, true);
    cv.setUint32(24, bytes.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    directory.push(central, name);
    directorySize += central.length + name.length;
    offset += header.length + name.length + bytes.length;
  }
  const end = new Uint8Array(22),
    ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, directorySize, true);
  ev.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end], { type: "application/zip" });
}
export function download(blob, filename) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

if (typeof window !== "undefined") {
  window.SamadhiPartyRuntime = {
    PartyEngine,
    cachedAudio,
    offlineData,
    cacheParty,
    removeOffline,
    loadAudio,
    fetchAudio,
    estimateTempo,
    zipFiles,
    download,
  };
  window.dispatchEvent(new Event("samadhi-party-ready"));
}
