# IoTFlow — Python client

Connect any device that runs Python (Raspberry Pi, PC, Mac, Linux SBCs) to the
IoTFlow platform. For microcontrollers (Arduino, ESP8266, ESP32) use the
[Arduino library](../arduino/IoTFlow/) — both speak the same protocol.

## Install

```bash
pip install iotflow            # HTTP only (zero dependencies)
pip install "iotflow[mqtt]"    # + real-time MQTT (paho-mqtt)
```

Or straight from GitHub:

```bash
pip install "iotflow[mqtt] @ git+https://github.com/alfredang/iotplatform.git#subdirectory=clients/python"
```

Or zero-install — HTTP mode uses only the standard library, so you can just
drop the file next to your script:

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

## Report readings (MQTT — every 10 s)

The Python equivalent of the Arduino `ESP8266_Telemetry_Upload` example —
see [examples/telemetry_upload.py](examples/telemetry_upload.py):

```python
import time
from iotflow import IoTFlow

iot = IoTFlow(token="dev_XXXX", device_id="test-device",
              mqtt_host="192.168.1.50", mqtt_port=1883)
iot.connect()                               # MQTT runs in the background

while True:
    iot.mqtt_publish(temperature=28.5, humidity=65, voltage=3.7)
    time.sleep(10)
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

Real-time over MQTT:

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

## Publish to PyPI (maintainers)

```bash
cd clients/python
python -m build
twine upload dist/*
```
