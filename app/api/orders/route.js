const { placeOrder } = require("../../../lib/events.js");

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const result = placeOrder(body || {});
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ order: result.order }, { status: result.status });
}
