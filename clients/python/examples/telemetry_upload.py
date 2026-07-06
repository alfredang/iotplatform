"""
IoTFlow — telemetry upload over MQTT, every 10 seconds.

Python port of the Arduino example ESP8266_Telemetry_Upload.ino: connects to
the Mosquitto broker and publishes
    {"token": "...", "temperature": 28.5, "humidity": 65, "voltage": 3.7}
to devices/<DEVICE_ID>/telemetry every 10 seconds.

Runs on Raspberry Pi, PC, Mac — any device with Python.

    pip install "iotflow[mqtt]"
    python telemetry_upload.py
"""
import random
import time

from iotflow import IoTFlow

# ---- MQTT broker ----
# Use the broker machine's LAN IP (not "localhost" unless the broker runs on
# this same device). Find it with `ipconfig` / `ifconfig`.
MQTT_BROKER = "192.168.1.50"
MQTT_PORT = 1883

# ---- Device identity (from the "Add Device" wizard in IoTFlow) ----
DEVICE_ID = "test-device"
DEVICE_TOKEN = "dev_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

PUBLISH_INTERVAL_S = 10

iot = IoTFlow(
    token=DEVICE_TOKEN,
    device_id=DEVICE_ID,
    mqtt_host=MQTT_BROKER,
    mqtt_port=MQTT_PORT,
)
iot.connect()  # MQTT connection runs in the background
print(f"Connected to MQTT broker {MQTT_BROKER}:{MQTT_PORT}")

while True:
    # TODO: replace with real sensor readings (DHT22, BME280, ADC, ...)
    temperature = round(28.5 + random.uniform(-1.0, 1.0), 1)
    humidity = round(65 + random.uniform(-5.0, 5.0), 1)
    voltage = 3.7

    iot.mqtt_publish(temperature=temperature, humidity=humidity, voltage=voltage)
    print(f"Published: temperature={temperature} humidity={humidity} voltage={voltage}")
    time.sleep(PUBLISH_INTERVAL_S)
