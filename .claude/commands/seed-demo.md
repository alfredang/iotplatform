---
description: Seed / reseed the IoTFlow demo data (accounts, projects, devices, n8n-linked automations)
---

Reseed the local demo environment for IoTFlow. Steps:

1. Ensure Postgres + MQTT are up (docker containers `iotplatform-db`, `iotplatform-mqtt`) and `.env` `DATABASE_URL` points at the DB.
2. Base seed (accounts + a couple projects): `npm run db:seed`.
3. The 10 mixed-board demo projects + automations wired to n8n:
   `set -a; source .env; set +a; npx tsx prisma/demo-projects.ts`
   (each project's automation points at `N8N_BASE_URL/webhook/iot-demo-<slug>`).
4. Confirm: log in as `admin@demo.io / password123`, open Projects (expect 12) and Automations (expect the demo flows).

If the demo n8n flows don't exist on the instance yet, recreate them with the generator described in `docs/n8n-integration.md`, then re-run step 3.
