const { signIn } = require("../../../lib/auth.js");
const {
  cookieHeader,
  getOrCreateDeviceId,
  sessions,
} = require("../../../lib/auth-state.js");

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const deviceId = getOrCreateDeviceId(request);
  const result = signIn({
    sessions,
    deviceId,
    name: body?.name,
  });

  const headers = { "Set-Cookie": cookieHeader(deviceId) };
  if (result.status === 429) {
    return Response.json(
      {
        error: "Too many failed attempts. Try again after the 15-minute lockout.",
        retryAt: new Date(result.retryAt).toISOString(),
      },
      { status: 429, headers },
    );
  }
  if (result.status !== 200) {
    return Response.json(
      { error: "Enter a name to sign in." },
      { status: result.status, headers },
    );
  }

  return Response.json(result.session, { status: 200, headers });
}
