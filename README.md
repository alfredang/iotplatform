<div align="center">

# IoTFlow

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![n8n](https://img.shields.io/badge/n8n-low--code-EA4B71?logo=n8n&logoColor=white)](https://n8n.io)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

**A low-code, self-hosted IoT platform powered by n8n — connect Arduino/ESP32/Raspberry Pi over MQTT & HTTP, control them in real time from web & mobile, and automate everything with drag-and-drop n8n flows.**

[Report Bug](https://github.com/alfredang/iotplatform/issues) · [Request Feature](https://github.com/alfredang/iotplatform/issues)

</div>

---

## Screenshots

### Landing page
![Landing page](screenshot.png)

### Real-time dashboard
![Dashboard](dashboard.png)

---

## 🚀 Demo Login

After running the app and seeding demo data (`npm run db:seed`):

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@demo.io` | `password123` |
| **User** | `user@demo.io` | `password123` |

The demo seed creates an admin and a regular user, multiple **projects** (each a
workspace with its own devices, dashboard, alerts and map), ~24h of telemetry, an
alert rule and fully populated dashboards so you can explore immediately.

> On a fresh install with no seed, the **first account you register becomes an
> Admin** automatically — so you can set up locally with no manual steps.

---

## About

IoTFlow is a free, self-hosted **low-code IoT platform** inspired by Blynk,
ThingsBoard and OpenRemote — with **n8n** as its automation engine. Connect a
device in minutes, control it both ways over MQTT/HTTP, build a dashboard for web
and mobile, and wire device events to no-code n8n flows that notify, control,
log or call AI.

### Key Features

- **Low-code automations with n8n** — forward device events (telemetry, alerts,
  device online/offline, commands) to n8n Webhook flows; flows call back to
  control devices. Live connection status + per-automation delivery status.
  See [docs/n8n-integration.md](docs/n8n-integration.md).
- **Two-way device control (Blynk-style virtual pins)** — Button, Switch, Slider,
  Terminal & LED widgets write to a virtual pin; the server persists the value
  and publishes it to MQTT `devices/<id>/down`. HTTP-only devices poll
  `GET /api/device/state`.
- **Connect any device** — guided wizard with copy-paste **uplink + control**
  code for ESP32, Arduino, Raspberry Pi, generic **C++** (Paho), **Python**
  (paho/requests), MQTT clients and cURL.
- **Telemetry** — JSON ingestion over **HTTP** and **MQTT**, normalized into metrics.
- **Real-time dashboard** — auto-refreshing summary cards + customizable widgets
  (number, line, bar, gauge, LED, device status, alert list, map + control widgets).
- **Installable mobile app (PWA)** — add IoTFlow to your phone's home screen.
- **Alerts** — threshold rules (`>`, `<`, `≥`, `≤`, `=`) and device-offline rules,
  with active/resolve workflow (and every alert can trigger an n8n flow).
- **Projects** — each project is a self-contained workspace with its own devices,
  dashboard, automations, alerts and map; switch projects from the sidebar.
- **Authentication** — email/password, OTP email codes, Google & GitHub OAuth
  (OAuth/SMTP activate automatically when configured); Admin & User roles.
- **Admin area** — manage users/roles, deactivate accounts, API keys and SMTP +
  email-on-alert from the UI. **View as** lets admins preview as a regular user.
- **Maps** — OpenStreetMap view of GPS-enabled devices.
- **API keys** — account-level keys for HTTP telemetry submission and n8n callbacks.
- **Industry-focused landing page** — agriculture, industrial, smart home, energy,
  healthcare, buildings, logistics, water and retail use cases.
- **Dark theme by default** with a light/dark toggle, fully mobile-friendly.

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
| MQTT | Eclipse Mosquitto broker + a Node ingestion worker (`mqtt`); server-side publisher for downlink control |
| Automation | n8n (webhook events out + REST callbacks in) |
| Mobile | Installable PWA (web app manifest) |
| Email | Nodemailer (SMTP) |
| Deploy | Docker · Docker Compose · Coolify |

---

## Architecture

```
                         ┌──────────────────────────────┐        events (webhook)
   Browser / Mobile ───▶ │   Next.js 16 (web)           │ ─────────────────────────▶ ┌──────────┐
   (PWA, control UI)     │   • Marketing + Auth pages    │                             │   n8n    │
                         │   • Dashboard + Automations   │ ◀───────────────────────── │  flows   │
                         │   • API route handlers        │   REST callbacks (control)  └──────────┘
                         └───────────┬───────────────────┘
                                     │  Prisma
   Devices ──HTTP POST──▶ /api/telemetry (uplink) ──┐
   Devices ──GET────────▶ /api/device/state (downlink poll)
                                     │               ▼
   Devices ──MQTT pub──▶ ┌───────────┴──┐  ┌──────────────┐
   (devices/<id>/telemetry) MQTT Worker  │  │ PostgreSQL   │
   ┌──────────────┐      │ • subscribe  │─▶│ devices,     │
   │ Mosquitto    │◀─────┤ • ingest     │  │ telemetry,   │
   │ broker       │      │ • offline    │  │ commands,    │
   └──────┬───────┘      │   sweep      │  │ automations  │
          │              └──────────────┘  └──────────────┘
          ▼  devices/<id>/down (control)   Shared ingest + alert + dispatch engine
   Devices subscribe & act (BLYNK_WRITE-style)   (lib/telemetry, lib/alerts, lib/automations)
```

---

## Project Structure

```
iotplatform/
├── app/
│   ├── (marketing)/        # industry-focused landing page
│   ├── (auth)/             # login, register, forgot-password, verify-otp
│   ├── (dashboard)/        # dashboard, devices, telemetry, alerts, automations, maps, api-keys, settings
│   ├── api/                # route handlers (devices, telemetry, commands, automations, n8n, ...)
│   └── manifest.ts         # PWA web app manifest
├── components/             # layout, dashboard (+ control widgets), devices, automations, charts, maps, auth, ui
├── lib/                    # auth, db, mqtt (topics + publish), telemetry, alerts,
│                           # commands, automations (dispatch), n8n, validation, tokens
├── prisma/                 # schema.prisma, seed.ts, migrations
├── worker/                 # mqtt-ingest.ts (long-running ingestion worker)
├── mosquitto/              # mosquitto.conf
├── docs/                   # connecting-a-device.md, n8n-integration.md
├── Dockerfile
└── docker-compose.yml
```

---

## Getting Started

### Quick Start with Docker Compose (recommended)

The Compose stack is self-contained and runs with **zero configuration** — it
ships sensible defaults (including a dev `NEXTAUTH_SECRET`), so a single command
brings up everything: `web` (Next.js), `worker` (MQTT ingestion), `db`
(PostgreSQL) and `mqtt` (Mosquitto).

```bash
git clone https://github.com/alfredang/iotplatform.git
cd iotplatform

docker compose up -d --build
# Web:  http://localhost:3000
# MQTT: localhost:1883  (WebSocket: 9001)
```

Database migrations run automatically when the web container starts. Load the
demo data once (two accounts, projects, devices, telemetry, an alert and
dashboards):

```bash
docker compose exec web npm run db:seed
# Admin: admin@demo.io / password123
# User:  user@demo.io  / password123
```

> For anything beyond local testing, create a `.env` (see [`.env.example`](.env.example))
> and at minimum set a strong `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and
> `NEXTAUTH_URL`. Compose automatically reads a `.env` file in the project root.

Useful commands:

```bash
docker compose logs -f web worker   # tail logs
docker compose down                 # stop
docker compose down -v              # stop + wipe the database volume
```

### Local Development

Requirements: Node.js 22+, a PostgreSQL database, (optional) an MQTT broker.

```bash
npm install
cp .env.example .env        # point DATABASE_URL at your Postgres

npm run db:migrate          # create tables
npm run db:seed             # optional demo data (admin@demo.io / password123)

npm run dev                 # http://localhost:3000
npm run worker              # in a second terminal: MQTT ingestion worker
```

### Environment Variables

See [`.env.example`](.env.example). Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` / `AUTH_URL` | Public base URL of the app |
| `GOOGLE_CLIENT_ID/SECRET` | Enables the Google login button |
| `GITHUB_CLIENT_ID/SECRET` | Enables the GitHub login button |
| `SMTP_*` | Sends OTP / reset emails (codes log to console if unset) |
| `MQTT_BROKER_URL` | Broker the worker + downlink publisher connect to |
| `NEXT_PUBLIC_MQTT_HOST` | `host:port` shown in device sample code |
| `DEVICE_OFFLINE_SECONDS` | Mark a device offline after this idle period |
| `N8N_BASE_URL` | Your n8n instance URL (enables the Automations page) |
| `N8N_API_KEY` | n8n API key (Settings → API) for workflow status/listing |

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

Use a **device token** (`dev_...`) to identify the device directly, or an
**account API key** (`iot_...`) plus a `"deviceId"` field in the body. GPS is
recognised (`{"gps":{"lat":1.3,"lng":103.8}}`) and updates the map location.

### MQTT

Publish JSON (including your device token) to `devices/<deviceId>/telemetry`:

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "devices/my-device/telemetry" \
  -m '{"token":"dev_xxx","temperature":28.5,"humidity":65}'
```

See [docs/connecting-a-device.md](docs/connecting-a-device.md) for ESP32/Arduino/Pi examples.

### Controlling a device (downlink)

Write a virtual pin from a dashboard widget, the API, or an n8n flow:

```bash
curl -X POST https://your-host/api/devices/<id>/command \
  -H "Authorization: Bearer iot_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pin":"relay","value":1}'
```

The value is persisted and published to MQTT `devices/<deviceId>/down`. MQTT
devices subscribe and act on `{pin,value}` (Blynk `BLYNK_WRITE`-style); HTTP-only
devices poll `GET /api/device/state` with their device token.

---

## Low-code automations with n8n

IoTFlow uses **n8n** as its automation engine. On the **Automations** page, map a
device event (`TELEMETRY`, `ALERT`, `DEVICE_ONLINE`, `DEVICE_OFFLINE`, `COMMAND`)
to an n8n Webhook flow; the flow can call back into the API to control devices,
notify (Email/Slack/Telegram/WhatsApp), log to Sheets/DB, or run AI — all no-code.
Set `N8N_BASE_URL` + `N8N_API_KEY` to activate.

**Full guide + 10 ready-made sample flows** (Blink LED, multi-LED, sonar alarm,
temperature→fan, humidity→humidifier, soil→pump, motion→light, offline alert,
data logger, daily summary) with step-by-step setup instructions:
[docs/n8n-integration.md](docs/n8n-integration.md).

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
| `POST/GET` | `/api/telemetry` | Ingest telemetry (uplink) / query recent |
| `GET/POST` | `/api/devices/:id/command` | Read pin states / set a virtual pin (downlink) |
| `GET` | `/api/device/state` | Device-facing pin-state poll (device token) |
| `GET/POST` | `/api/alerts` | Alerts + rules / create rule |
| `PUT` | `/api/alerts/:id/resolve` | Resolve an alert |
| `PATCH/DELETE` | `/api/alert-rules/:id` | Toggle / delete a rule |
| `GET` | `/api/dashboard/summary` | Counts, latest telemetry, activity |
| `GET/POST` | `/api/dashboard/widgets` | Dashboard widgets (display + control) |
| `GET/POST` | `/api/automations` | List / create n8n automations |
| `PATCH/DELETE/POST` | `/api/automations/:id` | Update / delete / test an automation |
| `GET` | `/api/n8n/workflows` | n8n connection status + workflow list |
| `GET/POST` | `/api/api-keys` | List / create API keys |

---

## Deployment

There are two supported paths: the all-in-one **Docker Compose** stack, or the
**Dockerfile** image deployed against a **separately provisioned database**
(recommended for Coolify / managed Postgres).

### Option A — Docker Compose (all-in-one)

Best for a single host where the platform manages its own Postgres + MQTT.

1. Push this repo to GitHub/GitLab.
2. In Coolify, create a new resource → **Docker Compose** pointing at this repo
   (it uses [`docker-compose.yml`](docker-compose.yml)).
3. Set env vars — at minimum `NEXTAUTH_SECRET` and `NEXTAUTH_URL` (your domain).
4. Deploy. Coolify builds the shared image and starts `web`, `worker`, `db`
   (Postgres) and `mqtt` (Mosquitto). Migrations run automatically on web start.
5. (Optional) Seed demo data once from the web container: `npm run db:seed`.

### Option B — Dockerfile with a separate database (Coolify)

Best when the database is provisioned separately (e.g. a Coolify-managed
Postgres, Supabase, RDS, Neon). You deploy the app image and point it at that DB.

1. **Provision Postgres** separately and copy its connection string.
2. In Coolify, create an **Application** → build from the [`Dockerfile`](Dockerfile)
   in this repo (target `runner`). The same image runs both the web app and the
   worker.
3. **Web service** — set environment variables:

   ```env
   DATABASE_URL=postgresql://user:pass@your-db-host:5432/iot?schema=public
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://your-domain
   AUTH_SECRET=<same as NEXTAUTH_SECRET>
   AUTH_URL=https://your-domain
   AUTH_TRUST_HOST=true
   NEXT_PUBLIC_APP_URL=https://your-domain
   # Optional: GOOGLE_*, GITHUB_*, MQTT_BROKER_URL, NEXT_PUBLIC_MQTT_HOST
   ```

   Start command (runs migrations, then the server):

   ```bash
   sh -c "npx prisma migrate deploy && npm run start"
   ```

4. **Worker service (optional, for MQTT)** — deploy a second service from the
   **same image** with start command `npm run worker` and the same `DATABASE_URL`
   + `MQTT_BROKER_URL` pointing at your broker. Skip this if you only use HTTP
   telemetry.
5. (Optional) Seed demo data once: run `npm run db:seed` in the web container's
   terminal.

Build/run the image directly without Coolify:

```bash
docker build -t iotflow .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/iot?schema=public" \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  -e NEXTAUTH_URL="https://your-domain" -e AUTH_TRUST_HOST=true \
  iotflow sh -c "npx prisma migrate deploy && npm run start"
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## Developed By

<div align="center">

**Powered by [Tertiary Infotech Academy Pte Ltd](https://www.tertiarycourses.com.sg/)**

</div>

## Acknowledgements

- Inspired by [Blynk](https://blynk.io), [ThingsBoard](https://thingsboard.io)
  and [OpenRemote](https://openremote.io); automation powered by [n8n](https://n8n.io)
- Built with [Next.js](https://nextjs.org), [Prisma](https://www.prisma.io),
  [Auth.js](https://authjs.dev), [Recharts](https://recharts.org),
  [Leaflet](https://leafletjs.com) and [Eclipse Mosquitto](https://mosquitto.org)
- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors

---

## License

MIT — free to self-host and adapt.

<div align="center">

⭐ If you find this project useful, please consider giving it a star!

</div>
