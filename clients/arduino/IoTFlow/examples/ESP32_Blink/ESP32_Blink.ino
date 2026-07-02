/*
  IoTFlow — ESP32 LED control (downlink)

  Add a Switch/Button widget bound to virtual pin "V1" on your IoTFlow
  dashboard (or trigger it from an n8n flow). This sketch turns the onboard
  LED on/off when the command arrives — the Blynk `BLYNK_WRITE(V1)` equivalent.
*/
#include <WiFi.h>
#include <PubSubClient.h>
#include <IoTFlow.h>

const char* SSID   = "YOUR_WIFI";
const char* PASS   = "YOUR_PASSWORD";
const char* BROKER = "YOUR_BROKER_HOST";     // e.g. 192.168.1.10 or broker host
const char* DEVICE = "esp32-led-01";          // Device ID from the platform
const char* TOKEN  = "dev_XXXXXXXXXXXX";       // Device token (shown once)

const int LED = 2;                             // onboard LED on most ESP32 boards

WiFiClient net;
IoTFlow iot(net);

// Called whenever the dashboard / n8n writes to a virtual pin.
void onCommand(const String& pin, float value, const String& text) {
  if (pin == "V1") digitalWrite(LED, value > 0 ? HIGH : LOW);
}

void setup() {
  pinMode(LED, OUTPUT);
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(300);

  iot.setServer(BROKER, 1883);
  iot.setDevice(DEVICE, TOKEN);
  iot.onCommand(onCommand);
  iot.begin();
}

void loop() {
  iot.loop();                        // keep connected + receive commands
  iot.virtualWrite("uptime", (int)(millis() / 1000));
  delay(5000);
}
