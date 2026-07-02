/*
  IoTFlow — ESP8266/ESP32 temperature & humidity (uplink)

  Reports temperature & humidity every 10s with virtualWrite(). Bind Number /
  Gauge / Line widgets to the "temperature" and "humidity" metrics on your
  IoTFlow dashboard. (Replace the fake readings with a real DHT sensor.)
*/
#include <ESP8266WiFi.h>        // for ESP32 use: #include <WiFi.h>
#include <PubSubClient.h>
#include <IoTFlow.h>

const char* SSID   = "YOUR_WIFI";
const char* PASS   = "YOUR_PASSWORD";
const char* BROKER = "YOUR_BROKER_HOST";
const char* DEVICE = "esp8266-dht22";
const char* TOKEN  = "dev_XXXXXXXXXXXX";

WiFiClient net;
IoTFlow iot(net);

void setup() {
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(300);
  iot.setServer(BROKER, 1883);
  iot.setDevice(DEVICE, TOKEN);
  iot.begin();
}

void loop() {
  iot.loop();
  float temperature = 22.0 + (millis() % 5000) / 1000.0;  // TODO: read DHT
  float humidity    = 55.0;
  iot.virtualWrite("temperature", temperature);
  iot.virtualWrite("humidity", humidity);
  delay(10000);
}
