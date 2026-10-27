const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

function getSession(sessions, deviceId, now = Date.now()) {
  const session = sessions.get(deviceId);

  return {
    signedInName: session?.signedInName || null,
    lockedUntil:
      session?.lockedUntil > now ? session.lockedUntil : null,
  };
}

function signIn({ sessions, deviceId, name, now = Date.now() }) {
  const session = sessions.get(deviceId) || {
    signedInName: null,
    failures: [],
    lockedUntil: null,
  };

  if (session.lockedUntil > now) {
    return { status: 429, retryAt: session.lockedUntil };
  }

  session.lockedUntil = null;
  session.failures = session.failures.filter(
    (failedAt) => failedAt > now - FAILURE_WINDOW_MS,
  );

  if (typeof name === "string" && name.trim()) {
    session.failures = [];
    session.signedInName = name.trim();
    sessions.set(deviceId, session);
    return {
      status: 200,
      session: { signedInName: session.signedInName },
    };
  }

  session.signedInName = null;
  session.failures.push(now);

  if (session.failures.length >= 5) {
    session.lockedUntil = now + LOCKOUT_MS;
    sessions.set(deviceId, session);
    return { status: 429, retryAt: session.lockedUntil };
  }

  sessions.set(deviceId, session);
  return { status: 400 };
}

function signOut(sessions, deviceId) {
  const session = sessions.get(deviceId);
  if (session) session.signedInName = null;
}

module.exports = { getSession, signIn, signOut };
