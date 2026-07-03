import { Cpu, Radio, Gauge, SlidersHorizontal, Workflow, type LucideIcon } from "lucide-react";

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
        title: "Or use the one-file Python client",
        body: "On a Raspberry Pi or PC, download iotflow.py (no pip install needed for HTTP) and send readings in two lines.",
        code: `from iotflow import IoTFlow
iot = IoTFlow("https://YOUR-HOST", "dev_YOUR_DEVICE_TOKEN", "your-device-id")
iot.send(temperature=22.5, humidity=60)`,
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
];

export function getTutorial(slug: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}

export const TUTORIAL_SLUGS = TUTORIALS.map((t) => t.slug);
