const { randomUUID } = require("node:crypto");

const COOKIE_NAME = "tt-device";
const sessions = globalThis.__tartanTicketAuthSessions || new Map();
globalThis.__tartanTicketAuthSessions = sessions;

function getDeviceId(request) {
  const cookies = request.headers.get("cookie") || "";
  const cookie = cookies
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
  } catch {
    return null;
  }
}

function getOrCreateDeviceId(request) {
  return getDeviceId(request) || randomUUID();
}

function cookieHeader(deviceId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(deviceId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;
}

module.exports = {
  cookieHeader,
  getDeviceId,
  getOrCreateDeviceId,
  sessions,
};
