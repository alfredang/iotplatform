# IoTFlow — Python client (`iotflow.py`)

A single-file client for the IoTFlow platform. **Zero install for HTTP** — it
uses only the Python standard library, so just drop `iotflow.py` next to your
script (great for Raspberry Pi).

## Get it

```bash
curl -O https://raw.githubusercontent.com/alfredang/iotplatform/main/clients/python/iotflow.py
```

## Report readings (HTTP — out of the box)

```python
from iotflow import IoTFlow

iot = IoTFlow("https://iot.tertiaryinfotech.com", "dev_XXXX", "rpi-weather")
iot.send(temperature=22.5, humidity=60)     # several metrics at once
iot.virtual_write("temperature", 22.5)      # or one at a time
```

## React to control commands

Poll over HTTP (no extra deps):

```python
@iot.on_command
def handle(pin, value, text):
    if pin == "pump":
        print("pump ->", value)             # drive a GPIO here

iot.run(interval=3)                         # blocks, polls every 3s
```

Real-time over MQTT (optional — `pip install paho-mqtt`):

```python
iot = IoTFlow(token="dev_XXXX", device_id="rpi-room",
              mqtt_host="broker.host", mqtt_port=1883)

@iot.on_command
def handle(pin, value, text): ...

iot.loop_forever()
```

`pin` names match your dashboard widgets: report to a metric name
(`temperature`) for Number/Gauge/Line widgets; receive on a control pin
(`V1`, `relay`, `pump`) set by Button/Switch/Slider widgets or n8n flows.
