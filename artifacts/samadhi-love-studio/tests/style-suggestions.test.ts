import test from "node:test";
import assert from "node:assert/strict";
import { addStyle, removeStyle, suggestionBatch, batchCount, hasStyle, styleSuggestions } from "../app/style-suggestions";

test("shows exactly four and cycles batches", () => {
  const list = ["a","b","c","d","e","f","g","h","i","j"];
  assert.deepEqual(suggestionBatch(list, 0), ["a","b","c","d"]);
  assert.deepEqual(suggestionBatch(list, 1), ["e","f","g","h"]);
  assert.deepEqual(suggestionBatch(list, 2), ["i","j","a","b"]);
  assert.equal(batchCount(list), 3);
  for (const l of Object.values(styleSuggestions)) for (let b = 0; b < 6; b++) assert.equal(suggestionBatch(l, b).length, 4);
});
test("adds without wiping typed text and avoids duplicates", () => {
  const typed = "dreamy late-night feeling, no rap";
  const one = addStyle(typed, "Deep House")!;
  assert.equal(one, "dreamy late-night feeling, no rap, Deep House");
  assert.equal(addStyle(one, "deep house"), one);
  assert.equal(addStyle("", "Pop"), "Pop");
  assert.equal(addStyle("x".repeat(498), "Pop"), null);
});
test("removes only the picked suggestion", () => {
  const t = "Pop, my own words here, Lebanese Dabke";
  assert.equal(removeStyle(t, "Pop"), "my own words here, Lebanese Dabke");
  assert.equal(removeStyle(t, "Lebanese Dabke"), "Pop, my own words here");
  assert.equal(removeStyle("pop music vibes", "Pop"), "pop music vibes");
  assert.ok(!hasStyle(removeStyle(t, "Pop"), "Pop"));
});
