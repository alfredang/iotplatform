# IoTFlow device clients

Connect any Arduino / ESP32 / ESP8266 / Raspberry Pi to IoTFlow. Everything works
over open **HTTP** and **MQTT** — no account-side setup beyond creating a device
and copying its token.

## The out-of-the-box path (no install)

The in-app **Add Device wizard** (and the **Integrate** page) generate a
complete, ready-to-run snippet with your token already filled in — paste and go.
That is the recommended path for most users; the libraries below are optional
conveniences that give a cleaner `virtualWrite()` / command-callback API.

## Optional libraries

### Arduino / ESP32 / ESP8266 — [`clients/arduino/IoTFlow`](arduino/IoTFlow)
Download: <https://github.com/alfredang/iotplatform/tree/main/clients/arduino/IoTFlow>
Install: Arduino IDE → *Sketch → Include Library → Add .ZIP Library…* (also
install **PubSubClient**). Or copy `src/IoTFlow.h` + `src/IoTFlow.cpp` next to
your sketch. See its [README](arduino/IoTFlow/README.md).

### Python / Raspberry Pi — [`clients/python/iotflow.py`](python/iotflow.py)
**Zero install:** download the single file and drop it next to your script —
HTTP mode uses only the Python standard library.
```bash
curl -O https://raw.githubusercontent.com/alfredang/iotplatform/main/clients/python/iotflow.py
```
```python
from iotflow import IoTFlow
iot = IoTFlow("https://iot.tertiaryinfotech.com", "dev_XXXX", "rpi-weather")
iot.send(temperature=22.5, humidity=60)
```
Real-time control over MQTT is optional (`pip install paho-mqtt`). See the
[Python README](python/README.md).

## Conventions (what the libraries wrap)

| Direction | HTTP | MQTT |
|---|---|---|
| Uplink (telemetry) | `POST /api/telemetry` (`Authorization: Bearer dev_…`) | publish `devices/<id>/telemetry` |
| Downlink (control) | `GET /api/device/state` (poll) | subscribe `devices/<id>/down` |

Uplink body: `{"deviceId":"…","temperature":22.5}` (HTTP) or
`{"token":"dev_…","temperature":22.5}` (MQTT). Downlink message:
`{"pin":"V1","value":1}`.
