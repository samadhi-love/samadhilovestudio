import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { categories, findTeaching, homePaths } from "../lib/content.js";
import { agesOfWorld } from "../lib/ages.js";
import { pages, sitemapXml } from "../lib/pages.js";
import { pictureForTeaching, pictureFor, backdropFor, creditFor } from "../lib/pictures.js";
import { escapeHtml } from "../lib/md.js";

const render = url => {
  const parsed = new URL(url, "http://localhost");
  return pages.route(parsed.pathname, parsed.searchParams);
};
const slugs = [
  "the-great-cycle", "the-four-yugas", "the-rising-ages", "hesiods-five-ages",
  "the-astrological-ages", "stone-bronze-and-iron-in-history", "the-golden-age-to-come",
];

test("the Ages of the World Library tab follows Great Flood and contains the seven approved teachings in order", () => {
  const index = categories.findIndex(c => c.id === "ages-of-the-world");
  assert.equal(categories[index - 1].id, "great-flood");
  assert.equal(categories[index].label, "The Ages of the World");
  assert.deepEqual(agesOfWorld.map(t => t.slug), slugs);
  assert.deepEqual(agesOfWorld.map(t => t.title), [
    "The Great Cycle", "The Four Yugas", "The Rising Ages", "Hesiod's Five Ages",
    "The Astrological Ages", "Stone, Bronze and Iron in History", "The Golden Age to Come",
  ]);
  const html = render("/library?tab=ages-of-the-world");
  assert.match(html, /class="tab" href="\/library\?tab=ages-of-the-world" aria-current="page"/);
  let previous = -1;
  for (const slug of slugs) {
    const at = html.indexOf(`class="more" href="/teachings/${slug}"`);
    assert.ok(at > previous, slug);
    previous = at;
  }
  assert.ok(render("/").includes("/library?tab=ages-of-the-world"), "the home page's History & Origins family links to it");
});

test("every new teaching renders with working Previous and Next links and appears in the sitemap", () => {
  const allSlugs = categories.flatMap(c => c.items.map(t => t.slug));
  assert.equal(new Set(allSlugs).size, allSlugs.length, "no duplicate teaching addresses");
  for (let i = 0; i < agesOfWorld.length; i++) {
    const item = agesOfWorld[i];
    assert.ok(findTeaching(item.slug));
    const html = render("/teachings/" + item.slug);
    assert.equal(html?.match(/<h1\b[^>]*>([^]*?)<\/h1>/)?.[1], escapeHtml(item.title), item.slug);
    assert.ok(html.includes('href="/library?tab=ages-of-the-world"'), "back to its tab");
    const more = html.match(/<nav class="next"[^]*?<\/nav>/)?.[0] || "";
    if (i > 0) assert.ok(more.includes(`href="/teachings/${slugs[i - 1]}"`), "previous");
    if (i < slugs.length - 1) assert.ok(more.includes(`href="/teachings/${slugs[i + 1]}"`), "next");
    else assert.ok(more.includes('href="/library?tab=ages-of-the-world"'), "last returns to tab");
    assert.ok(sitemapXml().includes(`/teachings/${item.slug}</loc>`), "sitemap");
  }
});

test("the Puranic and Yukteswar chronologies remain distinct and include the approved numbers", () => {
  const puranic = agesOfWorld[1].body;
  for (const value of ["Satya", "Krita", "Treta", "Dvapara", "Kali", "1,728,000", "1,296,000", "864,000", "432,000", "4:3:2:1", "3102 BCE", "Four legs", "Three legs", "Two legs", "One leg"]) {
    assert.ok(puranic.includes(value), value);
  }
  const rising = agesOfWorld[2].body;
  for (const value of ["Sri Yukteswar", "Paramahansa Yogananda", "1894", "24,000", "12,000", "4,800", "3,600", "2,400", "1,200", "499 AD", "1699", "1700", "1900", "4099", "not an established scientific chronology", "/teachings/kriya-yoga"]) {
    assert.ok(rising.includes(value), value);
  }
});

test("the classical, astronomical and archaeological accounts preserve their important distinctions", () => {
  for (const value of ["700 BCE", "Kronos", "Thebes", "Troy", "Heroes", "Ovid", "Deucalion", "/library?tab=great-flood"]) {
    assert.ok(agesOfWorld[3].body.includes(value), value);
  }
  for (const value of ["25,800", "2,150", "Taurus", "Aries", "Pisces", "Aquarius", "unequal", "Start dates are debated"]) {
    assert.ok(agesOfWorld[4].body.includes(value), value);
  }
  for (const value of ["C. J. Thomsen", "1836", "3300–1200 BCE", "1200 BCE", "dates vary by region", "different meanings"]) {
    assert.ok(agesOfWorld[5].body.includes(value), value);
  }
  assert.ok(agesOfWorld[6].body.includes("does **not** set out a dated, repeating return"));
});

test("the new pages use existing non-nude landscapes or sky pictures with their original credits", () => {
  const approved = ["milky-way-hd", "mount-kailash", "andromeda-hd", "parthenon", "pleiades-hd", "giza", "orion-hd"];
  const credits = render("/credits");
  for (let i = 0; i < slugs.length; i++) {
    assert.equal(pictureForTeaching[slugs[i]], approved[i]);
    const file = pictureFor(approved[i]);
    if (!file) continue; // Ignored candidate assets are not present in a fresh clone.
    assert.ok(existsSync(new URL("../public/" + file, import.meta.url)));
    assert.ok(render("/teachings/" + slugs[i]).includes(`src="/${backdropFor(file)}"`));
    const credit = creditFor(file);
    assert.ok(credit && (
      /^public domain$/i.test(credit.license) ||
      /^https:\/\/creativecommons\.org\/(?:licenses\/by(?:-sa)?\/|publicdomain\/(?:zero|mark)\/)/.test(credit.licenseUrl)
    ), file);
    assert.ok(credits.includes(escapeHtml(credit.title)), "credited title");
    const source = credit.source.replace(/\(/g, "%28").replace(/\)/g, "%29");
    assert.ok(credits.includes(`href="${escapeHtml(source)}"`), "Commons source link");
  }
});

test("new teaching references have sources and all their internal links resolve", () => {
  for (const item of agesOfWorld) {
    assert.match(item.body, /https:\/\//, item.slug);
    assert.doesNotMatch(item.body, /<img|!\[/, "pictures come only from reviewed mappings");
    for (const link of item.body.matchAll(/\]\((\/[^)]+)\)/g)) {
      assert.ok(render(link[1]), `${item.slug}: ${link[1]}`);
    }
  }
});
