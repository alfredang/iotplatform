<div align="center">

# IoTFlow

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

**A lightweight, modern, self-hosted IoT platform — connect devices, stream real-time data, build dashboards and get alerts.**

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

| Field | Value |
|---|---|
| **Email** | `admin@demo.io` |
| **Password** | `password123` |

The demo seed creates an admin user, several devices, ~24h of telemetry, an alert rule and a fully populated dashboard so you can explore immediately.

---

## About

IoTFlow is a free, self-hosted IoT platform inspired by OpenRemote, ThingsBoard
and AWS IoT Application Kit — without the heavyweight complexity. It is designed
to be beginner-friendly, fast and mobile-first, with a built-in dark theme.

### Key Features

- **One-page landing site** with an enquiry form (saved to PostgreSQL)
- **Authentication** — email/password, OTP email codes, Google & GitHub OAuth
  (OAuth/SMTP activate automatically when configured)
- **Roles** — Admin, User, Viewer (read-only)
- **Device management** — add/edit/delete, status & last-seen, device tokens
- **Guided connection wizard** — 6 steps with copy-paste code for ESP32, Arduino,
  Raspberry Pi, MQTT clients and cURL
- **Telemetry** — JSON ingestion over **HTTP** and **MQTT**, normalized into metrics
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

## Architecture

```
                         ┌──────────────────────────────┐
   Browser  ───────────▶ │   Next.js 16 (web)           │
                         │   • Marketing + Auth pages    │
                         │   • Dashboard (SWR, 5s poll)  │
                         │   • API route handlers        │
                         └───────────┬───────────────────┘
                                     │  Prisma
   Devices ──HTTP POST──▶ /api/telemetry ──┐
                                     │      ▼
   Devices ──MQTT pub──▶ ┌───────────┴──┐  ┌──────────────┐
                         │ MQTT Worker  │  │ PostgreSQL   │
   ┌──────────────┐      │ • subscribe  │─▶│ devices,     │
   │ Mosquitto    │◀─────┤ • ingest     │  │ telemetry,   │
   │ broker       │      │ • offline    │  │ alerts, ...  │
   └──────────────┘      │   sweep      │  └──────────────┘
                         └──────────────┘
        Shared ingest + alert-evaluation engine (lib/telemetry, lib/alerts)
```

---

## Project Structure

```
iotplatform/
├── app/
│   ├── (marketing)/        # landing page
│   ├── (auth)/             # login, register, forgot-password, verify-otp
│   ├── (dashboard)/        # dashboard, devices, telemetry, alerts, maps, api-keys, settings
│   └── api/                # route handlers (devices, telemetry, alerts, ...)
├── components/             # layout, dashboard, devices, charts, maps, auth, ui
├── lib/                    # auth, db, mqtt, telemetry, alerts, validation, tokens
├── prisma/                 # schema.prisma, seed.ts, migrations
├── worker/                 # mqtt-ingest.ts (long-running ingestion worker)
├── mosquitto/              # mosquitto.conf
├── docs/                   # connecting-a-device.md
├── Dockerfile
└── docker-compose.yml
```

---

## Getting Started

### Quick Start (Docker — recommended)

```bash
git clone https://github.com/alfredang/iotplatform.git
cd iotplatform
cp .env.example .env
# Edit .env: set NEXTAUTH_SECRET (openssl rand -base64 32) and any OAuth/SMTP.

docker compose up -d --build
# Web:  http://localhost:3000
# MQTT: localhost:1883
```

Load demo data once (demo admin, devices, telemetry, alert, dashboard):

```bash
docker compose exec web npm run db:seed
# Demo login: admin@demo.io / password123
```

The stack runs four services: `web` (Next.js), `worker` (MQTT ingestion),
`db` (PostgreSQL) and `mqtt` (Mosquitto).

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
| `MQTT_BROKER_URL` | Broker the worker connects to |
| `NEXT_PUBLIC_MQTT_HOST` | `host:port` shown in device sample code |
| `DEVICE_OFFLINE_SECONDS` | Mark a device offline after this idle period |

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

## Deployment

### Coolify

1. Push this repo to GitHub/GitLab.
2. In Coolify, create a new resource → **Docker Compose** pointing at this repo.
3. Set env vars (at minimum `NEXTAUTH_SECRET`, `NEXTAUTH_URL` to your domain).
4. Deploy. Coolify builds the shared image and starts `web`, `worker`, `db` and
   `mqtt`. Migrations run automatically on web startup.
5. (Optional) Seed demo data once: `npm run db:seed`.

> The platform also runs as a single web container against an external managed
> Postgres + MQTT broker — just set the matching env vars.

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

- Inspired by [OpenRemote](https://openremote.io), [ThingsBoard](https://thingsboard.io)
  and [AWS IoT Application Kit](https://github.com/awslabs/iot-app-kit)
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
