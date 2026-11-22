import assert from "node:assert/strict";
import test from "node:test";
import { clearButRichVocals, maxStyleTags, polishChunks, qualityNegatives, qualityTags, sectionRole } from "../app/music-quality";

test("each song part gets its own role so the song builds", () => {
  assert.equal(sectionRole("[Chorus]\nSing it loud")?.name, "chorus");
  assert.equal(sectionRole("[Pre-Chorus]\nRising")?.name, "pre-chorus");
  assert.equal(sectionRole("[Verse 2]\nQuiet words")?.name, "verse");
  assert.equal(sectionRole("[Bridge]\nTurn")?.name, "bridge");
  assert.equal(sectionRole("[Instrumental outro]")?.name, "outro");
  assert.equal(sectionRole("no heading"), null);
});

test("quality tags are never cut, the singer and genre stay first, at most 20 tags", () => {
  const own = ["Vocal performance direction: warm male baritone", "Arabic pop", "Male lead", ...Array.from({ length: 30 }, (_, i) => `style ${i}`)];
  const [verse, chorus] = polishChunks([{ text: "[Verse]\nHello night", positive_styles: own }, { text: "[Chorus]\nShine on", positive_styles: own }]);
  const v = verse.positive_styles as string[], c = chorus.positive_styles as string[];
  assert.equal(v[0], "Vocal performance direction: warm male baritone");
  assert.equal(v[1], "Arabic pop");
  for (const tag of qualityTags) assert(v.includes(tag) && c.includes(tag), tag);
  assert(v.length <= maxStyleTags && c.length <= maxStyleTags);
  assert(c.includes("layered backing harmonies") && !v.includes("layered backing harmonies"), "the chorus is bigger than the verse");
  assert(v.includes("intimate verse"));
  assert(v.includes("expressive emotional lead vocal"));
});

test("avoid list gets the plain-sound negatives; 'Avoid …' text no longer wastes style slots", () => {
  const [chunk] = polishChunks([{ text: "[Verse]\nWords", positive_styles: ["Soul", "Avoid profanity", "graphic violence"], negative_styles: ["profanity"] }]);
  assert(!(chunk.positive_styles as string[]).some(s => /avoid|violence/i.test(s)));
  assert.deepEqual(chunk.negative_styles, ["profanity", ...qualityNegatives]);
});

test("a requested lo-fi or dry sound is respected", () => {
  const [chunk] = polishChunks([{ text: "[Verse]\nWords", positive_styles: ["lo-fi bedroom pop", "dry close vocal"], negative_styles: [] as string[] }]);
  assert.deepEqual(chunk.negative_styles, []);
});

test("instrumental parts get no vocal tags; vocals are clear but not bare", () => {
  const [part] = polishChunks([{ text: "[Instrumental outro]", positive_styles: [] }]);
  assert(!(part.positive_styles as string[]).includes("natural vibrato"));
  assert.doesNotMatch(clearButRichVocals, /restrained reverb|avoid added ad-libs/i);
  assert.match(clearButRichVocals, /^Vocal production: clear forward intelligible lead vocal/);assert.match(clearButRichVocals, /full rich arrangement/);
});
