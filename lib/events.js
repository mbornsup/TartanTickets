const DAY_IN_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days) {
  return new Date(Date.now() + days * DAY_IN_MS).toISOString();
}

function createInitialState() {
  return {
    events: [
      {
        id: "fall-fest",
        title: "Fall Fest on the Cut",
        startsAt: daysFromNow(3),
        location: "The Cut, Carnegie Mellon University",
        priceCents: 0,
        capacity: 180,
        sold: 117,
        status: "published",
        description: "Live music, local food, and a very good reason to be outside.",
      },
      {
        id: "tartan-gala",
        title: "Tartan After Dark",
        startsAt: daysFromNow(8),
        location: "Rangos Ballroom, Cohon University Center",
        priceCents: 1800,
        capacity: 120,
        sold: 120,
        status: "published",
        description: "An evening of dancing, snacks, and campus-wide celebration.",
      },
      {
        id: "film-night",
        title: "Film Society: The Grand Feature",
        startsAt: daysFromNow(12),
        location: "McConomy Auditorium",
        priceCents: 700,
        capacity: 95,
        sold: 62,
        status: "published",
        description: "A big-screen favorite with popcorn included.",
      },
    ],
    orders: [],
    waitlist: [],
  };
}

const state = globalThis.__tartanTicketsState || createInitialState();
globalThis.__tartanTicketsState = state;

function getUpcomingEvents(source = state.events, now = new Date()) {
  const currentTime = new Date(now).getTime();

  return source
    .filter(
      (event) =>
        event.status === "published" &&
        new Date(event.startsAt).getTime() > currentTime,
    )
    .sort((first, second) => new Date(first.startsAt) - new Date(second.startsAt))
    .map((event) => ({
      ...event,
      seatsRemaining: Math.max(0, event.capacity - event.sold),
    }));
}

function getEventAction(event) {
  if (event.capacity - event.sold <= 0) {
    return { label: "Join waitlist", kind: "waitlist", disabled: false };
  }

  return { label: "Buy tickets", kind: "buy", disabled: false };
}

function placeOrder({ eventId, name, seats }) {
  const event = state.events.find((candidate) => candidate.id === eventId);
  if (!event || event.status !== "published") {
    return { status: 404, error: "Event not found." };
  }
  if (typeof name !== "string" || !name.trim()) {
    return { status: 400, error: "Enter your name to continue." };
  }
  if (!Number.isInteger(seats) || seats < 1 || seats > 4) {
    return { status: 400, error: "Choose between 1 and 4 tickets." };
  }

  const seatsRemaining = event.capacity - event.sold;
  if (seats > seatsRemaining) {
    return {
      status: 409,
      error:
        seatsRemaining === 0
          ? "This event has sold out. Join the waitlist instead."
          : `Only ${seatsRemaining} ${seatsRemaining === 1 ? "seat is" : "seats are"} left.`,
    };
  }

  event.sold += seats;
  const order = {
    id: `order-${state.orders.length + 1}`,
    eventId,
    name: name.trim(),
    seats,
    totalCents: event.priceCents * seats,
    status: "simulated-paid",
    createdAt: new Date().toISOString(),
  };
  state.orders.push(order);
  return { status: 201, order };
}

function joinWaitlist({ eventId, name }) {
  const event = state.events.find((candidate) => candidate.id === eventId);
  if (!event || event.status !== "published") {
    return { status: 404, error: "Event not found." };
  }
  if (typeof name !== "string" || !name.trim()) {
    return { status: 400, error: "Enter your name to join the waitlist." };
  }
  if (event.capacity - event.sold > 0) {
    return { status: 409, error: "Tickets are available to buy right now." };
  }
  if (
    state.waitlist.some(
      (entry) =>
        entry.eventId === eventId &&
        entry.name.toLowerCase() === name.trim().toLowerCase(),
    )
  ) {
    return { status: 409, error: "You are already on this waitlist." };
  }

  const entry = {
    eventId,
    name: name.trim(),
    position: state.waitlist.filter((item) => item.eventId === eventId).length + 1,
  };
  state.waitlist.push(entry);
  return { status: 201, entry };
}

module.exports = {
  getEventAction,
  getUpcomingEvents,
  joinWaitlist,
  placeOrder,
};
