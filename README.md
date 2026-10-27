# Tartan Tickets

A responsive HW3 demo for browsing upcoming CMU events and signing in with a
typed name. Event listings, sign-in state, simulated orders, and waitlist
entries live in server memory and reset when the server restarts or the app is
redeployed. Names are typed in by the user; there is no SSO provider, real
payment processor, or database.

The demo treats a blank or whitespace-only name as a failed sign-in. Five
failed attempts in any 10-minute window lock that browser for 15 minutes. A
successful sign-in clears the browser's recorded failures. Because this is a
name-only demo, this lockout is not real account security.

## Run locally

Use Node.js 20.9 or newer, then run:

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Sign in** and
enter a name. You can then use **Buy tickets** and submit **Simulated payment**,
or use **Join waitlist** on the sold-out event.

## Checks

```sh
npm test
npm run build
```
