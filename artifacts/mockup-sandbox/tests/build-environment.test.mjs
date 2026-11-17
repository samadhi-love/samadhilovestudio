import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { loadConfigFromFile } from "vite";

const configPath = fileURLToPath(new URL("../vite.config.ts", import.meta.url));

async function configuration(command, values = {}) {
  const keys = ["PORT", "BASE_PATH", "NODE_ENV"];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    Object.assign(process.env, { NODE_ENV: "production", ...values });
    const loaded = await loadConfigFromFile(
      { command, mode: "production" }, configPath, undefined, "silent",
    );
    assert.ok(loaded, "the actual Vite config must load");
    return loaded.config;
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

test("programmatic builds need no PORT or BASE_PATH and use safe static-build defaults", async () => {
  assert.ok(!process.argv.includes("build"), "exercise Vite mode rather than CLI string detection");
  const config = await configuration("build");
  assert.equal(config.server.port, 5173);
  assert.equal(config.base, "/");
});

test("configured build ports and base paths remain respected", async () => {
  const config = await configuration("build", { PORT: "4200", BASE_PATH: "/design/" });
  assert.equal(config.server.port, 4200);
  assert.equal(config.base, "/design/");
});

test("empty build-only variables get the same safe defaults", async () => {
  const config = await configuration("build", { PORT: "", BASE_PATH: "" });
  assert.equal(config.server.port, 5173);
  assert.equal(config.base, "/");
});

test("development still requires its managed preview configuration", async () => {
  await assert.rejects(configuration("serve"), /PORT environment variable is required/);
  await assert.rejects(configuration("serve", { PORT: "4200" }), /BASE_PATH environment variable is required/);
});

test("invalid or out-of-range configured ports fail explicitly", async () => {
  for (const PORT of ["0", "-1", "65536", "2.5", "not-a-port"]) {
    await assert.rejects(configuration("build", { PORT }), /Invalid PORT value/);
  }
});
