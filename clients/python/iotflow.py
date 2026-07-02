"""
IoTFlow — single-file Python client for the IoTFlow IoT platform.

Zero-install: just drop this file next to your script (Raspberry Pi, PC, etc.).
HTTP mode uses only the Python standard library — no pip install needed.
MQTT mode is optional and only requires `paho-mqtt` if you use it.

Quick start (HTTP — works out of the box):

    from iotflow import IoTFlow
    iot = IoTFlow("https://iot.tertiaryinfotech.com", "dev_XXXX", "rpi-weather")
    iot.virtual_write("temperature", 22.5)          # report a reading
    iot.send(temperature=22.5, humidity=60)         # report several at once
    print(iot.state())                              # {"pump": 1, ...} control pins

Poll for control commands (HTTP) and react:

    @iot.on_command
    def handle(pin, value, text):
        if pin == "pump":
            print("pump ->", value)                 # drive a GPIO here
    iot.run(interval=3)                             # blocks, polling every 3s

Real-time control over MQTT (optional, needs `pip install paho-mqtt`):

    iot = IoTFlow(token="dev_XXXX", device_id="rpi-room",
                  mqtt_host="broker.host", mqtt_port=1883)
    @iot.on_command
    def handle(pin, value, text): ...
    iot.loop_forever()
"""
from __future__ import annotations

import json
import time
import urllib.request
import urllib.error
from typing import Callable, Dict, Optional

CommandHandler = Callable[[str, float, Optional[str]], None]


class IoTFlow:
    def __init__(
        self,
        server: str = "https://iot.tertiaryinfotech.com",
        token: str = "",
        device_id: str = "",
        *,
        mqtt_host: Optional[str] = None,
        mqtt_port: int = 1883,
        mqtt_username: Optional[str] = None,
        mqtt_password: Optional[str] = None,
    ) -> None:
        self.server = server.rstrip("/")
        self.token = token
        self.device_id = device_id
        self._handler: Optional[CommandHandler] = None
        self._seen: Dict[str, float] = {}
        # MQTT is optional
        self.mqtt_host = mqtt_host
        self.mqtt_port = mqtt_port
        self.mqtt_username = mqtt_username
        self.mqtt_password = mqtt_password
        self._mqtt = None

    # ---- command handler registration (decorator or call) ----
    def on_command(self, fn: CommandHandler) -> CommandHandler:
        self._handler = fn
        return fn

    # ---- uplink (HTTP) ----
    def send(self, **readings) -> bool:
        """Report one or more metric readings, e.g. send(temperature=22.5)."""
        return self._post("/api/telemetry", {"deviceId": self.device_id, **readings})

    def virtual_write(self, pin: str, value) -> bool:
        """Report a single reading under `pin` (a metric / virtual-pin name)."""
        return self.send(**{pin: value})

    # ---- downlink (HTTP) ----
    def state(self) -> Dict[str, object]:
        """Current virtual-pin states set from the dashboard / n8n."""
        data = self._get("/api/device/state")
        return (data or {}).get("state", {}) if isinstance(data, dict) else {}

    def run(self, interval: float = 3.0) -> None:
        """Poll pin state over HTTP and invoke the command handler on changes."""
        while True:
            for pin, value in self.state().items():
                if self._seen.get(pin) != value:
                    self._seen[pin] = value
                    self._dispatch(pin, value)
            time.sleep(interval)

    # ---- real-time (MQTT, optional) ----
    def loop_forever(self) -> None:
        """Connect over MQTT: publish telemetry + receive commands in real time."""
        try:
            import paho.mqtt.client as mqtt  # type: ignore
        except ImportError as e:  # pragma: no cover
            raise RuntimeError("MQTT mode needs paho-mqtt: pip install paho-mqtt") from e
        if not self.mqtt_host:
            raise RuntimeError("Set mqtt_host=... to use MQTT mode")

        up = f"devices/{self.device_id}/telemetry"
        down = f"devices/{self.device_id}/down"

        def on_connect(client, *_):
            client.subscribe(down)

        def on_message(client, _u, msg):
            try:
                cmd = json.loads(msg.payload.decode())
                self._dispatch(cmd.get("pin", ""), cmd.get("value"), cmd.get("strValue"))
            except Exception:
                pass

        client = mqtt.Client()
        if self.mqtt_username:
            client.username_pw_set(self.mqtt_username, self.mqtt_password)
        client.on_connect = on_connect
        client.on_message = on_message
        client.connect(self.mqtt_host, self.mqtt_port, 60)
        self._mqtt = (client, up)
        client.loop_forever()

    def mqtt_publish(self, **readings) -> None:
        """Publish a reading over MQTT (call after loop_start / inside handlers)."""
        if not self._mqtt:
            raise RuntimeError("MQTT not connected; call loop_forever() first")
        client, up = self._mqtt
        client.publish(up, json.dumps({"token": self.token, **readings}))

    # ---- internals ----
    def _dispatch(self, pin: str, value, text: Optional[str] = None) -> None:
        if not self._handler or not pin:
            return
        try:
            num = float(value) if value is not None else 0.0
        except (TypeError, ValueError):
            num = 0.0
        self._handler(pin, num, text)

    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    def _post(self, path: str, body: dict) -> bool:
        req = urllib.request.Request(
            self.server + path, data=json.dumps(body).encode(),
            headers=self._headers(), method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return 200 <= r.status < 300
        except urllib.error.URLError:
            return False

    def _get(self, path: str):
        req = urllib.request.Request(self.server + path, headers=self._headers(), method="GET")
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return json.loads(r.read().decode())
        except urllib.error.URLError:
            return None


if __name__ == "__main__":
    # Tiny demo: report a value, then print current control-pin state.
    import os
    iot = IoTFlow(
        os.environ.get("IOTFLOW_SERVER", "https://iot.tertiaryinfotech.com"),
        os.environ.get("IOTFLOW_TOKEN", "dev_XXXX"),
        os.environ.get("IOTFLOW_DEVICE", "rpi-weather"),
    )
    print("send:", iot.send(temperature=22.5, humidity=60))
    print("state:", iot.state())
