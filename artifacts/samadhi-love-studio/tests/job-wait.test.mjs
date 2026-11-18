// Waiting for a song job survives brief connection drops. Plain Node 22.18+.
import test from "node:test";
import assert from "node:assert/strict";
import {waitForJob, readJobReply, JobWaitError, pollDelay, lostConnectionMessage} from "../app/credits/job-wait.ts";

/** Fake clock: each sleep advances time instantly. */
function clock() {
  let time = 0;
  return {now: () => time, sleep: async (ms) => { time += ms; }};
}
const reply = (body, status = 200) => Response.json(body, {status});
const working = () => reply({job: {status: "working"}});
const done = () => reply({job: {status: "done"}, result: {status: 200, body: {songId: "s1"}}});

test("returns the finished result", async () => {
  const answers = [working(), working(), done()];
  const saved = await waitForJob(async () => answers.shift(), clock());
  assert.equal(saved.job.status, "done");
  assert.deepEqual(saved.result.body, {songId: "s1"});
});

test("rides out network drops and server restarts in the middle", async () => {
  const answers = [
    () => working(),
    () => { throw new TypeError("Failed to fetch"); },
    () => reply({error: "restarting"}, 503),
    () => reply({error: "bad gateway"}, 502),
    () => new Response("not json", {status: 200}),
    () => done(),
  ];
  const saved = await waitForJob(async () => answers.shift()(), clock());
  assert.equal(saved.job.status, "done");
});

test("a failed job is returned so the page can show its message", async () => {
  const saved = await waitForJob(async () => reply({job: {status: "failed", error_message: "No provider request was sent."}}), clock());
  assert.equal(saved.job.error_message, "No provider request was sent.");
});

test("a long outage stops waiting with a calm, safe message", async () => {
  await assert.rejects(
    waitForJob(async () => { throw new TypeError("offline"); }, {...clock(), outageLimitMs: 60_000}),
    (error) => error.message === lostConnectionMessage && /don't press Create again/.test(error.message),
  );
});

test("signed out or missing job stops at once instead of waiting", async () => {
  let calls = 0;
  await assert.rejects(waitForJob(async () => { calls++; return reply({}, 401); }, clock()), /Check Your songs/);
  assert.equal(calls, 1);
});

test("good answers reset the outage timer, so slow songs never time out", async () => {
  let n = 0;
  const saved = await waitForJob(async () => {
    n++;
    if (n === 400) return done();
    return n % 2 ? working() : (() => { throw new TypeError("blip"); })();
  }, {...clock(), outageLimitMs: 10_000});
  assert.equal(saved.job.status, "done");
});

test("cancel stops waiting", async () => {
  const controller = new AbortController();
  controller.abort(new Error("cancelled"));
  await assert.rejects(waitForJob(async () => working(), {...clock(), signal: controller.signal}), /cancelled/);
});

test("checks quickly at first, then every 5 seconds", () => {
  assert.equal(pollDelay(0), 1500);
  assert.equal(pollDelay(100), 5000);
});

test("a transport that ignores abort still ends at the outage deadline", async () => {
  const signals = [];
  await assert.rejects(waitForJob(signal => {
    signals.push(signal);
    return new Promise(() => {});
  }, {outageLimitMs: 60, requestTimeoutMs: 15, sleep: async () => {}}),
  error => error instanceof JobWaitError && /Didn't finish.*Try again/.test(error.message));
  assert(signals.length > 0);
  assert(signals.every(signal => signal.aborted));
});

test("a response body that never arrives is bounded too", async () => {
  let signal;
  await assert.rejects(readJobReply(input => {
    signal = input;
    return Promise.resolve(new Response(new ReadableStream({start() {}})));
  }, 15), /Didn't finish.*Try again/);
  assert.equal(signal.aborted, true);
});

test("a timed-out status read can recover without replaying work", async () => {
  let calls = 0, interrupted;
  const saved = await waitForJob(signal => {
    calls++;
    if (calls === 1) {
      interrupted = signal;
      return new Promise(() => {});
    }
    return Promise.resolve(done());
  }, {outageLimitMs: 5_000, requestTimeoutMs: 15, sleep: async () => {}});
  assert.equal(saved.job.status, "done");
  assert.equal(calls, 2);
  assert.equal(interrupted.aborted, true);
});

test("cancelling a hung transport rejects even when it ignores the signal", async () => {
  const controller = new AbortController();
  let child;
  const waiting = readJobReply(signal => {
    child = signal;
    return new Promise(() => {});
  }, 5_000, controller.signal);
  await Promise.resolve();
  controller.abort(new Error("cancelled while checking"));
  await assert.rejects(waiting, /cancelled while checking/);
  assert.equal(child.aborted, true);
});

test("empty successful replies cannot reset the outage deadline forever", async () => {
  await assert.rejects(waitForJob(async () => reply({}), {...clock(), outageLimitMs: 10_000}),
    error => error instanceof JobWaitError);
});
