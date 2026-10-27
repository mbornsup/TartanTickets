"use client";

import { useCallback, useEffect, useState } from "react";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(priceCents) {
  if (priceCents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceCents / 100);
}

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeEvent, setActiveEvent] = useState(null);
  const [sessionName, setSessionName] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [signinOpen, setSigninOpen] = useState(false);
  const [signinName, setSigninName] = useState("");
  const [signinSubmitting, setSigninSubmitting] = useState(false);
  const [signinError, setSigninError] = useState("");
  const [signinRetryAt, setSigninRetryAt] = useState(null);
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const loadEvents = useCallback(async () => {
    setLoadError("");
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) throw new Error("Events could not be loaded.");
      const result = await response.json();
      setEvents(result.events);
    } catch {
      setLoadError("We couldn’t load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    fetch("/api/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Sign-in status could not be checked.");
        return response.json();
      })
      .then((session) => {
        setSessionName(session.signedInName);
        setSigninRetryAt(session.lockedUntil);
      })
      .catch(() => {
        setSigninError("We couldn’t check your sign-in status. Please try again.");
      })
      .finally(() => setSessionChecked(true));
  }, []);

  function openAction(event) {
    setActiveEvent(event);
    setName(sessionName || "");
    setSeats(1);
    setMessage("");
    setActionError("");
  }

  async function submitSignIn(event) {
    event.preventDefault();
    if (signinSubmitting) return;

    setSigninSubmitting(true);
    setSigninError("");
    try {
      const response = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signinName }),
      });
      const result = await response.json();
      if (!response.ok) {
        setSigninRetryAt(result.retryAt || null);
        throw new Error(result.error || "We couldn’t sign you in.");
      }

      setSessionName(result.signedInName);
      setSigninRetryAt(null);
      setSigninOpen(false);
      setSigninName("");
      setMessage(`You’re signed in as ${result.signedInName}.`);
    } catch (error) {
      setSigninError(error.message);
    } finally {
      setSigninSubmitting(false);
    }
  }

  async function signOut() {
    setSigninError("");
    try {
      const response = await fetch("/api/signout", { method: "POST" });
      if (!response.ok) throw new Error("We couldn’t sign you out. Please try again.");
      setSessionName(null);
      setMessage("You’re signed out on this browser.");
    } catch (error) {
      setSigninError(error.message);
    }
  }

  async function submitAction(event) {
    event.preventDefault();
    if (!activeEvent || submitting) return;

    setSubmitting(true);
    setActionError("");
    setMessage("");
    const isWaitlist = activeEvent.seatsRemaining === 0;

    try {
      const response = await fetch(
        isWaitlist ? "/api/waitlist" : "/api/orders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isWaitlist
              ? { eventId: activeEvent.id, name }
              : { eventId: activeEvent.id, name, seats: Number(seats) },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Something went wrong.");

      setMessage(
        isWaitlist
          ? `You’re on the waitlist at position ${result.entry.position}.`
          : `You’re all set, ${result.order.name}! ${result.order.seats} ${
              result.order.seats === 1 ? "ticket" : "tickets"
            } reserved. Simulated payment complete.`,
      );
      setActiveEvent(null);
      await loadEvents();
    } catch (error) {
      setActionError(error.message);
      await loadEvents();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Tartan Tickets home">
          <span className="brand-mark" aria-hidden="true">TT</span>
          <span>Tartan Tickets</span>
        </a>
        <div className="header-actions">
          {sessionName ? (
            <>
              <span className="signed-in-name">Hi, {sessionName}</span>
              <button className="header-button" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <button
              className="header-button"
              onClick={() => {
                setSigninError("");
                setSigninOpen(true);
              }}
              disabled={!sessionChecked}
            >
              Sign in
            </button>
          )}
          <span className="header-note">Made for campus, by campus</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">YOUR CAMPUS, OUT LOUD</p>
          <h1 id="page-title">Make plans.<br />Meet your people.</h1>
          <p className="hero-description">
            The good stuff happening around CMU, all in one place.
          </p>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>WHAT&apos;S</span>
          <strong>ON?</strong>
          <span>CMU · PITTSBURGH</span>
        </div>
        <div className="hero-scribble" aria-hidden="true">✳</div>
      </section>

      <section className="events-section" aria-labelledby="events-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE CAMPUS CALENDAR</p>
            <h2 id="events-heading">Coming up</h2>
          </div>
          <span className="event-count">
            {loading ? "Loading…" : `${events.length} upcoming`}
          </span>
        </div>

        {loading && (
          <p className="state-message" role="status">Finding the good stuff…</p>
        )}
        {!loading && loadError && (
          <div className="state-message error-state" role="alert">
            <p>{loadError}</p>
            <button className="text-button" onClick={loadEvents}>Try again</button>
          </div>
        )}
        {!loading && !loadError && events.length === 0 && (
          <p className="state-message">No upcoming events yet.</p>
        )}

        {!loading && !loadError && events.length > 0 && (
          <div className="event-grid">
            {events.map((event, index) => {
              const soldOut = event.seatsRemaining === 0;
              return (
                <article className="event-card" key={event.id}>
                  <div className={`event-art event-art-${index % 3}`} aria-hidden="true">
                    <span className="art-index">0{index + 1}</span>
                    <span className="art-shape">{index % 2 === 0 ? "✳" : "◒"}</span>
                    <span className="art-caption">CMU / PITTSBURGH</span>
                  </div>
                  <div className="event-content">
                    <div className="event-meta">
                      <span>{formatDate(event.startsAt)}</span>
                      {soldOut && <span className="sold-out-tag">SOLD OUT</span>}
                    </div>
                    <h3>{event.title}</h3>
                    <p className="event-location">{event.location}</p>
                    <p className="event-description">{event.description}</p>
                    <div className="event-bottom">
                      <div className="event-facts">
                        <span className="event-price">{formatPrice(event.priceCents)}</span>
                        <span className={soldOut ? "seats sold-out-text" : "seats"}>
                          {soldOut
                            ? "No seats left"
                            : `${event.seatsRemaining} ${event.seatsRemaining === 1 ? "seat" : "seats"} left`}
                        </span>
                      </div>
                      <button
                        className={soldOut ? "action-button waitlist-button" : "action-button"}
                        onClick={() => openAction(event)}
                        aria-label={`${soldOut ? "Join waitlist for" : "Buy tickets for"} ${event.title}`}
                      >
                        {soldOut ? "Join waitlist" : "Buy tickets"}
                        <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="site-footer">
        <span>TARTAN TICKETS</span>
        <span>A little more together.</span>
      </footer>

      {activeEvent && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !submitting) setActiveEvent(null);
        }}>
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            <button
              className="dialog-close"
              aria-label="Close"
              onClick={() => setActiveEvent(null)}
              disabled={submitting}
            >
              ×
            </button>
            <p className="eyebrow">{activeEvent.seatsRemaining === 0 ? "THE CROWD IS IN" : "SAVE YOUR SPOT"}</p>
            <h2 id="dialog-title">{activeEvent.title}</h2>
            <p className="dialog-detail">{formatDate(activeEvent.startsAt)} · {activeEvent.location}</p>
            <form onSubmit={submitAction}>
              <label htmlFor="attendee-name">Your name</label>
              <input
                id="attendee-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="What should we call you?"
                required
              />
              {activeEvent.seatsRemaining > 0 && (
                <div className="quantity-row">
                  <label htmlFor="ticket-quantity">Tickets <span>(up to 4)</span></label>
                  <select
                    id="ticket-quantity"
                    value={seats}
                    onChange={(event) => setSeats(event.target.value)}
                  >
                    {Array.from(
                      { length: Math.min(4, activeEvent.seatsRemaining) },
                      (_, index) => index + 1,
                    ).map((quantity) => (
                      <option key={quantity} value={quantity}>{quantity}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="payment-note">
                {activeEvent.seatsRemaining === 0
                  ? "We’ll keep your place on the list right here."
                  : "No card details. This demo uses a simulated payment."}
              </p>
              {actionError && <p className="form-error" role="alert">{actionError}</p>}
              <button className="dialog-submit" type="submit" disabled={submitting}>
                {submitting
                  ? "One moment…"
                  : activeEvent.seatsRemaining === 0
                    ? "Join waitlist"
                    : "Simulated payment"}
              </button>
            </form>
          </section>
        </div>
      )}

      {signinOpen && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !signinSubmitting) setSigninOpen(false);
        }}>
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-title"
          >
            <button
              className="dialog-close"
              aria-label="Close"
              onClick={() => setSigninOpen(false)}
              disabled={signinSubmitting}
            >
              ×
            </button>
            <p className="eyebrow">WELCOME TO THE CROWD</p>
            <h2 id="signin-title">Make yourself at home.</h2>
            <p className="dialog-detail">
              This class demo uses a name instead of university sign-in.
            </p>
            <form onSubmit={submitSignIn}>
              <label htmlFor="signin-name">Your name</label>
              <input
                id="signin-name"
                name="name"
                autoComplete="name"
                value={signinName}
                onChange={(event) => setSigninName(event.target.value)}
                placeholder="What should we call you?"
              />
              {signinRetryAt && (
                <p className="form-error" role="status">
                  Sign-in is locked on this browser until{" "}
                  {new Date(signinRetryAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}.
                </p>
              )}
              {signinError && <p className="form-error" role="alert">{signinError}</p>}
              <button className="dialog-submit" type="submit" disabled={signinSubmitting}>
                {signinSubmitting ? "One moment…" : "Sign in with name"}
              </button>
            </form>
          </section>
        </div>
      )}

      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button>
        </div>
      )}
    </main>
  );
}
