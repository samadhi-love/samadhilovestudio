const runtime =
  window.SamadhiPartyRuntime ??
  (await new Promise((resolve) => {
    window.addEventListener(
      "samadhi-party-ready",
      () => resolve(window.SamadhiPartyRuntime),
      { once: true },
    );
  }));
const {
  offlineData,
  cachedAudio,
  PartyEngine,
  removeOffline,
  LIMIT = 209715200,
} = runtime;
const status = document.querySelector("#status"),
  list = document.querySelector("#parties");
let engine;
const viewer = localStorage.getItem("samadhi-party-profile");
async function draw() {
  list.replaceChildren();
  if (!viewer) {
    status.textContent =
      "No offline profile is saved on this device. Open Party Mix online first.";
    return;
  }
  const data = await offlineData(viewer);
  document.querySelector("#storage").value = data.used;
  document.querySelector("#usage").textContent =
    (data.used / 1048576).toFixed(1) +
    " MB of " +
    LIMIT / 1048576 +
    " MB used by this profile.";
  if (!data.parties.length)
    status.textContent = "Save a party for offline playback while connected.";
  for (const saved of data.parties) {
    const article = document.createElement("article"),
      title = document.createElement("h2"),
      details = document.createElement("p"),
      play = document.createElement("button"),
      pause = document.createElement("button"),
      remove = document.createElement("button");
    title.textContent = saved.party.name;
    details.textContent = saved.tracks
      .map((t) => t.title + " — " + t.artist + " · " + t.license)
      .join(" / ");
    play.textContent = "Play party";
    pause.textContent = "Pause / resume";
    remove.textContent = "Remove offline copy";
    play.onclick = async () => {
      play.disabled = true;
      try {
        engine?.close();
        engine = new PartyEngine();
        await engine.prepare(
          saved.party,
          saved.tracks,
          (track) =>
            cachedAudio(viewer, track).then((blob) => {
              if (!blob)
                throw new Error(
                  "A downloaded track is missing. Reconnect to download this party again.",
                );
              return blob;
            }),
          (text) => {
            status.textContent = text;
          },
        );
        engine.play();
        status.textContent = "Playing " + saved.party.name;
      } catch (error) {
        status.textContent = error.message;
      } finally {
        play.disabled = false;
      }
    };
    pause.onclick = () => {
      if (engine?.playing) engine.pause();
      else engine?.play();
    };
    remove.onclick = async () => {
      engine?.close();
      try {
        await removeOffline(viewer, saved.party.id);
        await draw();
      } catch (error) {
        status.textContent = error.message;
      }
    };
    article.append(title, details, play, pause, remove);
    list.append(article);
  }
}
document.querySelector("#stop").onclick = () => {
  engine?.close();
  status.textContent = "Playback stopped.";
};
window.addEventListener("pagehide", () => engine?.close());
draw().catch((error) => {
  status.textContent = error.message;
});
