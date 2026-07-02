@AGENTS.md

# Related mobile apps

This web platform (Next.js + API) is the backend for two native mobile clients.
They authenticate against this app's Auth.js API and read/write the same
database via the REST API (dashboard, devices, telemetry, control commands,
automations). Keep the mobile API models in sync when changing API responses.

- **iOS (SwiftUI):** `~/projects/mobile/iOS/iotplatformapp`
  - Bundle `com.tertiaryinfotech.iotflow`; XcodeGen (`project.yml`) is source of truth.
  - Default backend: `AppConfig.defaultServer` (Settings → Server overrides it).
- **Android (Kotlin/Compose):** `~/projects/mobile/Android/iotplatformapp`
  - Package `com.tertiaryinfotech.iotflow`; backend base in `Store.serverURL`.

Both apps mirror the web dashboard (display + control widgets) and can trigger
device actions / n8n flows through `/api/devices/:id/command` and
`/api/automations`.
