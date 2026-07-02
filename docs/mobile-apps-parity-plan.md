# Mobile Apps — Parity Research & Upgrade Plan

> Compiled 2026-07-02 (Claude Code, from read-only exploration of the platform + both mobile apps).
> Goal: bring the **iOS** and **Android** apps to feature parity with the **IoTFlow web platform** —
> (1) view the dashboard, (2) trigger any device action, (3) receive alert **push notifications**,
> (4) a **very visual** UI. Push approach chosen: **true push via APNs (iOS) + FCM (Android)** with a
> small backend addition.

## Surfaces & locations

| Surface | Path | Stack |
|---|---|---|
| **Web platform** (source of truth) | `tertiary/iotplatform` | Next.js 16 (App Router), React 19, TS, Prisma 6 + Postgres, Auth.js v5, Mosquitto MQTT, n8n, Recharts, React-Leaflet |
| **iOS app** (IoTFlow) | `mobile/iOS/iotplatformapp` (`IoTFlow.xcodeproj`) | SwiftUI, iOS 17, Swift 5, **XcodeGen** (`project.yml` is source of truth), no 3rd-party deps |
| **Android app** (IoTFlow) | `mobile/Android/iotplatformapp` | Kotlin 2.0.21, Jetpack Compose + Material 3, minSdk 24 / target 36, OkHttp + kotlinx-serialization |

**Shared conventions (keep consistent across all three):**
- Bundle/app id: `com.tertiaryinfotech.iotflow`
- Backend base URL: `https://iot.tertiaryinfotech.com` (user-configurable in both apps)
- Auth: **Auth.js v5 (NextAuth) credentials flow → JWT session cookie** (`authjs.session-token`), carried via a persistent cookie jar (no bearer token in the apps). Login = `GET /api/auth/csrf` → `POST /api/auth/callback/credentials` → `GET /api/auth/session`.
- Design system: **teal on navy** — primary teal `#2DD4BF` (light `#14B8A6`), bg navy `#0B0F1E`, surface `#141A2E`; accents green online `#22C55E`, gray offline `#9CA3AF`, orange alert `#F59E0B`, blue stat `#3B82F6`.

---

## Current state (both apps are near-identical lean read-only viewers)

Both apps implement the same feature set and have the same gaps.

**Implemented (both):** Auth.js login/register + demo mode, session persistence (cookie jar), Dashboard (4 stat cards: total/online/offline/active-alerts + latest-telemetry list + recent-alerts list, pull-to-refresh), Devices list + add + delete + read-only detail, Settings (account, server URL, sign out). 3-tab bottom nav (Dashboard / Devices / Settings). Teal-on-navy theme.

**Missing on BOTH (the parity work):**
- ❌ **Device control / actions** — no virtual-pin command UI (switch/button/slider/terminal).
- ❌ **Visual widgets** — no charts, gauges, or maps (strictly list + stat cards).
- ❌ **Push notifications** — no APNs (iOS) / FCM (Android); no notification permission.
- ❌ **Historical telemetry** — only latest values; no time-series charts / metric picker / range.
- ❌ **Alert management** — can view recent alerts but can't resolve or view rules.
- ❌ **Maps** — device lat/long exist in the model but no map view.
- ❌ **Projects/workspaces** switching.

iOS source: `IoTFlow/{IoTFlowApp,SessionStore,APIClient,Models,DemoData}.swift` + `Views/*`.
Android source: `app/src/main/java/com/tertiaryinfotech/iotflow/{ApiClient,Models,SessionViewModel,Store,PersistentCookieJar,Format,DemoData,MainActivity}.kt` + screen Composables. Both architectures are solid and should be **extended, not replaced**.

---

## Platform reference — what the apps must match

### Dashboard data
- `GET /api/dashboard/summary` → counts {total, online, offline, activeAlerts}, latestTelemetry[], recentAlerts[], devices[]. (Poll ~5s.)
- `GET /api/dashboard/widgets` → user's widget layout. Widget types: `NUMBER, LINE, BAR, GAUGE, STATUS, ALERTS, MAP, BUTTON, SWITCH, SLIDER, TERMINAL, LED` (config JSON holds `{min,max,pin}` for controls).
- `GET /api/devices/:id/telemetry?metric=&since=&limit=` → time-series for charts.

### "Trigger any action" = the virtual-pin command system
- **`POST /api/devices/:id/command`** body `{ pin: "V1", value: 0|1|number, strValue?: "text" }` → persists `DeviceCommand` (unique per device+pin), publishes MQTT `devices/<deviceId>/down`, fires the `COMMAND` automation event.
- **`GET /api/devices/:id/command`** → current pin states (to reflect device state in the UI).
- Control widget semantics: **SWITCH** toggle 0/1 · **BUTTON** momentary (send 1 then 0) · **SLIDER** number in [min,max] · **TERMINAL** text via `strValue`.

### Alerts
- `GET /api/alerts?status=ACTIVE|RESOLVED` → alerts + rules. `PUT /api/alerts/:id/resolve` → resolve. Rules: threshold (`GT/LT/GTE/LTE/EQ` on a metric) or `OFFLINE` (durationSecs).
- Generated in `lib/alerts/evaluate.ts` (`notifyAlert()` sends email + dispatches the `ALERT` n8n event). **This is where push should be added.**

### Key data models (Prisma)
`Device`(deviceId, protocol, status, lat/long…), `Telemetry`(deviceId, ts, metric, value), `DeviceCommand`(deviceId, pin, value, strValue — unique per device+pin), `AlertRule`/`Alert`(status ACTIVE|RESOLVED), `Widget`(type, deviceId, metric, config), `Automation`(event enum incl. COMMAND), `ApiKey`(`iot_`), `DeviceToken`(`dev_`), `Project`.

---

## Upgrade plan

### Phase 0 — Backend: native push (in `iotplatform`)
1. **Prisma**: add `PushToken { id, userId, platform: 'ios'|'android', token @unique, createdAt, updatedAt }` (relation to User). Migrate.
2. **`POST /api/push/register`** (session auth): upsert `{platform, token}` for the signed-in user. **`POST /api/push/unregister`** on logout.
3. **`lib/push/send.ts`**: `sendPush(userId, {title, body, data})` → APNs (HTTP/2 with the `.p8` key already in `mobile apps/AuthKey_*.p8`; needs keyId/teamId/bundle `com.tertiaryinfotech.iotflow`) + FCM (HTTP v1 via a service account). Fire-and-forget, prune dead tokens on 410/NotRegistered.
4. **Hook** into `lib/alerts/evaluate.ts` `notifyAlert()`: after creating an ACTIVE alert, `sendPush(device.owner.id, {title: device.name, body: alert.message, data:{alertId, deviceId}})` alongside email/n8n.
5. **Env**: `APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_KEY_PATH` (+ `APNS_PRODUCTION`), `FCM_SERVICE_ACCOUNT_JSON`. Document in `.env.example`.

### Phase 1 — iOS (SwiftUI, extend `APIClient`/models; edit `project.yml`, not the xcodeproj directly)
- **Networking/models**: add command get/set, device telemetry history, alerts list + resolve, widgets, push register. Models: `PinState`, `TelemetryPoint`, `Widget`, `AlertRule`.
- **APNs**: `UIApplicationDelegateAdaptor`; request auth; `registerForRemoteNotifications`; POST token to `/api/push/register`; handle foreground + tap → deep-link to alert/device. Add Push Notifications capability + background modes in `project.yml`.
- **Very-visual dashboard** (Swift Charts + MapKit — both native, no deps): NUMBER cards, **GAUGE** (radial), **LINE/area** + **BAR** charts, STATUS card, ALERTS card, **MAP** (device markers). Auto-refresh ~5s.
- **Device control panel** (in DeviceDetail): Switch, Button (momentary), Slider, Terminal tiles → `POST command`; reflect `GET command` state.
- **Telemetry screen**: metric picker + time-range + line/bar charts.
- **Alerts tab**: active/resolved list, resolve, detail. Expand nav to Dashboard / Devices / Alerts / Settings.
- **Theme**: switch accent to teal `#2DD4BF` on navy to match web + Android.

### Phase 2 — Android (Compose Material 3, extend `ApiClient`/models)
- Mirror the iOS networking/models additions.
- **FCM**: add `google-services.json` + `firebase-messaging`, `POST_NOTIFICATIONS` permission, `FirebaseMessagingService` (register token → `/api/push/register`, onMessage → notification + deep link).
- **Very-visual dashboard**: charts via **Vico** (or a light Canvas impl), gauge Composable, stat cards, widget grid, **map** via **osmdroid** (OSM/Leaflet parity, no Google API key).
- **Device control panel**: Switch/Button/Slider/Terminal Composables → command.
- **Telemetry** charts screen + **Alerts** screen (resolve). Expand bottom nav.
- Theme already teal-on-navy ✓.

### Phase 3 — Consistency doc
- Update `iotplatform/CLAUDE.md` (currently just `@AGENTS.md`) to document all three surfaces, the shared conventions above, the REST/command/alert contract, the push design, and the rule that **web + iOS + Android must stay consistent** (same API contract, same design system, same package id). Note each app's path.

### Suggested order
Backend push → iOS end-to-end (establishes the pattern) → mirror to Android → CLAUDE.md. Keep MVP tight on the four goals; defer offline cache, CSV export, and automations-management UI.

### Open decisions for later
- APNs sandbox vs production toggle (TestFlight vs App Store builds).
- FCM: new Firebase project vs reuse an existing `com.tertiaryinfotech.iotflow` one.
- Android map: osmdroid (recommended, no key) vs Google Maps Compose (needs Maps API key).
