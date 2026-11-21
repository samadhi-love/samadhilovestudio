import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  lyricBackgroundGroups,
  applyCustomLyricBackground,
} from "../app/lyric-background-picker";
import {
  videoThemes,
  isLyricProject,
  type LyricProject,
} from "../app/lyric-video-data";
import { freshSong } from "../app/studio-data";
import { newProSettings } from "../app/lyric-pro-data";
import {
  makeVisualTemplate,
  parseVisualTemplate,
  applyVisualTemplate,
  decodeTemplateBackground,
} from "../app/lyric-visual-template";
const song = {
  ...freshSong("original-song", "Original song", 0),
  audioId: "original-audio",
  audioFormat: "mp3" as const,
};
const project: LyricProject = {
  cues: [{ text: "Approved original lyrics", time: 1, end: 4 }],
  theme: "masters",
  motion: "drift",
  format: "vertical",
  captionTemplate: "neon-pulse",
  font: "clean",
  color: "turquoise",
  pro: {
    ...newProSettings(song, 60),
    approvedLyrics: "[Verse]\nApproved original lyrics",
    background: "old-image",
    sections: [
      {
        id: "one",
        name: "Verse",
        time: 0,
        end: 30,
        theme: "nature",
        language: "Lebanese Arabic",
        singer: "Lead A",
      },
      {
        id: "two",
        name: "Chorus",
        time: 30,
        end: 60,
        theme: "ocean",
        singer: "Lead B",
      },
    ],
  },
};
test("existing twelve-design collections and cosmic world music have distinct available designs", () => {
  const ids = Object.values(lyricBackgroundGroups).flatMap((g) => g.themes);
  assert.equal(ids.length, 49); // 39 + 4 kids + 3 USA & New York + 3 favourite-animal scenes
  assert.equal(new Set(ids).size, 49);
  const sizes: Record<string, number> = { world: 3, kids: 7, usa: 3 };
  for (const [name,group] of Object.entries(lyricBackgroundGroups)) {
    assert.equal(group.themes.length, sizes[name] ?? 12);
    for (const id of group.themes) {
      assert(isLyricProject({ ...project, theme: id }));
      if (videoThemes[id].image)
        assert(
          existsSync(path.join(process.cwd(), "public", videoThemes[id].image)),
        );
    }
  }
});
test("visual templates round-trip without importing song audio, lyrics, source IDs or timing", async () => {
  const template = makeVisualTemplate(project, "My sacred look");
  const json = JSON.stringify(template);
  assert(!json.includes("original-audio"));
  assert(!json.includes("Approved original lyrics"));
  const imported = parseVisualTemplate(JSON.parse(json)),
    next = applyVisualTemplate({ ...project, theme: "rose" }, imported);
  assert.equal(next.theme, "masters");
  assert.equal(next.cues, project.cues);
  assert.equal(next.pro?.sourceAudioId, "original-audio");
  assert.equal(next.pro?.approvedLyrics, project.pro?.approvedLyrics);
  assert.equal(next.pro?.sections[0].language, "Lebanese Arabic");
  assert.equal(next.pro?.sections[0].singer, "Lead A");
  const fromProject = parseVisualTemplate({
    schema: "samadhi-lyric-video-pro/v1",
    project,
  });
  assert.equal(fromProject.visual.captionTemplate, "neon-pulse");
  const basic = makeVisualTemplate({
    ...project,
    captionTemplate: undefined,
    font: "classic",
  });
  assert.equal(
    applyVisualTemplate(
      project,
      parseVisualTemplate(JSON.parse(JSON.stringify(basic))),
    ).captionTemplate,
    undefined,
  );
  const image = {
    ...template,
    background: {
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6kAAAAABJRU5ErkJggg==",
    },
  };
  const decoded = decodeTemplateBackground(
    parseVisualTemplate(JSON.parse(JSON.stringify(image))),
  )!;
  assert.equal(decoded.type, "image/png");
  assert.deepEqual(
    [...new Uint8Array(await decoded.arrayBuffer()).subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
  assert.throws(() =>
    parseVisualTemplate({
      ...template,
      visual: { ...template.visual, font: "arbitrary-css" },
    }),
  );
  assert.throws(() =>
    parseVisualTemplate({
      ...template,
      background: { dataUrl: "data:image/svg+xml;base64,PHN2Zy8+" },
    }),
  );
  assert.throws(() =>
    parseVisualTemplate({
      ...template,
      background: { dataUrl: "https://example.test/image.png" },
    }),
  );
});
test("custom designs can target a section or the whole video without changing its recording", () => {
  const all = applyCustomLyricBackground(project, "new-design", "all", 15);
  assert.equal(all.pro?.background, "new-design");
  assert(
    all.pro?.sections.every(
      (s) => s.background === undefined && s.theme === undefined,
    ),
  );
  assert.equal(all.cues, project.cues);
  assert.equal(all.pro?.sourceAudioId, "original-audio");
  const one = applyCustomLyricBackground(
    project,
    "verse-design",
    "section",
    15,
  );
  assert.equal(one.pro?.sections[0].background, "verse-design");
  assert.deepEqual(one.pro?.sections[1], project.pro?.sections[1]);
  assert.equal(one.pro?.background, "old-image");
  assert.equal(
    applyCustomLyricBackground(project, "x", "section", 70),
    project,
  );
});
