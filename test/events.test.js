const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getEventAction,
  getUpcomingEvents,
} = require("../lib/events.js");

const now = new Date("2026-10-22T12:00:00.000Z");

const events = [
  {
    id: "later",
    startsAt: "2026-11-10T18:00:00.000Z",
    location: "Cohon University Center",
    priceCents: 1200,
    capacity: 50,
    sold: 12,
    status: "published",
  },
  {
    id: "sold-out",
    startsAt: "2026-10-30T18:00:00.000Z",
    location: "Rangos Ballroom",
    priceCents: 0,
    capacity: 20,
    sold: 20,
    status: "published",
  },
  {
    id: "past",
    startsAt: "2026-10-20T18:00:00.000Z",
    location: "Past venue",
    priceCents: 500,
    capacity: 20,
    sold: 0,
    status: "published",
  },
  {
    id: "draft",
    startsAt: "2026-10-25T18:00:00.000Z",
    location: "Private venue",
    priceCents: 500,
    capacity: 20,
    sold: 0,
    status: "draft",
  },
];

test("Story 1: lists only published upcoming events in date order", () => {
  const upcoming = getUpcomingEvents(events, now);

  assert.deepEqual(upcoming.map((event) => event.id), ["sold-out", "later"]);
});

test("Story 1: each upcoming event includes date, location, price, and seats remaining", () => {
  const upcoming = getUpcomingEvents(events, now);

  assert.deepEqual(
    upcoming.map(({ startsAt, location, priceCents, seatsRemaining }) => ({
      startsAt,
      location,
      priceCents,
      seatsRemaining,
    })),
    [
      {
        startsAt: "2026-10-30T18:00:00.000Z",
        location: "Rangos Ballroom",
        priceCents: 0,
        seatsRemaining: 0,
      },
      {
        startsAt: "2026-11-10T18:00:00.000Z",
        location: "Cohon University Center",
        priceCents: 1200,
        seatsRemaining: 38,
      },
    ],
  );
});

test("Story 1: sold-out events offer a waitlist instead of buying", () => {
  assert.deepEqual(getEventAction(events[1]), {
    label: "Join waitlist",
    kind: "waitlist",
    disabled: false,
  });
});

test("Story 1: events with remaining seats offer buying", () => {
  assert.deepEqual(getEventAction(events[0]), {
    label: "Buy tickets",
    kind: "buy",
    disabled: false,
  });
});
