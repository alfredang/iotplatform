/*
  IoTFlow — ESP8266 downlink (control) via HTTPS polling.

  Equivalent to:
    curl https://iot.tertiaryinfotech.com/api/device/state \
      -H "Authorization: Bearer <DEVICE_TOKEN>"

  Polls GET /api/device/state every few seconds and reacts to virtual-pin
  values, e.g. {"state":{"relay":1}}. Use this instead of MQTT
  (PubSubClient) when the device can't hold a persistent MQTT connection —
  HTTPClient/WiFiClientSecure only, no MQTT library involved.

  Requires the "ArduinoJson" library (Library Manager > search ArduinoJson,
  Benoit Blanchon).
*/
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// ---- WiFi ----
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---- Device identity (from the "Add Device" wizard in IoTFlow) ----
const char* STATE_URL    = "https://iot.tertiaryinfotech.com/api/device/state";
const char* DEVICE_TOKEN = "dev_XVIoA9tU8dBmEWoy6-7nsQQMBqIPW1se";

const unsigned long POLL_INTERVAL_MS = 3000;
const int RELAY_PIN = 2;  // adjust to whichever pin you're controlling

unsigned long lastPoll = 0;

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

void pollState() {
  WiFiClientSecure client;
  client.setInsecure();  // skip cert validation; fine for a device poll loop

  HTTPClient http;
  http.begin(client, STATE_URL);
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    Serial.println(body);

    StaticJsonDocument<512> doc;
    if (!deserializeJson(doc, body)) {
      float relay = doc["state"]["relay"] | 0.0;
      digitalWrite(RELAY_PIN, relay > 0 ? HIGH : LOW);
    }
  } else {
    Serial.print("GET failed, code=");
    Serial.println(code);
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  unsigned long now = millis();
  if (now - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = now;
    pollState();
  }
}
