import { Cpu, Radio, Gauge, SlidersHorizontal, Workflow, UploadCloud, type LucideIcon } from "lucide-react";

export type TutStep = {
  title: string;
  body: string;
  image?: string;
  caption?: string;
  code?: string;
};

export type Tutorial = {
  slug: string;
  num: number;
  icon: LucideIcon;
  title: string;
  time: string;
  summary: string;
  steps: TutStep[];
};

export const TUTORIALS: Tutorial[] = [
  {
    slug: "add-your-first-device",
    num: 1,
    icon: Cpu,
    title: "Add your first device",
    time: "2 min",
    summary: "Register a device and get the token it uses to talk to the platform.",
    steps: [
      {
        title: "Pick or create a project",
        body: "Every device lives in a project — a self-contained workspace with its own dashboard, alerts, map and automations. Use the project switcher at the top of the sidebar to pick one, or create a new project first.",
      },
      {
        title: "Open the Add Device wizard",
        body: "Click Add Device in the sidebar and give your device a friendly name (e.g. “Living Room Sensor”). The 6-step wizard walks you through the rest.",
        image: "/tutorials/t1-add-device.png",
        caption: "The guided Add Device wizard.",
      },
      {
        title: "Choose a protocol",
        body: "Pick HTTP (simplest — POST JSON to a REST endpoint) or MQTT (lightweight pub/sub, ideal for many devices and real-time control). You can change this later; both are always available.",
      },
      {
        title: "Copy the device token",
        body: "When the device is created you get a device token (starts with dev_). Copy it now — it is shown only once. Your device sends this token to authenticate every message.",
        code: `Authorization: Bearer dev_XXXXXXXXXXXX`,
      },
    ],
  },
  {
    slug: "send-your-first-reading",
    num: 2,
    icon: Radio,
    title: "Send your first reading",
    time: "5 min",
    summary: "Push a sensor value from an ESP32, Arduino or Raspberry Pi — or from any terminal — and watch it appear live.",
    steps: [
      {
        title: "Open the Integrate guide",
        body: "Inside the app, the Integrate page gives you copy-paste snippets with your endpoint already filled in — cURL, Python and ESP32.",
        image: "/tutorials/t2-integrate.png",
        caption: "Copy-paste quickstart snippets on the Integrate page.",
      },
      {
        title: "Send over HTTP (works from anything)",
        body: "The simplest test: POST a JSON body with your device token. Run this from any terminal.",
        code: `curl -X POST https://YOUR-HOST/api/telemetry \\
  -H "Authorization: Bearer dev_YOUR_DEVICE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"temperature": 22.5, "humidity": 60}'`,
      },
      {
        title: "Or use the Python package (Raspberry Pi / PC)",
        body: "Install the iotflow package from PyPI and send readings in two lines. HTTP mode has zero dependencies — you can also just download iotflow.py next to your script instead of installing.",
        code: `# pip install iotflow
from iotflow import IoTFlow
iot = IoTFlow("https://YOUR-HOST", "dev_YOUR_DEVICE_TOKEN", "your-device-id")
iot.send(temperature=22.5, humidity=60)`,
      },
      {
        title: "Or Python over MQTT — publish every 10 seconds",
        body: "The Python twin of the ESP8266 telemetry-upload sketch: connect once in the background, then publish readings on a loop. Install with the mqtt extra.",
        code: `# pip install "iotflow[mqtt]"
import time
from iotflow import IoTFlow

iot = IoTFlow(token="dev_YOUR_DEVICE_TOKEN", device_id="your-device-id",
              mqtt_host="BROKER_HOST", mqtt_port=1883)
iot.connect()                          # MQTT runs in the background

while True:
    iot.mqtt_publish(temperature=28.5, humidity=65, voltage=3.7)
    time.sleep(10)`,
      },
      {
        title: "Or ESP32 / ESP8266 over MQTT",
        body: "With the optional IoTFlow Arduino library, report readings with virtualWrite() — bind a widget to the metric name (e.g. temperature).",
        code: `iot.setServer("BROKER_HOST", 1883);
iot.setDevice("your-device-id", "dev_YOUR_DEVICE_TOKEN");
iot.begin();
iot.virtualWrite("temperature", 22.5);`,
      },
      {
        title: "Watch it arrive",
        body: "Open the Dashboard. Your reading shows up under Latest Telemetry within seconds — the whole dashboard auto-refreshes every 5 seconds.",
      },
    ],
  },
  {
    slug: "build-a-dashboard",
    num: 3,
    icon: Gauge,
    title: "Build a dashboard",
    time: "3 min",
    summary: "Turn raw readings into number cards, gauges, charts, LEDs and maps.",
    steps: [
      {
        title: "Click “Add widget”",
        body: "On the Dashboard, click Add widget. Widgets are grouped into Display (show data) and Control (send commands).",
        image: "/tutorials/t3-add-widget.png",
        caption: "Choosing a widget type — Display and Control groups.",
      },
      {
        title: "Choose a display type",
        body: "Pick a Number card, Gauge, Line/Bar chart, LED indicator, Device status, Alert list or Map — whatever suits the reading.",
      },
      {
        title: "Bind a device and metric",
        body: "Select the device and the metric to show (e.g. temperature). For gauges you can set a min and max. Give the widget a title and add it.",
      },
      {
        title: "Arrange your dashboard",
        body: "Add as many widgets as you like — they tile into a responsive grid and refresh automatically. Remove one with the trash icon on its card.",
        image: "/tutorials/t3-dashboard.png",
        caption: "A live dashboard with number, gauge, chart, status, alerts and map widgets.",
      },
    ],
  },
  {
    slug: "control-a-device",
    num: 4,
    icon: SlidersHorizontal,
    title: "Control a device",
    time: "5 min",
    summary: "Flip a relay or LED, or set a value, straight from the dashboard using Blynk-style virtual pins.",
    steps: [
      {
        title: "Add a control widget",
        body: "On the Dashboard → Add widget, choose a Control type: Button (momentary), Switch (toggle), Slider (value) or Terminal (text).",
        image: "/tutorials/t3-add-widget.png",
        caption: "Control widgets live in the same Add widget dialog.",
      },
      {
        title: "Choose a virtual pin",
        body: "Give the control a virtual pin name — e.g. V1, relay or pump. This is the key your device listens on. For a slider, set the min and max.",
      },
      {
        title: "Make your device react",
        body: "Your device receives commands on MQTT topic devices/<id>/down, or HTTP-only devices poll GET /api/device/state. Act on the {pin, value} message — the equivalent of Blynk’s BLYNK_WRITE.",
        code: `void onCommand(const String& pin, float value, const String& text) {
  if (pin == "V1") digitalWrite(RELAY_PIN, value > 0 ? HIGH : LOW);
}`,
      },
      {
        title: "Python devices react the same way",
        body: "With the iotflow package, register a command handler and run — over MQTT it fires in real time; over plain HTTP, iot.run() polls for you.",
        code: `# pip install "iotflow[mqtt]"
from iotflow import IoTFlow

iot = IoTFlow(token="dev_YOUR_DEVICE_TOKEN", device_id="your-device-id",
              mqtt_host="BROKER_HOST", mqtt_port=1883)

@iot.on_command
def handle(pin, value, text):
    if pin == "relay":
        print("relay ->", value)   # drive a GPIO here

iot.loop_forever()`,
      },
      {
        title: "Toggle from the dashboard",
        body: "Flip the Switch or drag the Slider — the command is persisted and delivered to your device instantly (and it also fires a COMMAND automation you can hook into n8n).",
        image: "/tutorials/t4-control.png",
        caption: "Switch and Slider control widgets on a live dashboard.",
      },
    ],
  },
  {
    slug: "automate-with-n8n",
    num: 5,
    icon: Workflow,
    title: "Automate with n8n",
    time: "8 min",
    summary: "Run no-code logic when a device event happens — notify, control devices back, log data or call AI.",
    steps: [
      {
        title: "Create a webhook in n8n",
        body: "In your n8n instance, add a Webhook node to a workflow, activate it, and copy its Production URL. This is where IoTFlow will send matching events.",
      },
      {
        title: "Create an automation",
        body: "In IoTFlow → Automations → New automation. Give it a name and choose the event that should fire it (Telemetry received, Alert, Device online/offline, or Command).",
        image: "/tutorials/t5-new-automation.png",
        caption: "Linking a device event to an n8n webhook.",
      },
      {
        title: "Filter and paste the webhook URL",
        body: "Optionally filter by device and metric (e.g. only temperature), then paste the n8n webhook Production URL and save. IoTFlow will POST a normalized event envelope to it.",
      },
      {
        title: "Test it, then go live",
        body: "Click Test on the automation card to send a sample event — you’ll see the delivery status and n8n will run the flow. After that, real device events trigger it automatically. n8n flows can call back to control devices, notify Slack/Email/WhatsApp, log to Sheets, or run AI.",
        image: "/tutorials/t5-automations.png",
        caption: "The Automations page with live n8n connection and delivery status.",
      },
    ],
  },
  {
    slug: "esp8266-telemetry-upload",
    num: 6,
    icon: UploadCloud,
    title: "Upload telemetry every 10 seconds (ESP8266 & Python)",
    time: "10 min",
    summary:
      "Publish temperature, humidity and voltage to the platform over MQTT on a fixed interval — from an ESP8266 sketch or the same loop in Python.",
    steps: [
      {
        title: "What you'll build",
        body: "A device that connects to WiFi and your MQTT broker, then publishes a JSON reading to devices/<id>/telemetry every 10 seconds. This mirrors the ESP8266_Telemetry_Upload example that ships with the Arduino library — and the identical loop with the iotflow Python package.",
        code: `{"token":"dev_…","temperature":28.5,"humidity":65,"voltage":3.7}
→ published to  devices/<DEVICE_ID>/telemetry  every 10 s`,
      },
      {
        title: "Create the device and copy its token",
        body: "Run the Add Device wizard (see Tutorial 1) and choose MQTT. Note the device id and the dev_… token — the token rides inside every telemetry message to authenticate it.",
      },
      {
        title: "Find your broker address",
        body: "Use the LAN IP of the machine running the Mosquitto broker — not “localhost”, because the ESP8266 is a separate device on your network. Find it with ipconfig (Windows) or ifconfig (macOS/Linux). Port is 1883 by default.",
      },
      {
        title: "ESP8266 — flash the sketch",
        body: "Install the PubSubClient library (Library Manager), fill in your WiFi, broker IP, device id and token, and flash. The full sketch is clients/arduino/IoTFlow/examples/ESP8266_Telemetry_Upload on GitHub; this is the heart of it.",
        code: `const char* MQTT_BROKER  = "192.168.1.50";   // your broker's LAN IP
const char* DEVICE_ID    = "your-device-id";
const char* DEVICE_TOKEN = "dev_YOUR_DEVICE_TOKEN";

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  if (millis() - lastPublish >= 10000) {
    lastPublish = millis();
    // TODO: replace with real sensor readings
    publishTelemetry(28.5, 65, 3.7);   // temperature, humidity, voltage
  }
}`,
      },
      {
        title: "Raspberry Pi / PC — the same thing in Python",
        body: "No ESP8266 handy? The iotflow package does the identical job on anything that runs Python. Install it, fill in the same broker/id/token, and run.",
        code: `# pip install "iotflow[mqtt]"
import time
from iotflow import IoTFlow

iot = IoTFlow(token="dev_YOUR_DEVICE_TOKEN", device_id="your-device-id",
              mqtt_host="192.168.1.50", mqtt_port=1883)
iot.connect()                          # MQTT runs in the background

while True:
    # TODO: replace with real sensor readings
    iot.mqtt_publish(temperature=28.5, humidity=65, voltage=3.7)
    time.sleep(10)`,
      },
      {
        title: "Watch it arrive, then visualise it",
        body: "Open the Dashboard — a new reading lands under Latest Telemetry every 10 seconds. Bind Number, Gauge or Line-chart widgets to the temperature, humidity and voltage metrics (see Tutorial 3) and you have a live sensor feed.",
      },
    ],
  },
];

export function getTutorial(slug: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}

export const TUTORIAL_SLUGS = TUTORIALS.map((t) => t.slug);
