/*
  IoTFlow.h — Arduino / ESP32 / ESP8266 client for the IoTFlow IoT platform.

  A thin, Blynk-style wrapper over PubSubClient (MQTT). No JSON library needed.

    - Report a reading:   iot.virtualWrite("temperature", 22.5);
    - React to commands:  set a callback with iot.onCommand(cb); the platform
                          publishes dashboard/n8n control changes to the device.

  Uplink   -> MQTT topic  devices/<deviceId>/telemetry   {"token":"..","<pin>":<value>}
  Downlink <- MQTT topic  devices/<deviceId>/down         {"pin":"V1","value":1}

  Usage:
    #include <WiFi.h>           // or <ESP8266WiFi.h>
    #include <PubSubClient.h>
    #include <IoTFlow.h>

    WiFiClient net;
    IoTFlow iot(net);

    void onCommand(const String& pin, float value, const String& text) {
      if (pin == "V1") digitalWrite(LED_BUILTIN, value > 0 ? HIGH : LOW);
    }

    void setup() {
      WiFi.begin(SSID, PASS);
      while (WiFi.status() != WL_CONNECTED) delay(300);
      iot.setServer("broker.host", 1883);
      iot.setDevice("esp32-led-01", "dev_xxxxx");
      iot.onCommand(onCommand);
      iot.begin();
    }

    void loop() {
      iot.loop();                         // keep MQTT alive + dispatch commands
      iot.virtualWrite("temperature", readTemp());
      delay(5000);
    }
*/
#ifndef IOTFLOW_H
#define IOTFLOW_H

#include <Arduino.h>
#include <PubSubClient.h>

// Signature for command handlers (downlink): pin name, numeric value, string value.
typedef void (*IoTFlowCommandCallback)(const String& pin, float value, const String& strValue);

class IoTFlow {
 public:
  explicit IoTFlow(Client& netClient);

  // Configuration (call before begin()).
  void setServer(const char* host, uint16_t port = 1883);
  void setAuth(const char* username, const char* password);  // optional broker auth
  void setDevice(const char* deviceId, const char* token);
  void onCommand(IoTFlowCommandCallback cb);

  // Lifecycle.
  void begin();
  void loop();               // call every iteration; keeps MQTT connected
  bool connected();

  // Uplink — report a reading under `pin` (a metric/virtual-pin name).
  bool virtualWrite(const String& pin, float value);
  bool virtualWrite(const String& pin, int value);
  bool virtualWrite(const String& pin, const String& text);

 private:
  PubSubClient _mqtt;
  const char* _host = "localhost";
  uint16_t _port = 1883;
  const char* _user = nullptr;
  const char* _pass = nullptr;
  const char* _deviceId = "";
  const char* _token = "";
  IoTFlowCommandCallback _cb = nullptr;

  String _upTopic;
  String _downTopic;

  bool ensureConnected();
  void handleMessage(char* topic, uint8_t* payload, unsigned int len);
  bool publishReading(const String& pin, const String& jsonValue);

  static IoTFlow* _instance;                       // for the static MQTT trampoline
  static void _onMqtt(char* topic, uint8_t* payload, unsigned int len);
};

#endif  // IOTFLOW_H
