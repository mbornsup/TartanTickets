const test = require("node:test");
const assert = require("node:assert/strict");
const { signIn, getSession } = require("../lib/auth.js");

const MINUTE = 60 * 1000;
const freshSessions = () => new Map();

test("Story 2: a non-empty name signs in on this browser", () => {
  const sessions = freshSessions();
  const result = signIn({
    sessions,
    deviceId: "browser-a",
    name: "  Alex Example  ",
    now: 1_000_000,
  });

  assert.deepEqual(result, {
    status: 200,
    session: { signedInName: "Alex Example" },
  });
  assert.deepEqual(getSession(sessions, "browser-a", 1_000_000), {
    signedInName: "Alex Example",
    lockedUntil: null,
  });
});

test("Story 2: the fifth failed attempt within ten minutes locks this browser for 15 minutes", () => {
  const sessions = freshSessions();
  const start = 1_000_000;

  for (let attempt = 1; attempt < 5; attempt += 1) {
    assert.equal(
      signIn({ sessions, deviceId: "browser-a", name: "   ", now: start + attempt * MINUTE }).status,
      400,
    );
  }

  const result = signIn({
    sessions,
    deviceId: "browser-a",
    name: "",
    now: start + 5 * MINUTE,
  });

  assert.equal(result.status, 429);
  assert.equal(result.retryAt, start + 20 * MINUTE);
});

test("Story 2: attempts older than ten minutes do not count toward lockout", () => {
  const sessions = freshSessions();
  const start = 1_000_000;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    signIn({
      sessions,
      deviceId: "browser-a",
      name: "",
      now: start + attempt * MINUTE,
    });
  }

  const result = signIn({
    sessions,
    deviceId: "browser-a",
    name: "",
    now: start + 10 * MINUTE,
  });

  assert.equal(result.status, 400);
  assert.equal(result.retryAt, undefined);
});

test("Story 2: successful sign-in clears recorded failures", () => {
  const sessions = freshSessions();
  const start = 1_000_000;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    signIn({
      sessions,
      deviceId: "browser-a",
      name: "",
      now: start + attempt * MINUTE,
    });
  }

  assert.equal(
    signIn({
      sessions,
      deviceId: "browser-a",
      name: "Taylor",
      now: start + 4 * MINUTE,
    }).status,
    200,
  );

  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.equal(
      signIn({
        sessions,
        deviceId: "browser-a",
        name: "",
        now: start + 5 * MINUTE + attempt * MINUTE,
      }).status,
      400,
    );
  }
});

test("Story 2: lockout for one browser does not affect another browser", () => {
  const sessions = freshSessions();
  const now = 1_000_000;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    signIn({ sessions, deviceId: "browser-a", name: "", now: now + attempt });
  }

  assert.equal(
    signIn({ sessions, deviceId: "browser-b", name: "Jordan", now }).status,
    200,
  );
  assert.deepEqual(getSession(sessions, "browser-a", now), {
    signedInName: null,
    lockedUntil: now + 4 + 15 * MINUTE,
  });
});

test("Story 2: the browser can try again after the 15-minute lockout", () => {
  const sessions = freshSessions();
  const start = 1_000_000;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    signIn({ sessions, deviceId: "browser-a", name: "", now: start + attempt });
  }

  assert.equal(
    signIn({
      sessions,
      deviceId: "browser-a",
      name: "Alex",
      now: start + 4 + 15 * MINUTE,
    }).status,
    200,
  );
});
