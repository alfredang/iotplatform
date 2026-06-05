# Connecting a Device

This guide walks through getting telemetry from a physical (or simulated) device
into IoTFlow. The fastest path is the in-app **Add Device** wizard, which
generates code with your token already filled in.

## 1. Create the device

Dashboard → **Add Device** → enter a name → choose **HTTP** or **MQTT**. The
wizard creates the device and shows a **device token** (`dev_...`) **once** — copy
it now.

## 2. Send data

### Option A — HTTP

```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Authorization: Bearer dev_your_token" \
  -H "Content-Type: application/json" \
  -d '{"temperature": 28.5, "humidity": 65}'
```

Any JSON object works. Numeric fields become charted metrics. Booleans are stored
as 1/0. GPS is recognised from `lat`/`lng`, `latitude`/`longitude`, or a nested
`gps`/`location` object, and updates the device's position on the **Maps** page.

### Option B — MQTT

Publish to `devices/<deviceId>/telemetry`, including the token in the payload:

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "devices/your-device-id/telemetry" \
  -m '{"token":"dev_your_token","temperature":28.5,"humidity":65}'
```

## 3. Watch it live

The wizard's final steps poll for the first message and then show a live chart.
Afterwards your device appears on the dashboard, telemetry page and (if it sends
GPS) the map. Data refreshes every 5 seconds.

## API keys vs device tokens

- **Device token** (`dev_...`) — identifies a single device. Best for firmware.
- **Account API key** (`iot_...`) — created under **API Keys**. Works for any of
  your devices; include the public `"deviceId"` in the JSON body.

## Common metrics

`temperature` (°C), `humidity` (%), `voltage` (V), `current` (A), `pressure`
(hPa), `battery` (%). Units are inferred from the metric name for display.

## Example: ESP32 (HTTP)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* endpoint = "http://YOUR_HOST:3000/api/telemetry";
const char* token    = "dev_your_token";

void postReading(float t, float h) {
  HTTPClient http;
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + token);
  http.POST("{\"temperature\":" + String(t) + ",\"humidity\":" + String(h) + "}");
  http.end();
}
```

## Alerts

Go to **Alerts → Create rule** to be notified when a metric crosses a threshold
(e.g. `temperature > 40`) or when a device goes offline for N seconds. Active
alerts show on the dashboard and can be resolved with one click.
