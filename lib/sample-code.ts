/**
 * Generates copy-paste device snippets for the connection wizard / device page.
 * `token` is the device token; when omitted a placeholder is shown.
 */
export type SnippetCtx = {
  deviceId: string;
  token?: string;
  appUrl: string;
  mqttHost: string;
};

export type Snippet = { id: string; label: string; language: string; code: string };

export function buildSnippets(ctx: SnippetCtx): {
  http: Snippet[];
  mqtt: Snippet[];
} {
  const token = ctx.token || "<DEVICE_TOKEN>";
  const endpoint = `${ctx.appUrl}/api/telemetry`;
  const topic = `devices/${ctx.deviceId}/telemetry`;

  const curl: Snippet = {
    id: "curl",
    label: "cURL",
    language: "bash",
    code: `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"temperature": 28.5, "humidity": 65, "voltage": 3.7}'`,
  };

  const esp32: Snippet = {
    id: "esp32",
    label: "ESP32 (HTTP)",
    language: "cpp",
    code: `#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* endpoint = "${endpoint}";
const char* token = "${token}";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + token);
    String body = "{\\"temperature\\": 28.5, \\"humidity\\": 65}";
    int code = http.POST(body);
    Serial.println(code);
    http.end();
  }
  delay(10000);
}`,
  };

  const arduino: Snippet = {
    id: "arduino",
    label: "Arduino (Uno WiFi)",
    language: "cpp",
    code: `#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>

char ssid[] = "YOUR_WIFI";
char pass[] = "YOUR_PASSWORD";
const char host[] = "${hostFrom(ctx.appUrl)}";
const char token[] = "${token}";

WiFiClient wifi;
HttpClient client = HttpClient(wifi, host, ${portFrom(ctx.appUrl)});

void setup() { WiFi.begin(ssid, pass); }

void loop() {
  String body = "{\\"temperature\\": 28.5, \\"humidity\\": 65}";
  client.beginRequest();
  client.post("/api/telemetry");
  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Authorization", String("Bearer ") + token);
  client.sendHeader("Content-Length", body.length());
  client.beginBody();
  client.print(body);
  client.endRequest();
  delay(10000);
}`,
  };

  const rpi: Snippet = {
    id: "rpi",
    label: "Raspberry Pi (Python)",
    language: "python",
    code: `import requests, time

ENDPOINT = "${endpoint}"
TOKEN = "${token}"

while True:
    payload = {"temperature": 28.5, "humidity": 65, "voltage": 3.7}
    r = requests.post(
        ENDPOINT,
        json=payload,
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=10,
    )
    print(r.status_code, r.text)
    time.sleep(10)`,
  };

  const mqttPub: Snippet = {
    id: "mosquitto",
    label: "mosquitto_pub (CLI)",
    language: "bash",
    code: `mosquitto_pub -h ${hostOnly(ctx.mqttHost)} -p ${portOnly(ctx.mqttHost)} \\
  -t "${topic}" \\
  -m '{"token": "${token}", "temperature": 28.5, "humidity": 65}'`,
  };

  const mqttPy: Snippet = {
    id: "paho",
    label: "Python (paho-mqtt)",
    language: "python",
    code: `import json, time
import paho.mqtt.client as mqtt

BROKER = "${hostOnly(ctx.mqttHost)}"
PORT = ${portOnly(ctx.mqttHost)}
TOPIC = "${topic}"
TOKEN = "${token}"

client = mqtt.Client()
client.connect(BROKER, PORT, 60)
client.loop_start()

while True:
    payload = {"token": TOKEN, "temperature": 28.5, "humidity": 65}
    client.publish(TOPIC, json.dumps(payload))
    print("published", payload)
    time.sleep(10)`,
  };

  const esp32Mqtt: Snippet = {
    id: "esp32-mqtt",
    label: "ESP32 (MQTT)",
    language: "cpp",
    code: `#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* broker = "${hostOnly(ctx.mqttHost)}";
const int port = ${portOnly(ctx.mqttHost)};
const char* topic = "${topic}";
const char* token = "${token}";

WiFiClient net;
PubSubClient client(net);

void setup() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(broker, port);
}

void loop() {
  if (!client.connected()) client.connect("esp32-${ctx.deviceId}");
  client.loop();
  String payload = String("{\\"token\\":\\"") + token + "\\",\\"temperature\\":28.5}";
  client.publish(topic, payload.c_str());
  delay(10000);
}`,
  };

  return {
    http: [curl, esp32, arduino, rpi],
    mqtt: [mqttPub, mqttPy, esp32Mqtt],
  };
}

function stripProto(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^mqtt:\/\//, "");
}
function hostFrom(url: string) {
  return stripProto(url).split(":")[0].split("/")[0];
}
function portFrom(url: string) {
  if (url.startsWith("https")) return 443;
  const m = stripProto(url).match(/:(\d+)/);
  return m ? Number(m[1]) : 80;
}
function hostOnly(hostPort: string) {
  return hostPort.split(":")[0];
}
function portOnly(hostPort: string) {
  const m = hostPort.match(/:(\d+)/);
  return m ? Number(m[1]) : 1883;
}
