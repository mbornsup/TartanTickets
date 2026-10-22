# Tartan Tickets

A responsive Story 1 demo for browsing upcoming CMU events. Event listings,
simulated orders, and waitlist entries live in server memory and reset when the
server restarts. Names are typed in by the user; there is no SSO, payment
processor, or database.

## Run locally

Use Node.js 20.9 or newer, then run:

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Buy tickets** to
enter a name and submit **Simulated payment**, or use **Join waitlist** on the
sold-out event.

## Checks

```sh
npm test
npm run build
```
