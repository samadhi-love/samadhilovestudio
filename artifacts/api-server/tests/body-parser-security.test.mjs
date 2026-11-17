import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import express from "express";

// Disposable local server, no Clerk session, project storage or external calls.
async function withParser(check) {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.post("/parse", (req, res) => res.json(req.body));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use((error, _req, res, _next) => {
    res.status(error.status >= 400 && error.status < 500 ? error.status : 400)
      .json({ error: "Request body rejected." });
  });
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    await check(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test("patched Express parser preserves legitimate compressed multilingual song inputs", async () => {
  await withParser(async origin => {
    const input = { title: "A new beginning", lyrics: "سلام — a bright new day", instrumental: false };
    const response = await fetch(origin + "/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
      body: gzipSync(JSON.stringify(input)),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), input);
  });
});

test("trailing compressed-body bytes cannot crash the request parser", async () => {
  await withParser(async origin => {
    const response = await fetch(origin + "/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" },
      body: Buffer.concat([gzipSync('{"lyrics":"preserve originals"}'), Buffer.from([255, 254, 253])]),
    });
    // Either safely accepting the completed frame or rejecting the malformed
    // body is acceptable; an unhandled decoder error/process crash is not.
    assert.ok(response.status === 200 || (response.status >= 400 && response.status < 500));
    await response.arrayBuffer();
    for (let attempt = 0; attempt < 3; attempt++) {
      const health = await fetch(origin + "/health");
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), { ok: true });
    }
  });
});
