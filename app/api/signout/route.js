const { signOut } = require("../../../lib/auth.js");
const { getDeviceId, sessions } = require("../../../lib/auth-state.js");

export async function POST(request) {
  const deviceId = getDeviceId(request);
  if (deviceId) signOut(sessions, deviceId);
  return Response.json({ signedInName: null });
}
