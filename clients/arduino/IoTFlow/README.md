# IoTFlow — Arduino / ESP32 / ESP8266 library

A thin, Blynk-style wrapper over PubSubClient for the IoTFlow platform.
Report readings with `virtualWrite()` and react to dashboard/n8n commands with a
callback. No JSON library required.

> **Prefer zero install?** The platform's **Add Device wizard** generates a
> complete, ready-to-upload sketch with your token already filled in — no
> library needed. Use this library only if you want the cleaner API below.

## Install (one time)

**Option A — Arduino IDE (ZIP):** download this folder as a ZIP, then
*Sketch → Include Library → Add .ZIP Library…* and select it. Also install
**PubSubClient** from *Tools → Manage Libraries* (search "PubSubClient").

**Option B — copy the two files:** drop `src/IoTFlow.h` and `src/IoTFlow.cpp`
next to your sketch. Install PubSubClient as above.

Download: <https://github.com/alfredang/iotplatform/tree/main/clients/arduino/IoTFlow>

## Use

```cpp
#include <WiFi.h>            // ESP8266: #include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <IoTFlow.h>

WiFiClient net;
IoTFlow iot(net);

void onCommand(const String& pin, float value, const String& text) {
  if (pin == "V1") digitalWrite(LED_BUILTIN, value > 0 ? HIGH : LOW);   // control
}

void setup() {
  WiFi.begin("SSID", "PASS");
  while (WiFi.status() != WL_CONNECTED) delay(300);
  iot.setServer("BROKER_HOST", 1883);
  iot.setDevice("my-device-id", "dev_XXXX");   // from the platform
  iot.onCommand(onCommand);
  iot.begin();
}

void loop() {
  iot.loop();                          // keep connected + receive commands
  iot.virtualWrite("temperature", 22.5);
  delay(5000);
}
```

- `virtualWrite(pin, value)` → publishes a reading; bind a Number/Gauge/Line
  widget to that pin name (e.g. `temperature`).
- `onCommand(cb)` → fires when a dashboard Button/Switch/Slider or an n8n flow
  writes a virtual pin (e.g. `V1`, `relay`).

See `examples/ESP32_Blink` (control) and `examples/DHT_Telemetry` (uplink).
