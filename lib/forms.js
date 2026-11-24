// Reads form submissions (plain forms and forms with files) without outside packages.

export function readBody(req, max) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] || 0);
    if (declared > max) { reject(Object.assign(new Error("too large"), { code: "TOO_LARGE" })); return; }
    const chunks = [];
    let size = 0, failed = false;
    req.on("data", (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > max) { failed = true; reject(Object.assign(new Error("too large"), { code: "TOO_LARGE" })); req.resume?.(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => { if (!failed) resolve(Buffer.concat(chunks)); });
    req.on("error", (err) => { if (!failed) { failed = true; reject(err); } });
  });
}

// Returns { fields: {name: value or [values]}, files: {name: [{filename, type, bytes}]} }
export function parseForm(contentType, body) {
  const fields = {}, files = {};
  const add = (obj, k, v) => { if (k in obj) obj[k] = [].concat(obj[k], v); else obj[k] = v; };
  const type = String(contentType || "");
  if (type.startsWith("application/x-www-form-urlencoded")) {
    for (const [k, v] of new URLSearchParams(body.toString("utf8"))) add(fields, k, v);
    return { fields, files };
  }
  const m = /multipart\/form-data;.*boundary=(?:"([^"]+)"|([^;]+))/i.exec(type);
  if (!m) return { fields, files };
  const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
  let pos = body.indexOf(boundary);
  while (pos !== -1) {
    pos += boundary.length;
    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break; // closing "--"
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2;
    const headEnd = body.indexOf("\r\n\r\n", pos);
    if (headEnd === -1) break;
    const head = body.toString("utf8", pos, headEnd);
    const next = body.indexOf(Buffer.concat([Buffer.from("\r\n"), boundary]), headEnd + 4);
    if (next === -1) break;
    const content = body.subarray(headEnd + 4, next);
    const name = /name="([^"]*)"/i.exec(head)?.[1];
    const filename = /filename="([^"]*)"/i.exec(head)?.[1];
    const partType = /content-type:\s*([^\r\n]+)/i.exec(head)?.[1] || "";
    if (name) {
      if (filename !== undefined) {
        if (content.length) (files[name] ||= []).push({ filename, type: partType, bytes: Buffer.from(content) });
      } else add(fields, name, content.toString("utf8"));
    }
    pos = next + 2;
  }
  return { fields, files };
}

export const one = (v) => (Array.isArray(v) ? v[0] : v) ?? "";
