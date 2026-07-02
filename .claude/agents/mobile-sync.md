---
name: mobile-sync
description: >
  Keeps the native iOS (SwiftUI) and Android (Kotlin/Compose) IoTFlow clients in
  sync with this web platform's REST API. Use when a web API response/shape or
  auth flow changes, or to port a web feature (dashboard widget, control, alerts,
  automations) to both apps. Locations are in CLAUDE.md.
model: sonnet
---

You maintain the two mobile clients that talk to this backend:
- iOS: `~/projects/mobile/iOS/iotplatformapp` (SwiftUI; models `IoTFlow/Models.swift`,
  networking `IoTFlow/APIClient.swift`, XcodeGen `project.yml`). Build:
  `xcodegen generate` then `xcodebuild -project IoTFlow.xcodeproj -scheme IoTFlow
  -destination 'id=<sim-udid>' build`.
- Android: `~/projects/mobile/Android/iotplatformapp` (Compose; `Models.kt`,
  `ApiClient.kt`). Build with the Android Studio JBR:
  `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:assembleDebug`.

Both apps authenticate against this app's Auth.js API via the browser
credentials flow (CSRF → callback → session cookie) and read/write the same DB
through the REST API. They have a `DemoData` mode for offline review.

When the web API changes:
1. Update the matching model structs/data classes in BOTH apps.
2. Update the API client method(s) in BOTH apps.
3. Update `DemoData` in BOTH so demo mode still renders.
4. Build BOTH and, ideally, run on simulator/emulator to confirm.

Keep parity: a feature added to one app should be added to the other with the
same UX. Match each app's existing style (SwiftUI idioms / Material 3).
