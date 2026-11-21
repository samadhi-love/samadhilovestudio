import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LyricVideoPro } from "../app/lyric-video-pro";
import type { ElevenLabsKey } from "../app/elevenlabs-key";

test("Lyric Video exposes sacred backgrounds and styles before a recording is selected", () => {
  const provider = {
    connected: false,
    busy: false,
    status: { available: false, saved: false, musicAccess: "unknown" },
  } as ElevenLabsKey;
  const html = renderToStaticMarkup(
    <LyricVideoPro
      songs={[]}
      initialSongId=""
      saving={false}
      elevenLabs={provider}
      save={async () => true}
      connectionSettings={() => {}}
      upload={() => {}}
      generate={async () => undefined}
      importFile={async () => undefined}
      persisted={() => {}}
      persistBusy={() => {}}
      dirty={() => {}}
    />,
  );
  assert.match(html, /Upload Your Own Song/);
  assert.match(
    html,
    /generate captions, choose backgrounds and animated lettering/,
  );
  assert.match(html, /data-skin="cosmic"/);
  assert.match(html, /id="lyric-visual-library"/);
  // One background box (search + tabs) holds every background, complete look and
  // animated design; it opens on the Sacred collection before a song is chosen.
  assert.equal((html.match(/data-testid="background-chooser"/g) ?? []).length, 1, "exactly one background box");
  for (const name of [
    "Sacred",
    "Animated designs",
    "Complete looks",
    "Colors",
    "Kriya",
    "Ascended Masters",
    "Archangel",
    "Jesus",
    "Mother Mary",
    "Buddha",
    "Golden Mandala",
    "Lyric text styles",
    "Your own design or template",
    "Upload background design",
    "Import visual template",
    "Save current look as template",
  ])
    assert(
      html.includes(name),
      `${name} must be discoverable without a recording or provider connection`,
    );
  assert.match(html, /Style preview with sample lyrics/);
  assert.match(html, /choices will carry into the next song/);
});

test("Saved lyric videos expose persistent copy and share links", async () => {
  const { VideoLinkActions } = await import("../app/video-publishing");
  const html = renderToStaticMarkup(
    <VideoLinkActions
      url="/api/studio/lyric-assets?song=test&asset=video"
      title="My song"
    />,
  );
  assert.match(html, /Copy video link/);
  assert.match(html, /Share video link/);
  assert.match(html, /Recipients need access to this Studio/);
  assert.match(html, /Open saved video/);
});
