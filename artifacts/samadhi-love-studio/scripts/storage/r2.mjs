import { createHash, createHmac } from "node:crypto";
import { S3Client, HeadBucketCommand, HeadObjectCommand, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { mkdtemp, open, rm } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";

export const MAX_UPLOAD = 512 * 1024 * 1024;
const quote = value => `"${String(value).replace(/^"|"$/g, "")}"`;
const missing = e => e?.$metadata?.httpStatusCode === 404 || e?.name === "NoSuchKey" || e?.name === "NotFound";
const conflict = e => e?.$metadata?.httpStatusCode === 412 || e?.name === "PreconditionFailed";
export function encodeMetadata(custom = {}, http = {}) {
  const value = Buffer.from(JSON.stringify({ custom, http }), "utf8").toString("base64");
  if (Buffer.byteLength(value) > 1900) throw new Error("Object metadata exceeds the safe private storage limit.");
  return { "studio-envelope": value };
}
export function decodeMetadata(metadata = {}) {
  if (metadata["studio-envelope"]) {
    // Fail rather than silently lose encrypted-key status or account metadata.
    return JSON.parse(Buffer.from(metadata["studio-envelope"], "base64").toString("utf8"));
  }
  // Earlier S3 objects can have direct, lowercased metadata names.
  const names = { defaultprovider: "defaultProvider", musicaccess: "musicAccess", checkedat: "checkedAt",
    accountmessage: "accountMessage", musicmessage: "musicMessage", createdat: "createdAt", requestid: "requestId" };
  return { custom: Object.fromEntries(Object.entries(metadata).map(([k,v]) => [names[k] ?? k,v])), http: {} };
}
const rfc3986 = value => encodeURIComponent(value).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
/** AWS Signature V4 query-string presign for a GET (S3-compatible, path-style). */
export function presignS3Get({ host, path, region, accessKeyId, secretAccessKey, expires, now = new Date() }) {
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8), scope = `${day}/${region}/s3/aws4_request`;
  const params = { "X-Amz-Algorithm": "AWS4-HMAC-SHA256", "X-Amz-Credential": `${accessKeyId}/${scope}`, "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expires), "X-Amz-SignedHeaders": "host" };
  const query = Object.keys(params).sort().map(k => `${rfc3986(k)}=${rfc3986(params[k])}`).join("&");
  const canonical = ["GET", path, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, createHash("sha256").update(canonical).digest("hex")].join("\n");
  const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
  const signing = hmac(hmac(hmac(hmac("AWS4" + secretAccessKey, day), region), "s3"), "aws4_request");
  return `https://${host}${path}?${query}&X-Amz-Signature=${createHmac("sha256", signing).update(toSign).digest("hex")}`;
}
export class R2PrivateBucket {
  constructor({ accountId, bucket, accessKeyId, secretAccessKey, client }) {
    this.bucket = bucket;
    // Kept private to this server object; used only to sign short-lived read links.
    Object.defineProperty(this, "signer", { value: { accountId, accessKeyId, secretAccessKey }, enumerable: false });
    this.client = client ?? new S3Client({
      region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey }, maxAttempts: 1,
      requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  /** A read-only link to one private object that expires (default 10 minutes). Never stored or logged. */
  presignGet(key, expires = 600) {
    if (!/^[\w./%-]{1,512}$/.test(key) || key.includes("..")) throw new Error("Invalid storage key.");
    if (!Number.isInteger(expires) || expires < 60 || expires > 3600) throw new Error("Invalid link lifetime.");
    const { accountId, accessKeyId, secretAccessKey } = this.signer;
    const path = "/" + [this.bucket, ...key.split("/")].map(rfc3986).join("/");
    return presignS3Get({ host: `${accountId}.r2.cloudflarestorage.com`, path, region: "auto", accessKeyId, secretAccessKey, expires });
  }
  async checkAccess() {
    try { await this.client.send(new HeadBucketCommand({ Bucket: this.bucket })); }
    catch (cause) { throw new Error("Private R2 access check failed. Check STUDIO_R2_ACCESS_KEY_ID and STUDIO_R2_SECRET_ACCESS_KEY for the configured bucket.",{cause}); }
  }
  info(key, value) {
    const envelope = decodeMetadata(value.Metadata);
    const etag = (value.ETag ?? "").replace(/^"|"$/g, "");
    return {
      key, size: value.ContentLength ?? value.Size ?? 0, etag, httpEtag: quote(etag),
      uploaded: value.LastModified ?? new Date(0),
      customMetadata: envelope.custom, httpMetadata: {
        ...envelope.http, ...(value.ContentType && { contentType: value.ContentType }),
        ...(value.CacheControl && { cacheControl: value.CacheControl }),
      },
      writeHttpMetadata(headers) { if (value.ContentType) headers.set("Content-Type", value.ContentType); },
    };
  }
  async head(key) {
    try { return this.info(key, await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))); }
    catch (e) { if (missing(e)) return null; throw new Error("Private media metadata could not be read.",{cause:e}); }
  }
  async get(key, options = {}) {
    const range = options.range;
    let Range;
    if (range instanceof Headers) Range = range.get("range") ?? undefined;
    else if (range?.suffix !== undefined) Range = `bytes=-${range.suffix}`;
    else if (range) Range = `bytes=${range.offset ?? 0}-${range.length !== undefined ? (range.offset ?? 0) + range.length - 1 : ""}`;
    let value;
    try { value = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key, Range })); }
    catch (e) { if (missing(e)) return null; throw new Error("Private media could not be read.",{cause:e}); }
    const body = value.Body?.transformToWebStream ? value.Body.transformToWebStream() : Readable.toWeb(value.Body);
    const response = new Response(body);
    const info = this.info(key, value);
    if (value.ContentRange) {
      info.range = range;
      info.size = Number(value.ContentRange.split("/")[1]);
    }
    return { ...info, body: response.body, arrayBuffer: () => response.arrayBuffer(), text: () => response.text(), json: () => response.json() };
  }
  async put(key, input, options = {}) {
    let dir;
    let stream;
    try {
      // Spool only temporary upload bytes, never persistent application data.
      // Private mode, hard cap and finally cleanup apply to all input types.
      dir = await mkdtemp(join(tmpdir(), "studio-upload-"));
      const file = join(dir, "body");
      const handle = await open(file, "wx", 0o600);
      let length = 0;
      try {
        const source = typeof input === "string" ? [Buffer.from(input)] :
          input instanceof ArrayBuffer ? [new Uint8Array(input)] :
          ArrayBuffer.isView(input) ? [new Uint8Array(input.buffer, input.byteOffset, input.byteLength)] :
          input instanceof Blob ? input.stream() : input;
        for await (const chunk of source) {
          const bytes = typeof chunk === "string" ? Buffer.from(chunk) : new Uint8Array(chunk);
          length += bytes.byteLength;
          if (length > MAX_UPLOAD) throw new Error("Private uploads must not exceed 512 MiB.");
          let offset = 0;
          while (offset < bytes.length) offset += (await handle.write(bytes, offset, bytes.length - offset)).bytesWritten;
        }
      } finally { await handle.close(); }
      stream = createReadStream(file);
      const result = await this.client.send(new PutObjectCommand({
        Bucket: this.bucket, Key: key, Body: stream, ContentLength: length,
        ContentType: options.httpMetadata?.contentType, CacheControl: options.httpMetadata?.cacheControl,
        Metadata: encodeMetadata(options.customMetadata, options.httpMetadata),
        ...(options.onlyIf?.etagMatches && { IfMatch: quote(options.onlyIf.etagMatches) }),
        ...(options.onlyIf?.etagDoesNotMatch && { IfNoneMatch: options.onlyIf.etagDoesNotMatch === "*" ? "*" : quote(options.onlyIf.etagDoesNotMatch) }),
      }));
      return this.info(key, { ...result, ContentLength: length, ContentType: options.httpMetadata?.contentType, Metadata: encodeMetadata(options.customMetadata, options.httpMetadata), LastModified: new Date() });
    } catch (e) {
      if (conflict(e)) return null;
      // Never expose provider responses, signed URLs or credentials.
      throw new Error("Private upload was not confirmed. No automatic retry was made.");
    } finally {
      stream?.destroy();
      if (dir) await rm(dir, { recursive: true, force: true });
    }
  }
  async list(options = {}) {
    const result = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket, Prefix: options.prefix, MaxKeys: Math.min(options.limit ?? 1000, 1000),
      ContinuationToken: options.cursor, Delimiter: options.delimiter,
    }));
    // S3 listing omits metadata. Fetch it only for callers that requested it,
    // in bounded groups rather than making 1000 serialized HEAD requests.
    const objects = [];
    const contents = result.Contents ?? [];
    for (let i = 0; i < contents.length; i += 8) {
      const page = await Promise.all(contents.slice(i, i + 8).map(object =>
        options.include?.length ? this.head(object.Key) : this.info(object.Key, object)));
      objects.push(...page.filter(Boolean));
    }
    return { objects, truncated: !!result.IsTruncated, cursor: result.NextContinuationToken,
      delimitedPrefixes: (result.CommonPrefixes ?? []).map(p => p.Prefix) };
  }
  async delete(keys) {
    for (const key of Array.isArray(keys) ? keys : [keys])
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
