import { serverStorage as env } from "../../server/storage";
import { privateWorkspace, studioAccess } from "../../studio-access";
import { privateHeaders } from "../studio/store";
import { hasExplicitWords } from "../../clean-content";
import { query } from "../../community/store";
import { blankParty, mixLicense, sources, type Party } from "../../party/data";
import {isPartyFiles,partyFileTracks} from "../../party/file-data";
import {
  catalog,
  jamendoTrack,
  libraryAsset,
  libraryTracks,
  loadParties,
  providerJson,
  publicParty,
  setSelect,
  type LibraryAsset,
  type SetRow,
} from "../../party/server";

export const dynamic = "force-dynamic";
const reply = (data: object, status = 200) =>
  Response.json(data, { status, headers: privateHeaders });
const fail = (error: string, status = 400) => reply({ error }, status);
const idValid = (id: unknown): id is string =>
  typeof id === "string" && /^[a-zA-Z0-9:_-]{1,110}$/.test(id);
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const clean = (value: string) => value && !hasExplicitWords(value);
export async function GET(request: Request) {
  const access = await studioAccess();
  if (!access.id) return fail("Sign in to open Party Mix.", 401);
  try {
    const params = new URL(request.url).searchParams;
    if (params.has("featured")) {
      const rows = await query(
        setSelect +
          " where p.published = 1 and p.featured = 1 order by p.updated desc limit 4",
        access.id,
      ).all<SetRow>();
      return reply({
        parties: rows.results.map((row) => publicParty(row, access.id)),
      });
    }
    return reply(
      await loadParties(
        access.id,
        access.role === "owner",
        !!(await privateWorkspace()),
        (params.get("party") ?? "").slice(0, 110),
      ),
    );
  } catch {
    return fail(
      "Party Mix could not load. Refresh or reopen your offline parties.",
      503,
    );
  }
}
async function readInput(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty request.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (
      let part = await reader.read();
      !part.done;
      part = await reader.read()
    ) {
      size += part.value.byteLength;
      if (size > 350_000) {
        await reader.cancel();
        throw new Error("Choose a smaller cover or party setup.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(await new Blob(chunks as BlobPart[]).text());
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return fail("Open Party Mix directly to make changes.", 403);
  const access = await studioAccess();
  if (!access.id) return fail("Sign in to save a party.", 401);
  if(request.headers.get("X-Party-Workspace")&&request.headers.get("X-Party-Workspace")!==access.id)return fail("Your account changed. Reload before saving this party.",409);
  try {
    const input = await readInput(request);
    if (!input || typeof input !== "object" || Array.isArray(input))
      return fail("Invalid request.");
    const admin = access.role === "owner";
    if (input.action === "save") {
      const p = input.party as Party;
      if(p?.files!==undefined&&(!isPartyFiles(p.files)||p.published||p.files.some(f=>hasExplicitWords(f.name,f.prompt,f.genre))))return fail("Party files must be private, with 1–4 valid files up to 30 minutes each.");
      if(p?.fileMix&&(!p.files||!idValid(p.fileMix.songId)||!idValid(p.fileMix.audioId)||!Number.isFinite(p.fileMix.seconds)||p.fileMix.seconds<=0||p.fileMix.seconds>7200.1||typeof p.fileMix.key!=="string"||p.fileMix.key.length>16000))return fail("Check the combined party file.");
      if (
        !p ||
        !idValid(p.id) ||
        !Number.isSafeInteger(p.revision) ||
        p.revision < 0 ||
        !clean(text(p.name, 81)) ||
        p.name.length > 80
      )
        return fail("Choose a clean party name up to 80 characters.");
      if (
        !Array.isArray(p.tracks) ||
        (!p.tracks.length&&!p.files?.length) ||
        p.tracks.length > (p.files?96:24) ||
        !p.tracks.every(idValid) ||
        new Set(p.tracks).size !== p.tracks.length
      )
        return fail("Choose 1 to 24 different tracks.");
      if(p.files&&JSON.stringify([...p.tracks].sort())!==JSON.stringify(partyFileTracks(p.files).sort()))return fail("The party's source list must match its file tracks.");
      if (
        !Array.isArray(p.tags) ||
        p.tags.length > 12 ||
        p.tags.some((t) => typeof t !== "string" || !clean(t) || t.length > 35)
      )
        return fail("Choose up to 12 clean vibe tags.");
      if (
        !Number.isFinite(p.fade) ||
        p.fade < 0 ||
        p.fade > 20 ||
        typeof p.beatmatch !== "boolean" ||
        typeof p.published !== "boolean"
      )
        return fail("Check your crossfade settings.");
      if (
        typeof p.cover !== "string" ||
        (!["solar", "violet", "ocean", "rose"].includes(p.cover) &&
          !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]{1,280000}$/.test(
            p.cover,
          ))
      )
        return fail("Choose a cover image under 200 KB.");
      const available = [
        ...(await catalog(access.id, !!(await privateWorkspace()))),
        ...(await libraryTracks()),
      ];
      if (!p.tracks.every((id) => available.some((t) => t.id === id)))
        return fail(
          "A track was removed or is no longer shared. Remove it before saving.",
          409,
        );
      if (p.published && p.tracks.some((id) => id.startsWith("mine:")))
        return fail(
          "Publish private songs in the Artist Dashboard, then add their Community versions before publishing this party.",
        );
      const tempos: Record<string, number> = {};
      for (const id of p.tracks) {
        const value = p.tempos?.[id];
        if (
          value !== undefined &&
          (!Number.isFinite(value) || value < 40 || value > 240)
        )
          return fail("Track tempo must be between 40 and 240 BPM.");
        if (value !== undefined) tempos[id] = value;
      }
      const next = {
        ...blankParty(),
        id: p.id,
        name: p.name.trim(),
        tags: p.tags,
        cover: p.cover,
        tracks: p.tracks,
        fade: p.fade,
        beatmatch: p.files?false:p.beatmatch,
        tempos,
        published: p.published,
        revision: p.revision + 1,
        ...(p.files?{files:p.files}:{}),
        ...(p.fileMix?{fileMix:p.fileMix}:{}),
      };
      const content = JSON.stringify(next);
      const result =
        p.revision === 0
          ? await query(
              `insert into party_sets (id, owner, content, revision, published, featured, updated)
            select ?, ?, ?, 1, ?, 0, ? where (select count(*) from party_sets where owner = ?) < 50 on conflict do nothing`,
              p.id,
              access.id,
              content,
              Number(p.published),
              Date.now(),
              access.id,
            ).run()
          : await query(
              `update party_sets set content = ?, revision = revision + 1, published = ?, updated = ?,
            featured = case when ? = 0 then 0 else featured end where id = ? and owner = ? and revision = ?`,
              content,
              Number(p.published),
              Date.now(),
              Number(p.published),
              p.id,
              access.id,
              p.revision,
            ).run();
      return result.meta.changes
        ? reply({ party: next })
        : fail(
            "A newer save exists, or your profile has 50 parties. Reload before editing.",
            409,
          );
    }
    if (input.action === "import") {
      if (!admin) return fail("Owner access is required.", 403);
      const id = text(input.id, 20);
      if (!/^\d+$/.test(id))
        return fail("Enter the numeric track ID from the source page.");
      let track: LibraryAsset;
      if (input.source === "Jamendo") track = await jamendoTrack(id);
      else if (input.source === "ccMixter") {
        const data = await providerJson(
          "https://ccmixter.org/api/query?f=json&ids=" + id + "&limit=1",
        );
        const item = Array.isArray(data) ? data[0] : null;
        const licenseUrl = item?.license_url;
        const license =
          typeof licenseUrl === "string" ? mixLicense(licenseUrl) : null;
        const file = item?.files?.find((f: { download_url?: string }) =>
          f.download_url?.endsWith(".mp3"),
        );
        if (!license || !file || item?.upload_extra?.nsfw === true)
          return fail(
            "ccMixter did not return an eligible CC BY/CC0 MP3. Upload a reviewed file instead.",
          );
        const audio = new URL(file.download_url);
        if (
          audio.protocol !== "https:" ||
          !/(^|\.)ccmixter\.org$/.test(audio.hostname)
        )
          return fail("This download location requires a reviewed upload.");
        track = {
          id: "ccmixter:" + id,
          title: text(item.upload_name, 120),
          artist: text(item.user_real_name || item.user_name, 120),
          source: "ccMixter",
          seconds: (() => {
            const parts = String(file.file_format_info?.ps ?? "")
              .split(":")
              .map(Number);
            return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
          })(),
          bpm: Number(item.upload_extra?.bpm) || 0,
          tags: String(item.upload_extra?.usertags ?? "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 12),
          license,
          licenseUrl,
          sourceUrl:
            "https://ccmixter.org/files/" +
            encodeURIComponent(item.user_name) +
            "/" +
            id,
          attribution:
            "Credit the artist, source samples and contributors listed on the source page. Crossfading and tempo adjustments may be applied.",
          format: "mp3",
          video: false,
          revision: crypto.randomUUID(),
          audioUrl: audio.href,
        };
      } else
        return fail(
          "FMA files require a reviewed upload. FMA does not provide the former app API.",
        );
      if (!clean(track.title) || !clean(track.artist))
        return fail("This track’s text needs review.");
      if (
        ((await query("select count(*) as n from party_library").first<number>(
          "n",
        )) ?? 0) >= 300
      )
        return fail("The curated library has reached 300 entries.");
      const result = await query(
        "insert into party_library values (?, ?, 0) on conflict do nothing",
        track.id,
        JSON.stringify(track),
      ).run();
      return result.meta.changes
        ? reply({
            ok: true,
            message:
              "Imported for review. Verify the audio, rights and attribution, then enable it.",
          })
        : fail("This track is already imported. Review it below.", 409);
    }
    if (input.action === "library") {
      if (!admin || !idValid(input.id) || typeof input.active !== "boolean")
        return fail("Owner access and a library track are required.", 403);
      if (input.active && input.reviewed !== true)
        return fail(
          "Confirm you reviewed the license, attribution, and clean audio.",
        );
      const existing = await query(
        "select content from party_library where id = ?",
        input.id,
      ).first<string>("content");
      if (!existing) return fail("Choose a library track.", 404);
      const track = JSON.parse(existing) as LibraryAsset;
      if (input.active) {
        const credit = text(input.attribution, 3001);
        if (!clean(credit) || credit.length > 3000)
          return fail(
            "Enter the complete required credits from the source page before enabling this track.",
          );
        track.attribution = credit;
        track.revision = crypto.randomUUID();
      }
      await query(
        "update party_library set active = ?, content = ? where id = ?",
        Number(input.active),
        JSON.stringify(track),
        input.id,
      ).run();
      return reply({ ok: true });
    }
    if (input.action === "upload") return fail("Use the library upload form.");
    if (!idValid(input.id)) return fail("Choose a party.");
    const row = await query(
      "select * from party_sets where id = ?",
      input.id,
    ).first<SetRow>();
    if (!row || (!row.published && row.owner !== access.id && !admin))
      return fail("This party is unavailable.", 404);
    if (input.action === "feature" || input.action === "remove") {
      if (!admin || typeof input.value !== "boolean")
        return fail("Owner access is required.", 403);
      if (input.action === "feature")
        await query(
          "update party_sets set featured = ? where id = ? and published = 1",
          Number(input.value),
          row.id,
        ).run();
      else
        await query(
          "update party_sets set published = 0, featured = 0, revision = revision + 1 where id = ?",
          row.id,
        ).run();
      return reply({ ok: true });
    }
    if (input.action === "like") {
      if (!row.published || typeof input.value !== "boolean")
        return fail("Choose a published party.");
      if (input.value)
        await query(
          "insert into party_likes values (?, ?) on conflict do nothing",
          row.id,
          access.id,
        ).run();
      else
        await query(
          "delete from party_likes where party = ? and viewer = ?",
          row.id,
          access.id,
        ).run();
      return reply({ ok: true });
    }
    if (input.action === "comment") {
      const body = text(input.body, 501);
      if (!row.published || !clean(body) || body.length > 500)
        return fail("Write a kind, clean comment up to 500 characters.");
      const result = await query(
        `insert into party_comments select ?, ?, ?, ?, ?, ?
        where (select count(*) from party_comments where viewer = ? and party = ?) < 3
        and (select count(*) from party_comments where viewer = ?) < 300`,
        crypto.randomUUID(),
        row.id,
        access.id,
        body,
        Number(admin),
        Date.now(),
        access.id,
        row.id,
        access.id,
      ).run();
      if (!result.meta.changes)
        return fail("You can leave up to three comments on each party.", 429);
      return reply({
        ok: true,
        message: admin ? "Comment posted." : "Comment sent for review.",
      });
    }
    if (
      input.action === "moderate" &&
      admin &&
      idValid(input.commentId) &&
      typeof input.approve === "boolean"
    ) {
      if (input.approve)
        await query(
          "update party_comments set approved = 1 where id = ? and party = ?",
          input.commentId,
          row.id,
        ).run();
      else
        await query(
          "delete from party_comments where id = ? and party = ?",
          input.commentId,
          row.id,
        ).run();
      return reply({ ok: true });
    }
    return fail("Unknown Party Mix action.");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Party Mix could not save. Try again.";
    if (
      /Configure JAMENDO|music source|ccMixter|Jamendo|smaller cover/.test(
        message,
      )
    )
      return fail(message, 422);
    return fail(
      "Party Mix could not complete the request. Refresh and try again.",
      503,
    );
  }
}
