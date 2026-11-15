import test from "node:test";
import assert from "node:assert/strict";
import { defaultCreateChoice, recoverCreateChoice, resolveCreateMode } from "../app/quick-create-mode";
test("default is a sung song regardless of connection", () => {
  assert.equal(defaultCreateChoice, "vocals");
  for (const c of [true, false]) assert.equal(resolveCreateMode(defaultCreateChoice, c).instrumental, false);
});
test("disconnected never falls back to local sketch", () => {
  assert.equal(resolveCreateMode("instrumental", false).localSketch, false);
  assert.equal(resolveCreateMode("instrumental", false).blocked, true);
  assert.equal(resolveCreateMode("vocals", false).blocked, true);
});
test("only explicit sketch renders locally", () => {
  assert.equal(resolveCreateMode("sketch", false).localSketch, true);
  assert.equal(resolveCreateMode("sketch", false).blocked, false);
});
test("restored sketch in Simple still requires a music account and never renders locally", () => {
  const mode = resolveCreateMode("sketch", false, true);
  assert.equal(mode.localSketch, false);
  assert.equal(mode.instrumental, true);
  assert.equal(mode.blocked, true);
});
test("recovery keeps intentional choices and defaults invalid to vocals", () => {
  assert.equal(recoverCreateChoice("sketch"), "sketch");
  assert.equal(recoverCreateChoice(undefined), "vocals");
  assert.equal(recoverCreateChoice("junk"), "vocals");
});
