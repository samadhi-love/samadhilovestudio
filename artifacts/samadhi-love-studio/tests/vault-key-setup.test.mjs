import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../public/vault-key-setup.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function helper({ clipboardFails = false, fallbackSucceeds = false, cryptoFails = false } = {}) {
  const elements = new Map();
  const copied = [];
  const fields = [];
  let randomCalls = 0;
  let field;
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      checked: false, disabled: true, textContent: "", listeners: {},
      addEventListener(event, listener) { this.listeners[event] = listener; },
    });
    return elements.get(id);
  }
  vm.runInNewContext(script, {
    document: {
      getElementById: element,
      createElement() {
        field = { value: "", style: {}, setAttribute() {}, select() {}, remove() { this.removed = true; } };
        fields.push(field);
        return field;
      },
      body: { appendChild() {} },
      execCommand(command) {
        assert.equal(command, "copy");
        if (fallbackSucceeds) copied.push(field.value);
        return fallbackSucceeds;
      },
    },
    navigator: { clipboard: { async writeText(value) {
      if (clipboardFails) throw new Error("not permitted");
      copied.push(value);
    } } },
    crypto: { getRandomValues(bytes) {
      randomCalls++;
      if (cryptoFails) throw new Error("crypto unavailable");
      // Deliberately deterministic fixture, never a real vault key.
      for (let i = 0; i < bytes.length; i++) bytes[i] = i;
      return bytes;
    } },
    Uint8Array,
  });
  return {
    elements, copied, fields,
    randomCalls: () => randomCalls,
    async click(id) { await element(id).listeners.click(); },
    confirm() {
      element("first-time").checked = true;
      element("first-time").listeners.change();
    },
  };
}

test("requires first-time confirmation and copies the setting name before creating a key", async () => {
  const page = helper();
  await page.click("copy-key");
  await page.click("copy-name");
  assert.equal(page.copied.length, 0);
  assert.equal(page.randomCalls(), 0);
  page.confirm();
  assert.equal(page.elements.get("copy-name").disabled, false);
  assert.equal(page.elements.get("copy-key").disabled, true);
  await page.click("copy-name");
  assert.equal(page.copied[0], "STUDIO_ELEVENLABS_VAULT_KEY");
  assert.equal(page.elements.get("copy-key").disabled, false);
});

test("creates 32 random bytes once and recopies the same 64-hex key", async () => {
  const page = helper();
  page.confirm();
  await page.click("copy-name");
  await page.click("copy-key");
  await page.click("copy-key");
  assert.match(page.copied[1], /^[a-f0-9]{64}$/);
  assert.equal(page.copied[1], page.copied[2]);
  assert.equal(page.randomCalls(), 1);
  assert.match(page.elements.get("status").textContent, /Vault key copied/);
  for (const element of page.elements.values())
    assert.equal(element.textContent.includes(page.copied[1]), false);
});

test("uses the clipboard fallback and removes its temporary secret field", async () => {
  const page = helper({ clipboardFails: true, fallbackSucceeds: true });
  page.confirm();
  await page.click("copy-name");
  await page.click("copy-key");
  assert.match(page.copied[1], /^[a-f0-9]{64}$/);
  assert.ok(page.fields.every(field => field.removed && field.value === ""));
});

test("reports blocked copying truthfully without generating a key", async () => {
  const page = helper({ clipboardFails: true });
  page.confirm();
  await page.click("copy-name");
  assert.match(page.elements.get("status").textContent, /blocked copying/);
  assert.equal(page.elements.get("copy-key").disabled, true);
  assert.equal(page.randomCalls(), 0);
  assert.ok(page.fields.every(field => field.removed && field.value === ""));
});

test("secure randomness failures never claim a key was copied", async () => {
  const page = helper({ cryptoFails: true });
  page.confirm();
  await page.click("copy-name");
  await page.click("copy-key");
  assert.equal(page.copied.length, 1);
  assert.match(page.elements.get("status").textContent, /could not create a secure key/);
  assert.equal(page.elements.get("copy-key").disabled, false);
});

test("helper forbids server connections and has no persistence or secret logging", () => {
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(script, /\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|console)\b/);
  assert.doesNotMatch(html, /<script[^>]+src=|<form\b|<iframe\b/i);
});
