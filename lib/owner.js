// The private owner page: Samadhi signs in here to post teachings, videos, podcasts and photos.
// Only someone with OWNER_PASSWORD (set in Replit Secrets) can get in.
import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { categories, site } from "./content.js";
import { escapeHtml as e } from "./md.js";
import { youtubeId, socials } from "./media.js";
import { readBody, parseForm, one } from "./forms.js";
import {
  refresh, allPosts, findPost, savePosts, saveLinks, savedLinks, storageOk,
  newId, slugFor, saveMedia, deleteMedia,
} from "./posts.js";

const COOKIE = "sl_owner";
const SESSION_SECONDS = 12 * 60 * 60;
const MAX_TRIES = 5, LOCK_MS = 15 * 60 * 1000;
const MAX_UPLOAD = 31 * 1024 * 1024;

const password = () => process.env.OWNER_PASSWORD || "";
const ready = () => password().length >= 10;
const key = () => createHash("sha256").update("samadhi-owner-v1:" + password()).digest();
const sign = (text) => createHmac("sha256", key()).update(text).digest("base64url");

function sameText(a, b) {
  const x = createHash("sha256").update(String(a)).digest(), y = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(x, y);
}

function cookieValue(req, name) {
  for (const part of String(req.headers.cookie || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

export function signedIn(req) {
  if (!ready()) return false;
  const [exp, nonce, mac] = cookieValue(req, COOKIE).split(".");
  if (!exp || !nonce || !mac) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  return sameText(mac, sign(`${exp}.${nonce}`));
}

function sessionCookie() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const nonce = randomBytes(9).toString("base64url");
  return `${COOKIE}=${exp}.${nonce}.${sign(`${exp}.${nonce}`)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}
const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

// Wrong-password protection: 5 wrong tries from one place locks it for 15 minutes;
// 20 wrong tries from anywhere locks sign-in for everyone for 15 minutes.
const tries = new Map();
let allFails = [];
function clientId(req) { return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim(); }
function locked(req) {
  const now = Date.now();
  allFails = allFails.filter((t) => now - t < LOCK_MS);
  if (allFails.length >= 20) return true;
  const t = tries.get(clientId(req));
  return Boolean(t && t.count >= MAX_TRIES && now - t.last < LOCK_MS);
}
function failed(req) {
  const id = clientId(req), now = Date.now();
  const t = tries.get(id);
  const count = t && now - t.last < LOCK_MS ? t.count + 1 : 1;
  tries.set(id, { count, last: now });
  allFails.push(now);
}
export function resetOwnerForTests() { tries.clear(); allFails = []; }

// A form must be sent from this same site (stops other websites from posting in Samadhi's name).
function fromThisSite(req) {
  const host = String(req.headers.host || "");
  const source = req.headers.origin || req.headers.referer || "";
  if (!source || !host) return false;
  try { return new URL(source).host === host; } catch { return false; }
}

// ---------- Pages ----------

function shell(title, body, { signedInNow = true } = {}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${e(title)} · Owner · ${e(site.name)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/site.css"></head>
<body class="owner"><header class="owner-top"><a class="brand" href="/owner">${e(site.name)} · Owner</a>
${signedInNow ? `<nav><a href="/" target="_blank" rel="noopener">View site</a><form method="post" action="/owner/logout"><button class="linkish" type="submit">Sign out</button></form></nav>` : ""}</header>
<main class="owner-main">${body}</main><script src="/owner.js" defer></script></body></html>`;
}

function notice(text, kind = "ok") { return text ? `<p class="owner-note ${kind}" role="status">${e(text)}</p>` : ""; }

function loginPage(message = "") {
  if (!ready()) return shell("Not set up", `<h1>The owner page is not switched on yet</h1>
<p>To switch it on, add a secret named <strong>OWNER_PASSWORD</strong> in Replit (Tools → Secrets) with a strong password of at least 10 characters, then republish.</p>
<p>Never paste this password into a chat.</p>`, { signedInNow: false });
  return shell("Sign in", `<h1>Sign in</h1>${notice(message, "warn")}
<form method="post" action="/owner/login" class="owner-form narrow-form">
<label>Owner password<input type="password" name="password" autocomplete="current-password" required autofocus></label>
<button class="btn btn-gold" type="submit">Sign in</button></form>`, { signedInNow: false });
}

const kindLabel = { teaching: "Teaching", video: "Video", podcast: "Podcast", photo: "Photo" };
const statusLabel = { published: "On the site", draft: "Draft", hidden: "Hidden" };

function dashboard(message = "") {
  const store = storageOk() ? "" : notice("Storage is not reachable right now, so nothing can be saved. If this keeps happening, App Storage needs to be set up in Replit.", "warn");
  const rows = allPosts().map((p) => {
    const toggle = p.status === "published"
      ? `<button name="to" value="hidden">Hide</button>`
      : `<button name="to" value="published">${p.status === "draft" ? "Publish" : "Show"}</button>`;
    const view = p.status === "published" && p.kind === "teaching" ? ` · <a href="/teachings/${e(p.slug)}" target="_blank" rel="noopener">View</a>` : "";
    return `<li class="owner-item"><div><span class="badge">${kindLabel[p.kind] || p.kind}</span>${p.lang === "ar" ? '<span class="badge">عربي</span>' : ""}
<span class="state state-${p.status}">${statusLabel[p.status] || p.status}</span>
<strong dir="auto">${e(p.title || p.caption || "(no title)")}</strong><small>${e((p.updated || p.created || "").slice(0, 10))}${view}</small></div>
<div class="owner-actions"><a class="btn btn-ghost" href="/owner/edit?id=${e(p.id)}">Edit</a>
<form method="post" action="/owner/status"><input type="hidden" name="id" value="${e(p.id)}">${toggle}</form>
<a class="btn btn-ghost danger" href="/owner/delete?id=${e(p.id)}">Delete</a></div></li>`;
  }).join("");
  return shell("Owner page", `<h1>Welcome, Samadhi</h1>${notice(message)}${store}
<div class="owner-buttons">
<a class="btn btn-gold" href="/owner/new?kind=teaching">New Teaching</a>
<a class="btn btn-teal" href="/owner/new?kind=video">Add Video</a>
<a class="btn btn-teal" href="/owner/new?kind=podcast">Add Podcast</a>
<a class="btn btn-teal" href="/owner/new?kind=photo">Upload Photos</a>
<a class="btn btn-ghost" href="/owner/links">My Links</a>
<a class="btn btn-ghost" href="/owner/export">Export backup</a></div>
<h2>Everything you have posted</h2>
${rows ? `<ul class="owner-list">${rows}</ul>` : `<p class="owner-empty">Nothing yet. Start with New Teaching.</p>`}`);
}

const tabOptions = (current) => categories.map((c) => `<option value="${c.id}"${c.id === current ? " selected" : ""}>${e(c.label)}</option>`).join("");
const radio = (name, value, label, current) => `<label class="choice"><input type="radio" name="${name}" value="${value}"${value === current ? " checked" : ""}> ${label}</label>`;

function editor(kind, post = {}, message = "") {
  const id = post.id ? `<input type="hidden" name="id" value="${e(post.id)}">` : "";
  const head = `${post.id ? "Edit" : "New"} ${kindLabel[kind] || ""}`;
  let fields = "";
  if (kind === "teaching") {
    fields = `<fieldset class="choices"><legend>Language</legend>${radio("lang", "en", "English", post.lang || "en")}${radio("lang", "ar", "عربي Arabic", post.lang)}</fieldset>
<label>Title<input name="title" required maxlength="160" dir="auto" value="${e(post.title || "")}"></label>
<label>Which Library tab<select name="tab">${tabOptions(post.tab || "teachings")}</select></label>
<label>One-line summary <small>(optional; shown on the Library card)</small><input name="summary" maxlength="240" dir="auto" value="${e(post.summary || "")}"></label>
<label>Your teaching <small>(type, paste, or tap the microphone on your phone keyboard to speak. A blank line starts a new paragraph. A line starting with ## becomes a heading.)</small>
<textarea name="body" rows="16" required dir="auto">${e(post.body || "")}</textarea></label>
<label>Cover photo <small>(optional)</small><input type="file" name="cover" accept="image/jpeg,image/png,image/webp" data-resize></label>
${post.cover ? `<p class="current"><img src="/${e(post.cover)}" alt="" width="160"> <label class="choice"><input type="checkbox" name="removeCover" value="1"> Remove this photo</label></p>` : ""}
<label>YouTube link <small>(optional)</small><input name="youtube" inputmode="url" value="${e(post.youtube || "")}" placeholder="https://www.youtube.com/watch?v=..."></label>`;
  } else if (kind === "video") {
    fields = `<label>Title<input name="title" required maxlength="160" dir="auto" value="${e(post.title || "")}"></label>
<label>YouTube link<input name="youtube" required inputmode="url" value="${e(post.youtube || "")}" placeholder="https://www.youtube.com/watch?v=..."></label>
<label>A line about it <small>(optional)</small><input name="note" maxlength="240" dir="auto" value="${e(post.note || "")}"></label>`;
  } else if (kind === "podcast") {
    fields = `<label>Title<input name="title" required maxlength="160" dir="auto" value="${e(post.title || "")}"></label>
<label>A line about it <small>(optional)</small><input name="note" maxlength="240" dir="auto" value="${e(post.note || "")}"></label>
<label>Link <small>(YouTube, Spotify, SoundCloud…; optional if you upload a recording)</small><input name="link" inputmode="url" value="${e(post.link || "")}" placeholder="https://..."></label>
<label>Or upload a recording <small>(MP3, M4A, WAV or OGG, up to 30 MB)</small><input type="file" name="audio" accept="audio/*"></label>
${post.audio ? `<p class="current"><audio controls preload="none" src="/${e(post.audio)}"></audio> <label class="choice"><input type="checkbox" name="removeAudio" value="1"> Remove this recording</label></p>` : ""}`;
  } else if (kind === "photo") {
    fields = post.id
      ? `<p class="current"><img src="/${e(post.file)}" alt="" width="240"></p>
<label>Caption <small>(optional)</small><input name="caption" maxlength="240" dir="auto" value="${e(post.caption || "")}"></label>`
      : `<label>Photos or art <small>(choose one or many; they are made smaller automatically before sending)</small><input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple required data-resize></label>
<label>Caption <small>(optional; used for all the photos you pick now)</small><input name="caption" maxlength="240" dir="auto"></label>`;
  }
  const publishLabel = post.status === "published" ? "Save changes" : "Publish";
  return shell(head, `<p><a href="/owner">← Back</a></p><h1>${head}</h1>${notice(message, "warn")}
<form method="post" action="/owner/save" enctype="multipart/form-data" class="owner-form" data-owner-form>
<input type="hidden" name="kind" value="${e(kind)}">${id}${fields}
<p class="owner-sending" hidden>Sending… please keep this page open.</p>
<div class="owner-buttons"><button class="btn btn-gold" type="submit" name="action" value="publish">${publishLabel}</button>
${kind === "teaching" && post.status !== "published" ? `<button class="btn btn-ghost" type="submit" name="action" value="draft">Save draft</button>` : ""}</div></form>`);
}

function linksPage(message = "") {
  const saved = savedLinks();
  const inputs = socials.map((s) => `<label>${e(s.name)}<input name="${e(s.name)}" inputmode="url" value="${e(saved[s.name] ?? s.url ?? "")}" placeholder="https://..."></label>`).join("");
  return shell("My Links", `<p><a href="/owner">← Back</a></p><h1>My Links</h1>${notice(message, "warn")}
<p>Paste the full address of each page. Leave a box empty to hide that button.</p>
<form method="post" action="/owner/links" class="owner-form">${inputs}<div class="owner-buttons"><button class="btn btn-gold" type="submit">Save links</button></div></form>`);
}

function deletePage(post) {
  return shell("Delete", `<p><a href="/owner">← Back</a></p><h1>Delete for good?</h1>
<p dir="auto"><strong>${e(post.title || post.caption || "This item")}</strong> and its photo or recording will be removed forever. If you only want it off the site for now, use Hide instead.</p>
<form method="post" action="/owner/delete" class="owner-buttons"><input type="hidden" name="id" value="${e(post.id)}">
<button class="btn danger-btn" type="submit">Yes, delete forever</button><a class="btn btn-ghost" href="/owner">No, keep it</a></form>`);
}

// ---------- Saving ----------

const now = () => new Date().toISOString();
const httpsOrEmpty = (v) => { const s = String(v || "").trim(); return !s || /^https:\/\/[^\s<>"]+$/.test(s) ? s : null; };

async function save(fields, files) {
  const kind = one(fields.kind);
  if (!kindLabel[kind]) throw new Error("Unknown kind of post.");
  const posts = allPosts();
  const existing = fields.id ? posts.find((p) => p.id === one(fields.id)) : null;
  if (fields.id && !existing) throw new Error("That post no longer exists.");
  const action = one(fields.action) === "draft" ? "draft" : "publish";

  if (kind === "photo" && !existing) {
    const list = files.photos || [];
    if (!list.length) throw new Error("Please choose at least one photo.");
    const added = [];
    for (const f of list) {
      const file = await saveMedia("photo", f.bytes);
      added.push({ id: newId(), kind: "photo", status: "published", file, caption: one(fields.caption).trim().slice(0, 240), created: now(), updated: now() });
    }
    await savePosts([...added, ...posts]);
    return `${added.length} photo${added.length > 1 ? "s" : ""} added to the Gallery.`;
  }

  const post = existing ? { ...existing } : { id: newId(), kind, created: now() };
  const removed = [];
  post.updated = now();
  if (kind === "teaching") {
    post.title = one(fields.title).trim().slice(0, 160);
    post.body = one(fields.body).replace(/\r\n/g, "\n").trim();
    if (!post.title || !post.body) throw new Error("A teaching needs a title and some text.");
    post.lang = one(fields.lang) === "ar" ? "ar" : "en";
    post.tab = categories.some((c) => c.id === one(fields.tab)) ? one(fields.tab) : "teachings";
    post.summary = one(fields.summary).trim().slice(0, 240);
    const yt = httpsOrEmpty(one(fields.youtube));
    if (yt === null || (yt && !youtubeId(yt))) throw new Error("That YouTube link doesn't look right. Copy it from the Share button on YouTube.");
    post.youtube = yt;
    if (one(fields.removeCover) && post.cover) { removed.push(post.cover); post.cover = ""; }
    if (files.cover?.[0]) { if (post.cover) removed.push(post.cover); post.cover = await saveMedia("photo", files.cover[0].bytes); }
    if (!existing || !post.slug) post.slug = slugFor(post.title, post.id);
    post.status = existing?.status === "published" ? "published" : action === "draft" ? "draft" : "published";
  } else if (kind === "video") {
    post.title = one(fields.title).trim().slice(0, 160);
    post.youtube = httpsOrEmpty(one(fields.youtube));
    if (!post.title || !post.youtube || !youtubeId(post.youtube)) throw new Error("A video needs a title and a YouTube link.");
    post.note = one(fields.note).trim().slice(0, 240);
    post.status = existing?.status || "published";
  } else if (kind === "podcast") {
    post.title = one(fields.title).trim().slice(0, 160);
    post.note = one(fields.note).trim().slice(0, 240);
    const link = httpsOrEmpty(one(fields.link));
    if (link === null) throw new Error("The link must start with https://");
    post.link = link;
    if (one(fields.removeAudio) && post.audio) { removed.push(post.audio); post.audio = ""; }
    if (files.audio?.[0]) { if (post.audio) removed.push(post.audio); post.audio = await saveMedia("audio", files.audio[0].bytes); }
    if (!post.title || (!post.link && !post.audio)) throw new Error("A podcast needs a title, and a link or a recording.");
    post.status = existing?.status || "published";
  } else if (kind === "photo") {
    post.caption = one(fields.caption).trim().slice(0, 240);
  }
  const next = existing ? posts.map((p) => (p.id === post.id ? post : p)) : [post, ...posts];
  await savePosts(next);
  await deleteMedia(removed);
  return post.status === "draft" ? "Draft saved. Only you can see it." : "Saved. It is on the site now.";
}

// ---------- Router ----------

export async function handleOwner(req, res, pathname, params, send) {
  const html = (status, body, extra = {}) => send(res, status, body, undefined, { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", ...extra });
  const go = (to, extra = {}) => send(res, 303, "", "text/plain; charset=utf-8", { Location: to, "Cache-Control": "no-store", ...extra });
  const post = req.method === "POST";

  if (post && !fromThisSite(req)) return html(403, shell("Refused", "<h1>Refused</h1><p>Forms can only be sent from this site.</p>", { signedInNow: false }));

  if (pathname === "/owner/login") {
    if (!post) return go("/owner");
    if (!ready()) return html(503, loginPage());
    if (locked(req)) return html(429, loginPage("Too many wrong tries. Please wait 15 minutes and try again."));
    let fields;
    try { ({ fields } = parseForm(req.headers["content-type"], await readBody(req, 16 * 1024))); } catch { return html(413, loginPage("Something went wrong. Please try again.")); }
    if (sameText(one(fields.password), password())) { tries.delete(clientId(req)); return go("/owner", { "Set-Cookie": sessionCookie() }); }
    failed(req);
    return html(401, loginPage("That password is not right."));
  }
  if (pathname === "/owner/logout") return go("/owner", { "Set-Cookie": clearCookie });

  if (!signedIn(req)) {
    if (post) return html(401, loginPage("Please sign in again."));
    return html(ready() ? 200 : 503, loginPage());
  }
  await refresh({ force: true });

  if (!post) {
    if (pathname === "/owner") return html(200, dashboard(params.get("done") || ""));
    if (pathname === "/owner/new") { const kind = params.get("kind"); return kindLabel[kind] ? html(200, editor(kind)) : go("/owner"); }
    if (pathname === "/owner/edit") { const p = findPost(params.get("id")); return p ? html(200, editor(p.kind, p)) : go("/owner"); }
    if (pathname === "/owner/delete") { const p = findPost(params.get("id")); return p ? html(200, deletePage(p)) : go("/owner"); }
    if (pathname === "/owner/links") return html(200, linksPage());
    if (pathname === "/owner/export") {
      const data = JSON.stringify({ exported: now(), site: site.name, posts: allPosts(), links: savedLinks(), note: "Photos and recordings stay in App Storage; their names are listed in each post." }, null, 1);
      return send(res, 200, data, "application/json; charset=utf-8", { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="samadhi-love-backup-${now().slice(0, 10)}.json"` });
    }
    return html(404, shell("Not found", `<h1>Not found</h1><p><a href="/owner">Back to the owner page</a></p>`));
  }

  let form;
  try { form = parseForm(req.headers["content-type"], await readBody(req, MAX_UPLOAD)); }
  catch (err) { return html(413, shell("Too large", `<h1>That was too large to send</h1><p>Please send fewer photos at once, or a recording under 30 MB.</p><p><a href="/owner">Back</a></p>`)); }
  const { fields, files } = form;

  try {
    if (pathname === "/owner/save") return go("/owner?done=" + encodeURIComponent(await save(fields, files)));
    if (pathname === "/owner/status") {
      const to = one(fields.to);
      if (!["published", "hidden"].includes(to)) return go("/owner");
      const posts = allPosts().map((p) => (p.id === one(fields.id) ? { ...p, status: to, updated: now() } : p));
      await savePosts(posts);
      return go("/owner?done=" + encodeURIComponent(to === "hidden" ? "Hidden. It is off the site but kept safe." : "It is on the site now."));
    }
    if (pathname === "/owner/delete") {
      const p = findPost(one(fields.id));
      if (!p) return go("/owner");
      await savePosts(allPosts().filter((x) => x.id !== p.id));
      await deleteMedia([p.cover, p.audio, p.file]);
      return go("/owner?done=" + encodeURIComponent("Deleted."));
    }
    if (pathname === "/owner/links") {
      const links = {};
      for (const s of socials) {
        const v = httpsOrEmpty(one(fields[s.name]));
        if (v === null) return html(400, linksPage(`The ${s.name} link must start with https://`));
        links[s.name] = v;
      }
      await saveLinks(links);
      return go("/owner?done=" + encodeURIComponent("Links saved."));
    }
  } catch (err) {
    console.error("Owner save failed:", err.message);
    const kind = one(fields.kind);
    const existing = fields.id ? findPost(one(fields.id)) : null;
    const draft = { ...(existing || {}), ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, one(v)])) };
    const message = /App Storage/.test(err.message) ? "Storage is not reachable, so this was not saved. Please try again in a minute." : err.message;
    if (kindLabel[kind]) return html(400, editor(kind, existing ? { ...draft, id: existing.id, status: existing.status } : { ...draft, id: undefined }, message));
    return html(400, dashboard(message));
  }
  return go("/owner");
}
