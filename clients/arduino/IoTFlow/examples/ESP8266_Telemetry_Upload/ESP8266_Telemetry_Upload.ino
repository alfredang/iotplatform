/*
  IoTFlow — ESP8266 telemetry over raw MQTT (no library), every 10s.

  Connects to WiFi, connects to the Mosquitto broker, then publishes
  {"token":"...","temperature":28.5,"humidity":65,"voltage":3.7}
  to devices/<DEVICE_ID>/telemetry every 10 seconds.

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
const char* MQTT_BROKER = "192.168.1.50";
const uint16_t MQTT_PORT = 1883;

// ---- Device identity (from the "Add Device" wizard in IoTFlow) ----
const char* DEVICE_ID    = "test-device";
const char* DEVICE_TOKEN = "dev_YOUR_DEVICE_TOKEN";

const unsigned long PUBLISH_INTERVAL_MS = 10000;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
String telemetryTopic;
unsigned long lastPublish = 0;

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

void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker...");
    String clientId = "esp8266-" + String(ESP.getChipId(), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" — retrying in 2s");
      delay(2000);
    }
  }
}

void publishTelemetry(float temperature, float humidity, float voltage) {
  char payload[160];
  snprintf(payload, sizeof(payload),
           "{\"token\":\"%s\",\"temperature\":%.1f,\"humidity\":%.1f,\"voltage\":%.1f}",
           DEVICE_TOKEN, temperature, humidity, voltage);

  Serial.print("Publishing to ");
  Serial.print(telemetryTopic);
  Serial.print(": ");
  Serial.println(payload);

  mqttClient.publish(telemetryTopic.c_str(), payload);
}

void setup() {
  Serial.begin(115200);
  telemetryTopic = String("devices/") + DEVICE_ID + "/telemetry";

  connectWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();  // keep the MQTT connection alive; must be called often

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = now;
    // TODO: replace with real sensor readings
    float temperature = 28.5;
    float humidity    = 65;
    float voltage     = 3.7;
    publishTelemetry(temperature, humidity, voltage);
  }
}
