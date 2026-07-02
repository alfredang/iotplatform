# Low-code IoT with n8n

IoTFlow uses **n8n** as its automation engine. Devices talk to the platform over
**MQTT/HTTP**; the platform streams data to your dashboard and **forwards every
event to n8n**, where you build the logic with drag-and-drop nodes. n8n flows
call **back** into the platform to control devices — closing the loop with zero
device-side code changes.

```
Arduino / ESP32 / Raspberry Pi
        │  MQTT (devices/<id>/telemetry)  or  HTTP POST /api/telemetry
        ▼
   ┌─────────────┐   event envelope   ┌──────────────┐
   │  IoTFlow    │ ─────────────────► │     n8n      │  notify / AI / log / …
   │  (dashboard)│ ◄───────────────── │   (flows)    │
   └─────────────┘   command callback └──────────────┘
        │  MQTT (devices/<id>/down)  +  DB pin state
        ▼
Arduino / ESP32 / Raspberry Pi   (BLYNK_WRITE-style handler)
```

## Two channels

1. **Events → n8n** — On the **Automations** page, create an automation that
   maps a platform event to an n8n **Webhook** node's Production URL. Events:
   `TELEMETRY`, `ALERT`, `DEVICE_ONLINE`, `DEVICE_OFFLINE`, `COMMAND`. Optional
   device/metric filters. Delivery is fire-and-forget (a slow flow never blocks
   ingestion) and the last delivery status is shown on the card.

2. **n8n → devices (callback)** — Flows control devices by calling:
   - `POST /api/devices/:id/command` — body `{ "pin": "V1", "value": 1 }`
   - `GET  /api/devices/:id/command` — read current pin states

   Auth with an **account API key** (`Authorization: Bearer iot_…`, from the
   API Keys page). Webhook-triggered flows don't need to hardcode the URL — the
   event envelope carries `api.base` + `api.command`, so the callback URL is
   `{{ $json.body.api.base }}{{ $json.body.api.command }}`.

## The event envelope

Every automation delivers the same JSON shape, so flows are easy to build:

```json
{
  "event": "TELEMETRY",
  "firedAt": "2026-07-02T06:06:43.000Z",
  "device": { "id": "…", "deviceId": "wh-sensor-a", "name": "Warehouse Sensor A",
              "status": "ONLINE", "latitude": 1.35, "longitude": 103.8 },
  "payload": { "metric": "temperature", "value": 41.5, "readings": { "temperature": 41.5, "humidity": 63 } },
  "api": { "base": "https://your-host", "command": "/api/devices/…/command", "telemetry": "/api/telemetry" }
}
```

## Embedded vs cloud n8n

Both are supported — it's just `N8N_BASE_URL` + `N8N_API_KEY`:

- **Cloud (recommended here):** point at your hosted instance
  `https://n8n.tertiarytraining.com`. Nothing to run locally; flows, credentials
  and executions live in one place you already manage. Best when the platform is
  deployed where it can reach that host.
- **Embedded/self-hosted:** add an `n8n` service to `docker-compose.yml` for a
  fully self-contained appliance (air-gapped sites, edge gateways). More to
  operate (auth, backups, updates), but no external dependency.

Start with the cloud instance; add an embedded n8n later only if a deployment
needs to run without internet access.

## 10 sample flows (created on n8n.tertiarytraining.com)

Each is a documented template with a Sticky Note explaining setup. Control flows
just need your **API key** pasted into the HTTP nodes; the callback URL is
derived from the event. Schedule flows (blink) need the host + device id edited.

| # | Flow | Trigger | What it does |
|---|------|---------|--------------|
| 01 | Blink LED (Arduino) | Schedule 2s | Alternates virtual pin `V1` 1/0 |
| 02 | Multiple LEDs chase (Arduino) | Schedule 1s | Cycles `V1`/`V2`/`V3` |
| 03 | Sonar distance alarm (HC-SR04) | TELEMETRY `distance` | `< 20cm` → buzzer on/off |
| 04 | Temperature → fan (ESP32) | TELEMETRY `temperature` | `> 30°C` → `relay` on, else off |
| 05 | Humidity → humidifier (DHT22) | TELEMETRY `humidity` | `< 40%` → `humidifier` on/off |
| 06 | Soil moisture → pump (Raspberry Pi) | TELEMETRY `soil` | dry `< 300` → `pump` on/off |
| 07 | PIR motion → light (Raspberry Pi) | TELEMETRY `motion` | motion → light `V1` on |
| 08 | Device offline alert | DEVICE_OFFLINE | Builds alert msg → add Email/Slack/Telegram |
| 09 | Data logger (Raspberry Pi → Sheets) | TELEMETRY | Flattens readings → add Sheets/DB node |
| 10 | Scheduled daily summary | Cron 08:00 | GET telemetry → per-metric count/avg/min/max |

**To use a control flow:** open it in n8n → paste your API key into the HTTP
node(s) → **Activate** → copy the Webhook Production URL → in IoTFlow →
Automations, create the matching automation (event + metric filter) with that
URL. Add a **Button/Switch/Slider** widget bound to the same virtual pin to
control the device by hand from web or mobile.

---

# Step-by-step guides

## Part A — One-time setup (do this once)

1. **Sign in** to IoTFlow and pick (or create) a **Project** from the sidebar
   switcher. Everything below happens inside the selected project.
2. **Create an account API key** — sidebar → **API Keys** → *New key* → copy the
   `iot_…` value (shown once). n8n flows use this to call back and control
   devices. Keep it secret.
3. **Add a device** — sidebar → **Add Device** → follow the wizard (name →
   MQTT/HTTP → copy the token → flash the snippet). Note its **Device ID** (e.g.
   `wh-sensor-a`) and internal id from the URL on the device page
   (`/devices/<internalId>`).
4. **Decide your virtual pins** — pick a control key per actuator, e.g. `V1`
   (LED), `relay` (fan), `pump`, `buzzer`. Your device firmware must read these
   from `devices/<id>/down` (MQTT) or `GET /api/device/state` (HTTP). The wizard's
   **Control (downlink)** snippets show exactly how.
5. **Confirm n8n is connected** — sidebar → **Automations**. The top card should
   read *"n8n connected"*. If not, set `N8N_BASE_URL` + `N8N_API_KEY` in `.env`
   and restart.

## Part B — Set up a webhook (event-driven) flow

Worked example: **Flow 04 · Temperature → fan control**. The same 8 steps apply
to flows 03–09.

1. In **n8n**, open **IoTFlow 04 · Temperature → fan control (ESP32)**.
2. Click the **Fan ON** HTTP node → *Headers* → set `Authorization` to
   `Bearer iot_<your key>`. Repeat for the **Fan OFF** node. (Leave the URL — it
   is built automatically from the event: `{{ $json.body.api.base }}{{ $json.body.api.command }}`.)
3. *(Optional)* Adjust the **IF** node threshold (default `> 30`).
4. Click **Save**, then toggle the workflow **Active** (top-right).
5. Open the **Platform event** (Webhook) node and copy its **Production URL**
   (e.g. `https://n8n.tertiarytraining.com/webhook/iot-temp-fan`).
6. In **IoTFlow → Automations → New automation**:
   - **Name:** `Temp → fan`
   - **When this happens:** `Telemetry received`
   - **Device filter:** your ESP32 (or *Any device*)
   - **Metric filter:** `temperature`
   - **n8n Webhook URL:** paste the Production URL from step 5 → **Create**.
7. Click **Test** on the new automation card — a sample event is sent; the card
   should show **Last fired … · ok** and n8n shows a successful execution.
8. Send real data (`temperature > 30`) from the device. The flow fires and calls
   `POST /api/devices/:id/command` with `{"pin":"relay","value":1}` — your device
   turns the fan on. Add a **Switch** widget on `relay` to also toggle it by hand.

> **How the callback finds your device:** the event envelope carries
> `api.base` + `api.command` (which already includes the device's internal id),
> so webhook flows never hardcode a URL — you only ever set the API key.

## Part C — Set up a schedule flow (no incoming event)

Worked example: **Flow 01 · Blink LED**. Same idea for flow 02 and flow 10.

1. In **n8n**, open **IoTFlow 01 · Blink LED (Arduino)**.
2. Open the **Set LED (V1)** HTTP node and edit the **URL**: replace
   `YOUR-IOTFLOW-HOST` with your IoTFlow host and `YOUR_DEVICE_ID` with the
   device's **internal id** (from `/devices/<internalId>`).
3. Set the `Authorization` header to `Bearer iot_<your key>`.
4. *(Optional)* Change the blink rate in the **Every 2s** Schedule node.
5. **Save** → toggle **Active**. The LED on virtual pin `V1` now blinks. No
   IoTFlow automation is needed — schedule flows push commands on their own.

## Part D — Per-flow cheat sheet

For webhook flows: create an IoTFlow **Automation** with the listed **Event** +
**Metric**, pointing at the flow's webhook URL, and set the API key in the HTTP
node(s). For schedule flows: edit the HTTP URL (host + device id) + API key only.

| Flow | Trigger → set up as | Device SENDS (metric) | Device LISTENS on pin | Result |
|------|--------------------|-----------------------|-----------------------|--------|
| 01 Blink LED | Schedule (Part C) | — | `V1` | LED blinks |
| 02 Multi-LED chase | Schedule (Part C) | — | `V1`,`V2`,`V3` | LEDs chase |
| 03 Sonar alarm | Automation: TELEMETRY · `distance` | `distance` | `buzzer` | buzz if `<20cm` |
| 04 Temp → fan | Automation: TELEMETRY · `temperature` | `temperature` | `relay` | fan on if `>30°C` |
| 05 Humidity → humidifier | Automation: TELEMETRY · `humidity` | `humidity` | `humidifier` | on if `<40%` |
| 06 Soil → pump | Automation: TELEMETRY · `soil` | `soil` | `pump` | pump if `<300` |
| 07 Motion → light | Automation: TELEMETRY · `motion` | `motion` | `V1` | light on if motion |
| 08 Offline alert | Automation: DEVICE_OFFLINE | — | — | builds alert msg¹ |
| 09 Data logger | Automation: TELEMETRY (any) | any | — | flattens reading² |
| 10 Daily summary | Schedule (Part C, GET URL) | — | — | per-metric rollup |

¹ Add an Email / Slack / Telegram / WhatsApp node after *Build alert message*.
² Add a Google Sheets / Postgres / Airtable node after *Map reading*.

## Sample flow guides (01–10)

Each guide is self-contained. **Control flows** (01–07) only need your account
API key pasted into the HTTP node(s) — the callback URL is built from the event
(webhook flows) or edited once (schedule flows). Create the matching **Automation**
in IoTFlow (Automations → New automation) where indicated.

### 01 · Blink LED (Arduino) — schedule
- **Does:** flips virtual pin `V1` between 1 and 0 every 2s.
- **n8n:** open *IoTFlow 01* → **Set LED (V1)** HTTP node → set the URL host + `YOUR_DEVICE_ID` (internal id from `/devices/<id>`) and the `Authorization: Bearer iot_…` header → **Save** → **Activate**.
- **IoTFlow automation:** none (schedule flows push on their own).
- **Device:** subscribe to `devices/<id>/down`; on `{pin:"V1"}` set the LED to `value>0`.
- **Test:** watch the LED blink, or `GET /api/device/state` and see `V1` alternate.

### 02 · Multiple LEDs chase (Arduino) — schedule
- **Does:** every 1s lights one of three LEDs in turn (writes `V1`,`V2`,`V3`).
- **n8n:** open *IoTFlow 02* → **Set each LED** HTTP node → set URL host + device id + API key → **Activate**.
- **IoTFlow automation:** none.
- **Device:** drive 3 GPIOs from pins `V1`,`V2`,`V3` on `devices/<id>/down`.

### 03 · Sonar distance alarm (Arduino HC-SR04) — TELEMETRY `distance`
- **Does:** distance `< 20cm` → `buzzer=1`, else `buzzer=0`.
- **n8n:** open *IoTFlow 03* → set the API key header in **Sound buzzer** and **Silence buzzer** → **Activate** → copy the **Platform event** webhook Production URL.
- **IoTFlow automation:** event **Telemetry received**, metric `distance`, device = your board → paste the webhook URL.
- **Device:** publish `{"distance": <cm>}`; act on pin `buzzer`.
- **Test:** send `{"deviceId":"…","distance":10}` (see Part E) → buzzer command appears.

### 04 · Temperature → fan control (ESP32) — TELEMETRY `temperature`
- **Does:** temp `> 30°C` → `relay=1` (fan on), else `relay=0`.
- **n8n:** open *IoTFlow 04* → set API key in **Fan ON** / **Fan OFF** → adjust the IF threshold if needed → **Activate** → copy webhook URL.
- **IoTFlow automation:** **Telemetry received**, metric `temperature` → webhook URL.
- **Device:** publish `{"temperature": …}`; act on pin `relay`.

### 05 · Humidity → humidifier (ESP32/DHT22) — TELEMETRY `humidity`
- **Does:** humidity `< 40%` → `humidifier=1`, else `0`.
- **n8n:** open *IoTFlow 05* → set API key in both HTTP nodes → **Activate** → copy webhook URL.
- **IoTFlow automation:** **Telemetry received**, metric `humidity` → webhook URL.
- **Device:** publish `{"humidity": …}`; act on pin `humidifier`.

### 06 · Soil moisture → irrigation pump (Raspberry Pi) — TELEMETRY `soil`
- **Does:** raw soil reading `< 300` (dry) → `pump=1`, else `0`.
- **n8n:** open *IoTFlow 06* → set API key in **Pump ON** / **Pump OFF** → **Activate** → copy webhook URL.
- **IoTFlow automation:** **Telemetry received**, metric `soil` → webhook URL.
- **Device (Pi):** publish `{"soil": <adc>}`; drive the pump relay from pin `pump`.

### 07 · PIR motion → light (Raspberry Pi) — TELEMETRY `motion`
- **Does:** `motion ≥ 1` → light `V1=1`.
- **n8n:** open *IoTFlow 07* → set API key in **Light ON** → **Activate** → copy webhook URL. (Add an off-timer branch if you want auto-off.)
- **IoTFlow automation:** **Telemetry received**, metric `motion` → webhook URL.
- **Device (Pi):** publish `{"motion":1}` on the PIR edge; act on pin `V1`.

### 08 · Device offline alert — DEVICE_OFFLINE
- **Does:** builds an alert message when a device drops off; **add your channel** node (Email / Slack / Telegram / WhatsApp) after **Build alert message**.
- **n8n:** open *IoTFlow 08* → append + configure a notification node → **Activate** → copy webhook URL.
- **IoTFlow automation:** event **Device went offline** (device = *Any* or a specific one) → webhook URL.
- **Test:** stop sending telemetry past `DEVICE_OFFLINE_SECONDS`, or use the automation **Test** button.

### 09 · Data logger (Raspberry Pi → Sheets) — TELEMETRY
- **Does:** flattens each reading to `device, metric, value, ts`; **add a sink** (Google Sheets / Postgres / Airtable) after **Map reading**.
- **n8n:** open *IoTFlow 09* → add + connect your storage node → **Activate** → copy webhook URL.
- **IoTFlow automation:** **Telemetry received**, metric *blank* (all) → webhook URL.

### 10 · Scheduled daily summary — schedule (cron 08:00)
- **Does:** fetches recent telemetry and computes per-metric count/avg/min/max.
- **n8n:** open *IoTFlow 10* → **Fetch last 200 readings** HTTP node → set URL host + API key → optionally append an Email/Slack node after **Summarise** → **Activate**.
- **IoTFlow automation:** none (runs on its own schedule).

## Part E — Testing without hardware

- **Fire an event by hand** (triggers your webhook automations):
  ```bash
  curl -X POST https://YOUR-IOTFLOW-HOST/api/telemetry \
    -H "Authorization: Bearer iot_YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"deviceId":"wh-sensor-a","temperature":41.5}'
  ```
- **See a command a flow produced** (what a device would read):
  ```bash
  curl https://YOUR-IOTFLOW-HOST/api/device/state \
    -H "Authorization: Bearer dev_YOUR_DEVICE_TOKEN"
  # → {"state":{"relay":1}}
  ```
- **Watch executions** in n8n (left sidebar → *Executions*) to confirm each flow
  ran and inspect the data it received.
- Use the **Test** button on an IoTFlow automation card to send a sample envelope
  without any device.

## Troubleshooting

- *Automation card shows `error: HTTP 404`* — the n8n workflow isn't **Active**,
  or the webhook path/URL is wrong. Re-copy the Production URL.
- *Flow runs but device doesn't react* — check the HTTP node's `Authorization`
  header (must be a valid `iot_` key) and that the device subscribes to
  `devices/<id>/down` / polls `/api/device/state` on the **same pin name**.
- *`n8n not configured` on the Automations page* — set `N8N_BASE_URL` +
  `N8N_API_KEY` in `.env` and restart the app.
