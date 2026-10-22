const { getUpcomingEvents } = require("../../../lib/events.js");

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ events: getUpcomingEvents() });
}
