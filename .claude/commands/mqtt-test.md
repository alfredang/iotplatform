---
description: Publish a test telemetry message and/or verify a downlink control command over MQTT
argument-hint: "[deviceId] [metric=value]"
---

Exercise the IoTFlow MQTT + command path end-to-end for `$ARGUMENTS` (default device `wh-sensor-a`, metric `temperature=42`).

Uplink (telemetry):
- HTTP: `curl -X POST http://localhost:3000/api/telemetry -H "Authorization: Bearer <iot_ API key>" -H "Content-Type: application/json" -d '{"deviceId":"<id>","<metric>":<value>}'`
- MQTT: `docker exec iotplatform-mqtt mosquitto_pub -t "devices/<id>/telemetry" -m '{"token":"dev_...","<metric>":<value>}'`

Downlink (control / virtual pin):
- Set a pin: `curl -X POST http://localhost:3000/api/devices/<internalId>/command -H "Authorization: Bearer <iot_ key>" -H "Content-Type: application/json" -d '{"pin":"V1","value":1}'`
- Confirm publish: subscribe first with `docker exec iotplatform-mqtt mosquitto_sub -t "devices/<id>/down" -C 1`.
- Device-facing state: `curl http://localhost:3000/api/device/state -H "Authorization: Bearer <dev_ token>"`.

Then report what was stored, whether a `devices/<id>/down` message was published, and whether any alert/automation fired (check n8n executions).
