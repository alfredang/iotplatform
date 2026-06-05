# IoTFlow — Lightweight, Self-Hosted IoT Platform

A clean, modern, beginner-friendly IoT platform. Connect devices over **MQTT** or
**HTTP**, stream real-time telemetry, build simple dashboards with charts, gauges
and maps, and get alerts when something goes wrong. Free, self-hosted and
Coolify/Docker-ready.

Inspired by OpenRemote, ThingsBoard and AWS IoT Application Kit — without the
heavyweight complexity.

---

## Features

- **One-page landing site** with an enquiry form (saved to PostgreSQL)
- **Authentication** — email/password, OTP email codes, Google & GitHub OAuth
  (OAuth/SMTP activate automatically when configured)
- **Roles** — Admin, User, Viewer (read-only)
- **Device management** — add/edit/delete, status & last-seen, device tokens
- **Guided connection wizard** — 6 steps with copy-paste code for ESP32, Arduino,
  Raspberry Pi, MQTT clients and cURL
- **Telemetry** — JSON ingestion over HTTP and MQTT, normalized into metrics
- **Real-time dashboard** — auto-refreshing summary cards + customizable widgets
  (number, line, bar, gauge, device status, alert list, map)
- **Alerts** — threshold rules (`>`, `<`, `≥`, `≤`, `=`) and device-offline rules,
  with active/resolve workflow
- **Maps** — OpenStreetMap view of GPS-enabled devices
- **API keys** — account-level keys for HTTP telemetry submission
- **Dark theme by default** with a light/dark toggle, fully mobile-friendly

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS v4 · `next-themes` · lucide-react |
| Database | PostgreSQL · Prisma 6 |
| Auth | Auth.js v5 (NextAuth) · bcrypt |
| Charts / Maps | Recharts · React-Leaflet (OpenStreetMap) |
| Realtime | SWR polling (5s) |
| MQTT | Eclipse Mosquitto broker + a Node ingestion worker (`mqtt`) |
| Email | Nodemailer (SMTP) |
| Deploy | Docker · Docker Compose · Coolify |

---

## Quick Start (Docker — recommended)

```bash
cp .env.example .env
# Edit .env: set NEXTAUTH_SECRET (openssl rand -base64 32) and any OAuth/SMTP.

docker compose up -d --build
# Web:    http://localhost:3000
# MQTT:   localhost:1883
```

Load demo data once (a demo admin, devices, telemetry, an alert and a dashboard):

```bash
docker compose exec web npm run db:seed
# Demo login: admin@demo.io / password123
```

The stack runs four services: `web` (Next.js), `worker` (MQTT ingestion), `db`
(PostgreSQL) and `mqtt` (Mosquitto).

---

## Local Development

Requirements: Node.js 22+, a PostgreSQL database, (optional) an MQTT broker.

```bash
npm install
cp .env.example .env        # point DATABASE_URL at your Postgres

npm run db:migrate          # create tables
npm run db:seed             # optional demo data

npm run dev                 # http://localhost:3000
```

Run the MQTT ingestion worker in a second terminal (needs a broker + DATABASE_URL):

```bash
npm run worker
```

### Environment variables

See [`.env.example`](.env.example). Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` / `AUTH_URL` | Public base URL of the app |
| `GOOGLE_CLIENT_ID/SECRET` | Enables the Google login button |
| `GITHUB_CLIENT_ID/SECRET` | Enables the GitHub login button |
| `SMTP_*` | Sends OTP / reset emails (codes log to console if unset) |
| `MQTT_BROKER_URL` | Broker the worker connects to |
| `NEXT_PUBLIC_MQTT_HOST` | `host:port` shown in device sample code |
| `DEVICE_OFFLINE_SECONDS` | Mark a device offline after this idle period |

### PostgreSQL & Prisma

```bash
npm run db:migrate     # dev migrations (prisma migrate dev)
npm run db:deploy      # apply migrations in production
npm run db:studio      # browse data in Prisma Studio
npm run db:seed        # (re)seed demo data — DESTRUCTIVE, clears existing rows
```

---

## Connecting a Device

The in-app **Add Device** wizard generates ready-to-paste snippets with your
device's token baked in. The essentials:

### HTTP (REST)

```bash
curl -X POST https://your-host/api/telemetry \
  -H "Authorization: Bearer <DEVICE_OR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"temperature": 28.5, "humidity": 65, "voltage": 3.7}'
```

- Use a **device token** (`dev_...`) to identify the device directly, **or** an
  **account API key** (`iot_...`) plus a `"deviceId"` field in the body.
- GPS is supported as `{"gps": {"lat": 1.3, "lng": 103.8}}` or top-level
  `lat`/`lng` — it updates the device's map location.

### MQTT

Publish JSON (including your device token) to `devices/<deviceId>/telemetry`:

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "devices/my-device/telemetry" \
  -m '{"token":"dev_xxx","temperature":28.5,"humidity":65}'
```

The worker subscribes to `devices/+/telemetry`, authenticates by the embedded
token, stores telemetry and evaluates alert rules.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health + DB check |
| `POST` | `/api/enquiry` | Submit a landing-page enquiry |
| `POST` | `/api/auth/register` | Create an account |
| `GET/POST` | `/api/devices` | List / create devices |
| `GET/PUT/DELETE` | `/api/devices/:id` | Read / update / delete a device |
| `POST` | `/api/devices/:id/token` | Regenerate device token |
| `GET` | `/api/devices/:id/telemetry` | Device telemetry + metric list |
| `POST/GET` | `/api/telemetry` | Ingest telemetry / query recent |
| `GET/POST` | `/api/alerts` | Alerts + rules / create rule |
| `PUT` | `/api/alerts/:id/resolve` | Resolve an alert |
| `PATCH/DELETE` | `/api/alert-rules/:id` | Toggle / delete a rule |
| `GET` | `/api/dashboard/summary` | Counts, latest telemetry, activity |
| `GET/POST` | `/api/dashboard/widgets` | Dashboard widgets |
| `GET/POST` | `/api/api-keys` | List / create API keys |

---

## Deploying to Coolify

1. Push this repo to GitHub/GitLab.
2. In Coolify, create a new resource → **Docker Compose** and point it at this
   repo (it uses `docker-compose.yml`).
3. Set environment variables (at minimum `NEXTAUTH_SECRET`, `NEXTAUTH_URL` to your
   public domain). Add OAuth/SMTP if desired.
4. Deploy. Coolify builds the shared image and starts `web`, `worker`, `db` and
   `mqtt`. Migrations run automatically on web startup.
5. (Optional) Seed demo data once via Coolify's terminal:
   `npm run db:seed`.

> The platform also runs as a single web container against an external managed
> Postgres + MQTT broker — just set the matching env vars.

---

## Project Structure

```
app/
  (marketing)/        landing page
  (auth)/             login, register, forgot-password, verify-otp
  (dashboard)/        dashboard, devices, telemetry, alerts, maps, api-keys, settings
  api/                route handlers
components/           layout, dashboard, devices, charts, maps, auth, ui
lib/                  auth, db, mqtt, telemetry, alerts, validation, tokens
prisma/              schema.prisma, seed.ts, migrations
worker/              mqtt-ingest.ts
mosquitto/           mosquitto.conf
```

---

## License

Free to self-host and adapt. No warranty.
