const { getSession } = require("../../../lib/auth.js");
const {
  cookieHeader,
  getOrCreateDeviceId,
  sessions,
} = require("../../../lib/auth-state.js");

export async function GET(request) {
  const deviceId = getOrCreateDeviceId(request);
  return Response.json(getSession(sessions, deviceId), {
    headers: { "Set-Cookie": cookieHeader(deviceId) },
  });
}
