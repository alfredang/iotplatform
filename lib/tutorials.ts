import { UserPlus, Cpu, Radio, Gauge, SlidersHorizontal, Workflow, UploadCloud, KeyRound, type LucideIcon } from "lucide-react";

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
  /** Optional walkthrough video shown above the steps. */
  video?: { src: string; poster?: string; title: string };
  steps: TutStep[];
};

export const TUTORIALS: Tutorial[] = [
  {
    slug: "create-your-account",
    num: 1,
    icon: UserPlus,
    title: "Create your free account",
    time: "2 min",
    summary:
      "Sign up with just your name and email, sign in with an emailed code, a password or Google, and everything is unlocked — devices, dashboards, API keys, alerts and automations.",
    steps: [
      {
        title: "Sign up — it’s free",
        body: "Open Create an account (Sign up on the home page) and enter your name and email. That’s all — no password to invent and no credit card. Prefer Google? Click Continue with Google instead and you’re in straight away.",
        image: "/tutorials/t1-register.png",
        caption: "Sign-up needs only a name and an email.",
      },
      {
        title: "Check your inbox",
        body: "We email you a welcome message, “Welcome to IoTFlow — your sign-in details”, with a default password. It usually arrives within a minute — check your spam folder if it doesn’t.",
        image: "/tutorials/t1-check-inbox.png",
        caption: "Sign in with the emailed password, or with a one-time code.",
      },
      {
        title: "Sign in — three ways",
        body: "On the sign-in page choose what suits you: Email code (the default) emails you a 6-digit code — no password needed; Password uses the default password from your welcome email; or Continue with Google.",
        image: "/tutorials/t1-sign-in.png",
        caption: "Email code, password or Google.",
      },
      {
        title: "Set your own password",
        body: "Right after your first sign-in you’re asked to choose your own password (at least 8 characters) — the emailed one stops working. You’ll use it in the IoTFlow mobile app too.",
        image: "/tutorials/t1-set-password.png",
        caption: "One-time step: replace the default password.",
      },
      {
        title: "You’re in — everything is unlocked",
        body: "Your first project, “My Project”, is ready on the dashboard. Every account can add devices, build dashboards, control devices, and create API keys, alert rules and n8n automations — nothing to request from an administrator. The Free plan covers 5 devices and 10,000 messages a day; see Plan & billing (or the Pricing page) if you need more. Next: add your first device.",
      },
    ],
  },
  {
    slug: "add-your-first-device",
    num: 2,
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
    num: 3,
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
    num: 4,
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
    num: 5,
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
    num: 6,
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
      {
        title: "Let the flow control devices back",
        body: "To have n8n switch a relay or reply to a device, create an API key first (API Keys → Create API key — see Tutorial 8). IoTFlow puts your latest key in every event it sends as apiKey, so the flow can call POST /api/devices/<id>/command with it — no key to paste into n8n by hand.",
      },
    ],
  },
  {
    slug: "esp8266-telemetry-upload",
    num: 7,
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
        body: "Run the Add Device wizard (see Tutorial 2) and choose MQTT. Note the device id and the dev_… token — the token rides inside every telemetry message to authenticate it.",
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
        body: "Open the Dashboard — a new reading lands under Latest Telemetry every 10 seconds. Bind Number, Gauge or Line-chart widgets to the temperature, humidity and voltage metrics (see Tutorial 4) and you have a live sensor feed.",
      },
    ],
  },
  {
    slug: "api-keys-and-alerts",
    num: 8,
    icon: KeyRound,
    title: "Create an API key and set up alerts",
    time: "6 min",
    summary:
      "Create an account-level API key, send telemetry with it, and get an alert the moment a reading crosses a threshold — plus how to get the mobile app.",
    video: {
      src: "/tutorials/t7-api-keys-alerts.mp4",
      poster: "/tutorials/t7-video-poster.jpg",
      title: "Walkthrough: create an API key, send data, create and trigger an alert rule",
    },
    steps: [
      {
        title: "Do you need an API key at all?",
        body: "To connect a board you don’t need one: every device has its own device token (dev_…), shown when you create it — that’s all one board needs. An API key (iot_…) is one key for all your devices, and any account can create one. Use it for (1) a gateway or script that reports for several devices — include the device’s Device ID in every message; (2) sending commands to your devices from your own code; and (3) n8n automations that control devices back (Tutorial 6), which use your key automatically.",
      },
      {
        title: "Create the API key",
        body: "In the sidebar, open API Keys and click Create API key (top right). Give it a name you’ll recognise later, e.g. “Classroom sensors”, and click Create.",
        image: "/tutorials/t7-create-api-key.jpg",
        caption: "Naming a new API key.",
      },
      {
        title: "Copy it now — it is shown only once",
        body: "Click Copy and store the key somewhere safe (a password manager or your script’s config). Only its prefix is kept, so if you lose it, revoke it with the bin icon and create a new one. Anything using a revoked key stops sending immediately.",
        image: "/tutorials/t7-copy-api-key.jpg",
        caption: "The full key appears once, right after you create it.",
      },
      {
        title: "Send telemetry with the key",
        body: "POST to /api/telemetry with the key as a Bearer token. Put the device’s Device ID (shown on its device page) and your readings in the JSON body. A 201 response means it was stored; every number becomes its own metric.",
        code: `curl -X POST https://YOUR-HOST/api/telemetry \\
  -H "Authorization: Bearer iot_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId": "YOUR_DEVICE_ID", "temperature": 27.4, "humidity": 63}'

# Python
import requests
requests.post("https://YOUR-HOST/api/telemetry",
    headers={"Authorization": "Bearer iot_YOUR_API_KEY"},
    json={"deviceId": "YOUR_DEVICE_ID", "temperature": 27.4, "humidity": 63})`,
      },
      {
        title: "Create an alert rule",
        body: "Open Alerts → Create rule. Name it, pick the device, choose a condition (greater than, less than, ≥, ≤, equals, or device offline), then the metric and threshold — e.g. temperature > 30. The metric list is built from data the device has already sent, so send one reading first. The Alerts page only lists devices in the current project.",
        image: "/tutorials/t7-create-alert-rule.jpg",
        caption: "A rule that fires when temperature goes above 30.",
      },
      {
        title: "Trigger it, then resolve it",
        body: "Send a reading above the threshold (e.g. temperature 34.5). Within seconds the alert appears under Active alerts and in the mobile app. Click Resolve once it’s handled; while an alert is active the same rule won’t raise duplicates. To forward alerts to Telegram, Slack, email or a sheet, add an Automation with the Alert trigger (Tutorial 6).",
        image: "/tutorials/t7-active-alert.jpg",
        caption: "The triggered alert, ready to resolve.",
      },
      {
        title: "Get the mobile app",
        body: "iPhone / iPad: search “IoTFlow” on the App Store (apps.apple.com/us/app/iotflow/id6781005693). Android is in closed testing — contact us with your Gmail to join as a tester. Sign in with the same email and the password you set after your first sign-in; if you signed up with Google, set a password first via Forgot password. Dashboards, controls, devices and alerts are all there.",
      },
    ],
  },
];

export function getTutorial(slug: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}

export const TUTORIAL_SLUGS = TUTORIALS.map((t) => t.slug);
