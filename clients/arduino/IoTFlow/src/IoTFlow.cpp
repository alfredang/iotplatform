#include "IoTFlow.h"

IoTFlow* IoTFlow::_instance = nullptr;

IoTFlow::IoTFlow(Client& netClient) : _mqtt(netClient) {}

void IoTFlow::setServer(const char* host, uint16_t port) {
  _host = host;
  _port = port;
}

void IoTFlow::setAuth(const char* username, const char* password) {
  _user = username;
  _pass = password;
}

void IoTFlow::setDevice(const char* deviceId, const char* token) {
  _deviceId = deviceId;
  _token = token;
  _upTopic = String("devices/") + deviceId + "/telemetry";
  _downTopic = String("devices/") + deviceId + "/down";
}

void IoTFlow::onCommand(IoTFlowCommandCallback cb) { _cb = cb; }

void IoTFlow::begin() {
  _instance = this;
  _mqtt.setServer(_host, _port);
  _mqtt.setCallback(IoTFlow::_onMqtt);
  ensureConnected();
}

bool IoTFlow::connected() { return _mqtt.connected(); }

void IoTFlow::loop() {
  if (!ensureConnected()) return;
  _mqtt.loop();
}

bool IoTFlow::ensureConnected() {
  if (_mqtt.connected()) return true;

  String clientId = String("iotflow-") + _deviceId;
  bool ok = (_user && strlen(_user))
                ? _mqtt.connect(clientId.c_str(), _user, _pass)
                : _mqtt.connect(clientId.c_str());
  if (ok && _downTopic.length()) {
    _mqtt.subscribe(_downTopic.c_str());  // listen for control commands
  }
  return ok;
}

// ---- Static trampoline: PubSubClient needs a plain function pointer ----
void IoTFlow::_onMqtt(char* topic, uint8_t* payload, unsigned int len) {
  if (_instance) _instance->handleMessage(topic, payload, len);
}

// Minimal JSON extraction for the small, known downlink payload:
//   {"pin":"V1","value":1,"strValue":"hi","ts":123}
static String jsonStr(const String& body, const String& key) {
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
static float jsonNum(const String& body, const String& key) {
  int k = body.indexOf("\"" + key + "\"");
  if (k < 0) return 0;
  int c = body.indexOf(':', k);
  if (c < 0) return 0;
  return body.substring(c + 1).toFloat();
}

void IoTFlow::handleMessage(char* topic, uint8_t* payload, unsigned int len) {
  if (!_cb) return;
  String body;
  body.reserve(len);
  for (unsigned int i = 0; i < len; i++) body += (char)payload[i];
  String pin = jsonStr(body, "pin");
  String strValue = jsonStr(body, "strValue");
  float value = jsonNum(body, "value");
  if (pin.length()) _cb(pin, value, strValue);
}

bool IoTFlow::publishReading(const String& pin, const String& jsonValue) {
  if (!ensureConnected()) return false;
  String msg = String("{\"token\":\"") + _token + "\",\"" + pin + "\":" + jsonValue + "}";
  return _mqtt.publish(_upTopic.c_str(), msg.c_str());
}

bool IoTFlow::virtualWrite(const String& pin, float value) {
  return publishReading(pin, String(value, 3));
}
bool IoTFlow::virtualWrite(const String& pin, int value) {
  return publishReading(pin, String(value));
}
bool IoTFlow::virtualWrite(const String& pin, const String& text) {
  return publishReading(pin, String("\"") + text + "\"");
}
