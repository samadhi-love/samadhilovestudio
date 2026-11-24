import { test } from "node:test";
import assert from "node:assert/strict";
import { categories, findTeaching } from "../lib/content.js";

process.env.PREVIEW_PASSWORD = "yoga-page-test";
delete process.env.SITE_PUBLIC;
const { handle } = await import("../server.js");

function call(path, authenticated = true) {
  return new Promise((resolve) => {
    const headers = { host: "site.test", ...(authenticated ? { authorization: "Basic " + Buffer.from("test:yoga-page-test").toString("base64") } : {}) };
    const response = { writeHead(status, h) { this.status = status; this.headers = h; }, end(body) { this.body = String(body || ""); resolve(this); } };
    handle({ url: path, method: "GET", headers }, response);
  });
}

test("the yoga teaching sits right after Meditation and Prayer, with working neighbours", async () => {
  const teachings = categories.find((c) => c.id === "teachings").items;
  const index = teachings.findIndex((item) => item.slug === "meditation-and-yoga");
  assert.ok(index > 0);
  assert.equal(teachings[index - 1].slug, "meditation-and-prayer");
  const page = await call("/teachings/meditation-and-yoga");
  assert.equal(page.status, 200);
  const nav = page.body.match(/<nav class="next"[\s\S]*?<\/nav>/)?.[0];
  for (const n of [teachings[index - 1], teachings[index + 1]]) assert.ok(nav.includes(`href="/teachings/${n.slug}"`));
  assert.equal((await call("/teachings/meditation-and-yoga", false)).status, 401);
});

test("the yoga teaching has its sections, sources, safety note and links", async () => {
  const { item } = findTeaching("meditation-and-yoga");
  assert.deepEqual([...item.body.matchAll(/^## (.+)$/gm)].map((m) => m[1]), ["What they are", "What research shows", "The eight limbs of yoga", "The paths of yoga", "Modern yoga styles", "Forms of meditation across the traditions", "A gentle way to begin"]);
  const { body } = await call("/teachings/meditation-and-yoga");
  assert.match(body, /href="https:\/\/www.nccih.nih.gov\/health\/yoga-effectiveness-and-safety"/);
  assert.match(body, /Nothing here replaces medical advice/);
  assert.match(body, /Wisdom from the traditions/);
  for (const slug of ["meditation-and-prayer", "kriya-yoga", "awakening-the-chakras", "the-seven-chakras"]) assert.ok(body.includes(`href="/teachings/${slug}"`), slug);
});
