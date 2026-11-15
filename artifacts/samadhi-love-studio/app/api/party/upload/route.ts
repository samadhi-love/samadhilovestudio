import { env } from "cloudflare:workers";
import { studioAccess } from "../../../studio-access";
import { query } from "../../../community/store";
import { hasExplicitWords } from "../../../clean-content";
import { mixLicense, sources } from "../../../party/data";
import type { LibraryAsset } from "../../../party/server";
import { privateHeaders } from "../../studio/store";
export const dynamic = "force-dynamic";
const reply = (data: object, status = 200) =>
  Response.json(data, { status, headers: privateHeaders });
export async function POST(request: Request) {
  const access = await studioAccess();
  if (
    access.role !== "owner" ||
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return reply({ error: "Owner access is required." }, 403);
  const size = Number(request.headers.get("content-length"));
  if (!size || size > 32 * 1024 * 1024)
    return reply(
      { error: "Upload audio and optional video totaling under 30 MB." },
      413,
    );
  let key = "";
  try {
    const form = await request.formData();
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const title = value("title"),
      artist = value("artist"),
      licenseUrl = value("licenseUrl"),
      source = value("source"),
      attribution = value("attribution");
    const license = mixLicense(licenseUrl);
    const sourceUrl = new URL(value("sourceUrl"));
    const sourceHost =
      source === "Free Music Archive"
        ? /(^|\.)freemusicarchive\.org$/
        : source === "Jamendo"
          ? /(^|\.)jamendo\.com$/
          : /(^|\.)ccmixter\.org$/;
    if (
      !license ||
      !title ||
      !artist ||
      title.length > 120 ||
      artist.length > 120 ||
      attribution.length > 3000 ||
      !attribution ||
      hasExplicitWords([title, artist, attribution, value("tags")].join(" ")) ||
      !sources.slice(1).includes(source as never) ||
      form.get("reviewed") !== "on" ||
      sourceUrl.protocol !== "https:" ||
      !sourceHost.test(sourceUrl.hostname)
    )
      return reply(
        {
          error:
            "Supply source metadata, CC0/CC BY license, attribution, and confirm your review.",
        },
        400,
      );
    const file = form.get("audio"),
      video = form.get("video");
    if (
      !(file instanceof File) ||
      !file.size ||
      !/\.(mp3|wav)$/i.test(file.name)
    )
      return reply({ error: "Choose a licensed MP3 or WAV audio file." }, 400);
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const wav = file.name.toLowerCase().endsWith(".wav");
    const magic = new TextDecoder("latin1").decode(header);
    if (
      wav
        ? !(magic.startsWith("RIFF") && magic.slice(8, 12) === "WAVE")
        : !(
            magic.startsWith("ID3") ||
            (header[0] === 255 && (header[1] & 224) === 224)
          )
    )
      return reply(
        { error: "This file does not match its audio format." },
        400,
      );
    if (
      video instanceof File &&
      video.size &&
      (!video.name.toLowerCase().endsWith(".mp4") ||
        new TextDecoder().decode(await video.slice(4, 8).arrayBuffer()) !==
          "ftyp")
    )
      return reply({ error: "Choose a licensed MP4 video." }, 400);
    const seconds = Number(value("seconds")),
      bpm = Number(value("bpm"));
    if (
      !Number.isFinite(seconds) ||
      seconds <= 0 ||
      seconds > 1200 ||
      !Number.isFinite(bpm) ||
      bpm < 0 ||
      bpm > 240
    )
      return reply(
        {
          error:
            "Supply duration up to 20 minutes and BPM from 0 (unknown) to 240.",
        },
        400,
      );
    if (
      ((await query("select count(*) as n from party_library").first<number>(
        "n",
      )) ?? 0) >= 300
    )
      return reply(
        { error: "The curated library has reached 300 entries." },
        409,
      );
    const id = "library:" + crypto.randomUUID();
    key = "party-library/" + id;
    if (!env.BUCKET) throw new Error("Storage unavailable.");
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: wav ? "audio/wav" : "audio/mpeg" },
    });
    const hasVideo = video instanceof File && video.size > 0;
    if (hasVideo)
      await env.BUCKET.put(key + "-video", video.stream(), {
        httpMetadata: { contentType: "video/mp4" },
      });
    const track: LibraryAsset = {
      id,
      title,
      artist,
      source: source as LibraryAsset["source"],
      sourceUrl: sourceUrl.href,
      license,
      licenseUrl,
      attribution,
      seconds,
      bpm,
      tags: value("tags")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 12),
      format: wav ? "wav" : "mp3",
      video: hasVideo,
      audioKey: key,
      ...(hasVideo ? { videoKey: key + "-video" } : {}),
      revision: crypto.randomUUID(),
    };
    await query(
      "insert into party_library values (?, ?, 1)",
      id,
      JSON.stringify(track),
    ).run();
    return reply({ ok: true });
  } catch {
    if (key) await env.BUCKET?.delete([key, key + "-video"]).catch(() => {});
    return reply(
      { error: "The licensed upload could not be saved. Try again." },
      503,
    );
  }
}
