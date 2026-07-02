import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/copy";
import { Rocket, Cpu, Download, Terminal, Plug } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Integrate a device · IoTFlow" };

const REPO = "https://github.com/alfredang/iotplatform";

export default function IntegratePage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://iot.tertiaryinfotech.com";
  const mqttHost = process.env.NEXT_PUBLIC_MQTT_HOST || "localhost:1883";
  const [mqttHostOnly, mqttPort] = mqttHost.split(":");

  const curl = `curl -X POST ${appUrl}/api/telemetry \\
  -H "Authorization: Bearer dev_YOUR_DEVICE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"temperature": 22.5, "humidity": 60}'`;

  const python = `# 1) download the one file (no pip needed for HTTP):
#    curl -O https://raw.githubusercontent.com/alfredang/iotplatform/main/clients/python/iotflow.py
from iotflow import IoTFlow

iot = IoTFlow("${appUrl}", "dev_YOUR_DEVICE_TOKEN", "your-device-id")
iot.send(temperature=22.5, humidity=60)        # report readings

@iot.on_command                                 # react to dashboard/n8n control
def handle(pin, value, text):
    if pin == "pump":
        print("pump ->", value)
iot.run(interval=3)`;

  const esp32 = `#include <WiFi.h>
#include <PubSubClient.h>
#include <IoTFlow.h>          // optional library — see Downloads below

WiFiClient net;
IoTFlow iot(net);

void onCommand(const String& pin, float value, const String& text) {
  if (pin == "V1") digitalWrite(2, value > 0 ? HIGH : LOW);   // control
}

void setup() {
  WiFi.begin("SSID", "PASS");
  while (WiFi.status() != WL_CONNECTED) delay(300);
  iot.setServer("${mqttHostOnly}", ${mqttPort || "1883"});
  iot.setDevice("your-device-id", "dev_YOUR_DEVICE_TOKEN");
  iot.onCommand(onCommand);
  iot.begin();
}

void loop() {
  iot.loop();
  iot.virtualWrite("temperature", 22.5);
  delay(5000);
}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrate a device"
        description="Connect Arduino, ESP32, ESP8266 or Raspberry Pi over MQTT/HTTP — copy, paste, done."
      />

      {/* 3 steps */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" /> Get connected in 3 steps</CardTitle></CardHeader>
        <CardBody>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3"><Step n={1} /><span><Link href="/devices/new" className="text-primary hover:underline">Add a device</Link> and copy its <strong>device token</strong> (<code className="font-mono">dev_…</code>, shown once).</span></li>
            <li className="flex gap-3"><Step n={2} /><span>Paste one of the snippets below into your board / Pi and fill in your token + device id. The <Link href="/devices/new" className="text-primary hover:underline">wizard</Link> pre-fills these for you.</span></li>
            <li className="flex gap-3"><Step n={3} /><span>Watch data arrive on the <Link href="/dashboard" className="text-primary hover:underline">dashboard</Link>. Add a Button/Switch/Slider widget to control the device back (virtual pins).</span></li>
          </ol>
        </CardBody>
      </Card>

      {/* Quickstart snippets */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Terminal className="h-5 w-5 text-primary" /> Quickstart (copy &amp; paste)</h2>
        <Guide title="Any device — HTTP (cURL)" code={curl} note="Send JSON to the REST endpoint with your device token. Works from any language or shell." />
        <Guide title="Raspberry Pi / PC — Python (one file, no install)" code={python} note="HTTP mode uses only the Python standard library." />
        <Guide title="ESP32 / ESP8266 — Arduino (MQTT, two-way)" code={esp32} note="Uses the optional IoTFlow library for a clean API. The wizard can also emit a plain PubSubClient sketch with no library." />
      </div>

      {/* Downloads */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Optional device libraries</CardTitle></CardHeader>
        <CardBody className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Cpu className="mt-0.5 h-4 w-4 text-muted" />
            <div>
              <p className="font-medium">Arduino / ESP32 / ESP8266</p>
              <p className="text-muted">Download the library, then Arduino IDE → <em>Sketch → Include Library → Add .ZIP Library…</em> and install <strong>PubSubClient</strong>.</p>
              <a className="text-primary hover:underline" href={`${REPO}/tree/main/clients/arduino/IoTFlow`} target="_blank" rel="noopener noreferrer">Download the Arduino library →</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Plug className="mt-0.5 h-4 w-4 text-muted" />
            <div>
              <p className="font-medium">Python (Raspberry Pi)</p>
              <CodeBlock code={`curl -O https://raw.githubusercontent.com/alfredang/iotplatform/main/clients/python/iotflow.py`} />
              <a className="text-primary hover:underline" href={`${REPO}/tree/main/clients/python`} target="_blank" rel="noopener noreferrer">View the Python client →</a>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Protocol reference */}
      <Card>
        <CardHeader><CardTitle>Protocol reference</CardTitle></CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr><th className="py-2 pr-4 font-medium">Direction</th><th className="py-2 pr-4 font-medium">HTTP</th><th className="py-2 font-medium">MQTT</th></tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-t border-border"><td className="py-2 pr-4">Uplink (telemetry)</td><td className="py-2 pr-4">POST /api/telemetry</td><td className="py-2">devices/&lt;id&gt;/telemetry</td></tr>
                <tr className="border-t border-border"><td className="py-2 pr-4">Downlink (control)</td><td className="py-2 pr-4">GET /api/device/state</td><td className="py-2">devices/&lt;id&gt;/down</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Auth with a device token (<code className="font-mono">dev_…</code>) or an account API key
            (<code className="font-mono">iot_…</code> + <code className="font-mono">deviceId</code> in the body).
            Control messages look like <code className="font-mono">{`{"pin":"V1","value":1}`}</code>.
            Full write-up: <a className="text-primary hover:underline" href={`${REPO}/blob/main/docs/n8n-integration.md`} target="_blank" rel="noopener noreferrer">docs/n8n-integration.md</a>.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
      {n}
    </span>
  );
}

function Guide({ title, code, note }: { title: string; code: string; note: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody className="space-y-2">
        <CodeBlock code={code} />
        <p className="text-xs text-muted">{note}</p>
      </CardBody>
    </Card>
  );
}
