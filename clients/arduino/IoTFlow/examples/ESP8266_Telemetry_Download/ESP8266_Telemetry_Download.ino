/*
  IoTFlow — ESP8266 downlink (control) over raw MQTT (no library).

  Connects to WiFi, connects to the Mosquitto broker, then subscribes to
  devices/<DEVICE_ID>/down and reacts to control commands published by the
  IoTFlow dashboard (control widgets) or an n8n flow:

    {"pin":"led","value":1}
    {"pin":"led","value":0,"strValue":"off"}

  Requires the "PubSubClient" library (Library Manager > search PubSubClient).
*/
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// ---- WiFi ----
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---- MQTT broker ----
// Use your machine's LAN IP (not "localhost" — the ESP8266 is a separate
// device on the network). Find it with `ipconfig` (look for IPv4 Address).
const char* MQTT_BROKER = "192.168.3.228";
const uint16_t MQTT_PORT = 1883;

// ---- Device identity (must match the deviceId set in the dashboard) ----
const char* DEVICE_ID = "esp8266-01";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
String downTopic;

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected, IP: ");
  Serial.println(WiFi.localIP());
}

// Minimal JSON extraction for the small, known downlink payload:
//   {"pin":"led","value":1,"strValue":"on"}
String jsonStr(const String& body, const String& key) {
  int k = body.indexOf("\"" + key + "\"");
  if (k < 0) return "";
  int c = body.indexOf(':', k);
  if (c < 0) return "";
  int q1 = body.indexOf('"', c + 1);
  if (q1 < 0) return "";
  int q2 = body.indexOf('"', q1 + 1);
  if (q2 < 0) return "";
  return body.substring(q1 + 1, q2);
}
float jsonNum(const String& body, const String& key) {
  int k = body.indexOf("\"" + key + "\"");
  if (k < 0) return 0;
  int c = body.indexOf(':', k);
  if (c < 0) return 0;
  return body.substring(c + 1).toFloat();
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String body;
  body.reserve(length);
  for (unsigned int i = 0; i < length; i++) body += (char)payload[i];

  Serial.print("Received on ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(body);

  String pin = jsonStr(body, "pin");
  float value = jsonNum(body, "value");
  if (pin.length() == 0) return;

  // TODO: act on the command, e.g.:
  // if (pin == "led") digitalWrite(LED_BUILTIN, value > 0 ? LOW : HIGH);
  Serial.print("pin=");
  Serial.print(pin);
  Serial.print(" value=");
  Serial.println(value);
}

void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker...");
    String clientId = "esp8266-" + String(ESP.getChipId(), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
      mqttClient.subscribe(downTopic.c_str());
      Serial.print("Subscribed to ");
      Serial.println(downTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" — retrying in 2s");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  downTopic = String("devices/") + DEVICE_ID + "/down";

  connectWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();  // keep the MQTT connection alive + dispatch onMqttMessage
}
