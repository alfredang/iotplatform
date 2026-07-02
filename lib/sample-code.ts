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
  control: Snippet[];
} {
  const token = ctx.token || "<DEVICE_TOKEN>";
  const endpoint = `${ctx.appUrl}/api/telemetry`;
  const stateEndpoint = `${ctx.appUrl}/api/device/state`;
  const topic = `devices/${ctx.deviceId}/telemetry`;
  const downTopic = `devices/${ctx.deviceId}/down`;

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

  // -------------------------------------------------------------------------
  // Control (downlink) snippets — the device RECEIVES commands from the
  // dashboard / n8n, the equivalent of Blynk's BLYNK_WRITE(vpin) handler.
  // Over MQTT: subscribe to `devices/<id>/down` and react to {pin, value}.
  // Over HTTP: poll GET /api/device/state for the latest virtual-pin values.
  // -------------------------------------------------------------------------

  const esp32Control: Snippet = {
    id: "esp32-control",
    label: "ESP32 (MQTT control)",
    language: "cpp",
    code: `#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>   // Library Manager: "ArduinoJson"

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* broker = "${hostOnly(ctx.mqttHost)}";
const int   port = ${portOnly(ctx.mqttHost)};
const char* upTopic   = "${topic}";     // publish sensor data (virtualWrite)
const char* downTopic = "${downTopic}";  // receive commands (BLYNK_WRITE)
const char* token = "${token}";

WiFiClient net;
PubSubClient client(net);
const int RELAY_PIN = 2;   // e.g. onboard LED / relay

// Called whenever the dashboard writes to a virtual pin.
void onCommand(char* topic, byte* payload, unsigned int len) {
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, payload, len)) return;
  const char* pin = doc["pin"];      // e.g. "V1", "relay"
  float value = doc["value"] | 0.0;  // numeric value
  if (strcmp(pin, "V1") == 0) {
    digitalWrite(RELAY_PIN, value > 0 ? HIGH : LOW);   // <- act on it
  }
}

void connect() {
  while (!client.connected()) {
    if (client.connect("esp32-${ctx.deviceId}")) {
      client.subscribe(downTopic);   // <- listen for commands
    } else delay(2000);
  }
}

void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(broker, port);
  client.setCallback(onCommand);
}

void loop() {
  if (!client.connected()) connect();
  client.loop();
  // Report a reading back (virtualWrite equivalent)
  String up = String("{\\"token\\":\\"") + token + "\\",\\"temperature\\":28.5}";
  client.publish(upTopic, up.c_str());
  delay(5000);
}`,
  };

  const esp32HttpControl: Snippet = {
    id: "esp32-http-control",
    label: "ESP32 (HTTP poll)",
    language: "cpp",
    code: `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* stateUrl = "${stateEndpoint}";
const char* token = "${token}";
const int RELAY_PIN = 2;

void pollCommands() {
  HTTPClient http;
  http.begin(stateUrl);
  http.addHeader("Authorization", String("Bearer ") + token);
  if (http.GET() == 200) {
    StaticJsonDocument<512> doc;
    if (!deserializeJson(doc, http.getString())) {
      float v1 = doc["state"]["V1"] | 0.0;   // read virtual pin V1
      digitalWrite(RELAY_PIN, v1 > 0 ? HIGH : LOW);
    }
  }
  http.end();
}

void loop() {
  pollCommands();   // check the dashboard state every few seconds
  delay(3000);
}`,
  };

  const pyControl: Snippet = {
    id: "paho-control",
    label: "Python (paho control)",
    language: "python",
    code: `import json, time
import paho.mqtt.client as mqtt

BROKER = "${hostOnly(ctx.mqttHost)}"
PORT = ${portOnly(ctx.mqttHost)}
UP_TOPIC   = "${topic}"     # publish readings
DOWN_TOPIC = "${downTopic}"  # receive commands
TOKEN = "${token}"

def on_connect(client, userdata, flags, rc):
    client.subscribe(DOWN_TOPIC)          # listen for commands

def on_message(client, userdata, msg):
    cmd = json.loads(msg.payload)          # {"pin": "V1", "value": 1}
    print("command:", cmd)
    if cmd.get("pin") == "V1":
        # ... drive a GPIO / relay here ...
        pass

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER, PORT, 60)
client.loop_start()

while True:
    client.publish(UP_TOPIC, json.dumps({"token": TOKEN, "temperature": 28.5}))
    time.sleep(5)`,
  };

  const rpiControl: Snippet = {
    id: "rpi-control",
    label: "Raspberry Pi (HTTP poll)",
    language: "python",
    code: `import requests, time

STATE_URL = "${stateEndpoint}"
TOKEN = "${token}"

# import RPi.GPIO as GPIO  # on a real Pi

while True:
    r = requests.get(STATE_URL, headers={"Authorization": f"Bearer {TOKEN}"}, timeout=10)
    state = r.json().get("state", {})
    v1 = state.get("V1", 0)          # value set from the dashboard/n8n
    print("V1 =", v1)
    # GPIO.output(RELAY, GPIO.HIGH if v1 else GPIO.LOW)
    time.sleep(3)`,
  };

  const cppControl: Snippet = {
    id: "cpp-control",
    label: "C++ (Linux, Paho)",
    language: "cpp",
    code: `// Build: g++ main.cpp -lpaho-mqttpp3 -lpaho-mqtt3as -o iot
#include <mqtt/async_client.h>
#include <nlohmann/json.hpp>
#include <iostream>
using json = nlohmann::json;

const std::string BROKER = "tcp://${hostOnly(ctx.mqttHost)}:${portOnly(ctx.mqttHost)}";
const std::string UP    = "${topic}";
const std::string DOWN  = "${downTopic}";
const std::string TOKEN = "${token}";

int main() {
  mqtt::async_client cli(BROKER, "cpp-${ctx.deviceId}");
  cli.set_message_callback([](mqtt::const_message_ptr m) {
    auto cmd = json::parse(m->to_string());          // {"pin":"V1","value":1}
    std::cout << "command " << cmd["pin"] << " = " << cmd["value"] << "\\n";
    // ... act on the command (GPIO / actuator) ...
  });
  cli.connect()->wait();
  cli.subscribe(DOWN, 1)->wait();                     // receive commands
  while (true) {
    json up = {{"token", TOKEN}, {"temperature", 28.5}};
    cli.publish(mqtt::make_message(UP, up.dump()))->wait();  // virtualWrite
    std::this_thread::sleep_for(std::chrono::seconds(5));
  }
}`,
  };

  return {
    http: [curl, esp32, arduino, rpi],
    mqtt: [mqttPub, mqttPy, esp32Mqtt],
    control: [esp32Control, esp32HttpControl, pyControl, rpiControl, cppControl],
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
