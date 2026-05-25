# It's Raining Geese

Interactive honk game with a Vite + React frontend and an Express telemetry proxy.

## Stack

- React + TypeScript (Vite)
- Framer Motion for goose rain animation
- Express API proxy for webhook forwarding
- Vitest + Testing Library + Supertest for tests

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local env file:

   ```bash
   copy .env.example .env.local
   ```

3. Set required values in `.env.local`:
   - `HONK_WEBHOOK_URL` (required for telemetry forwarding)
   - `ALLOWED_ORIGINS` (comma-separated allowlist, defaults open when unset)
   - Optional overrides: `VITE_GOOSE_IMAGE_URL`, `VITE_HONK_SOUND_URL`, `PORT`

4. Start frontend + API together:

   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`
   - API: `http://localhost:8787`

## Scripts

- `npm run dev` - run web + API concurrently
- `npm run build` - type-check and build frontend
- `npm run lint` - run ESLint
- `npm run test` - run frontend and API tests
- `npm run start:api` - run only API server

## Telemetry contract

Frontend sends:

```json
{
  "honkCount": 5,
  "intensity": "Epic"
}
```

API validates and forwards:

```json
{
  "eventType": "goose_honk",
  "honkCount": 5,
  "intensity": "Epic",
  "occurredAt": "2026-01-01T00:00:00.000Z"
}
```

## Security and reliability notes

- Webhook URL is server-side only (`HONK_WEBHOOK_URL`) and never exposed to the browser.
- Input validation enforces honk count bounds and intensity consistency.
- Optional origin allowlist via `ALLOWED_ORIGINS`.
- API-level in-memory rate limiting to protect webhook abuse.
- Webhook forwarding retries transient failures (`5xx` and `429`) with backoff.
