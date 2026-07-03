/**
 * Seeds the blog with categories, tags and 5 IoT + n8n project articles.
 * Run: npx tsx prisma/blog-seed.ts   (safe to re-run — replaces blog data)
 */
import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/utils";

const prisma = new PrismaClient();

const CATEGORIES = ["Projects", "Automation", "Tutorials", "Guides"];

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  flow: string; // svg in /public/blog
  likes: number;
  body: (flow: string) => string;
};

const common = (flow: string, setup: string[]) => `

## The n8n workflow

![n8n workflow](${flow})

Here is the low-code automation that ties it together. In IoTFlow, every device
event (telemetry, alert, command) can be forwarded to an **n8n Webhook**, and n8n
calls back into the platform to control the device.

${setup.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Wire it up in 3 steps

1. In n8n, add a **Webhook** node, activate it and copy the Production URL.
2. In IoTFlow → **Automations → New automation**, pick the event and paste the URL.
3. Click **Test**, then let real device data trigger it automatically.

> Tip: bind a **Switch** or **Slider** widget to the same virtual pin so you can
> also control the device by hand from the web or mobile app.

Happy building! 🚀
`;

const POSTS: Post[] = [
  {
    slug: "smart-farm-auto-irrigation-esp32-n8n",
    title: "Build a Smart Farm: Auto-Irrigation with ESP32, a Soil Sensor & n8n",
    excerpt:
      "Keep your crops watered automatically. Read soil moisture on an ESP32, stream it to IoTFlow over MQTT, and let an n8n flow switch the pump when the soil gets dry.",
    category: "Projects",
    tags: ["ESP32", "Agriculture", "n8n", "MQTT"],
    flow: "/blog/smart-agriculture-flow.svg",
    likes: 34,
    body: (flow) => `# Smart Farm: Auto-Irrigation

Watering plants by hand is easy to forget. In this project we build a
self-watering garden bed: an **ESP32** reads a capacitive soil-moisture sensor
and publishes the value to IoTFlow, and an **n8n** flow turns a pump relay on
when the soil dries out.

## What you need
- ESP32 dev board
- Capacitive soil moisture sensor
- 5V relay + small water pump
- IoTFlow account (create a device, copy its token)

## Device code (ESP32)

Report the reading with \`virtualWrite\`, and react to the pump command:

\`\`\`cpp
iot.setDevice("uno-soil-01", "dev_YOUR_TOKEN");
iot.onCommand([](const String& pin, float v, const String&){
  if (pin == "pump") digitalWrite(RELAY, v > 0 ? HIGH : LOW);
});
// in loop():
iot.virtualWrite("soil", readSoil());   // 0 (wet) .. 1023 (dry)
\`\`\`

Bind a **Gauge** widget to \`soil\` and a **Switch** widget to \`pump\` on your
dashboard so you can watch and override it anytime.
${common(flow, [
  "The Webhook receives every soil reading (TELEMETRY, metric = soil).",
  "An IF node checks whether soil < 300 (dry).",
  "If dry, an HTTP Request sets pump = 1; otherwise pump = 0.",
])}`,
  },
  {
    slug: "cold-chain-vaccine-fridge-alerts-raspberry-pi-n8n",
    title: "Cold-Chain Monitoring: Vaccine Fridge Alerts with Raspberry Pi & n8n",
    excerpt:
      "Protect temperature-sensitive stock. A Raspberry Pi logs fridge temperature to IoTFlow and an n8n flow escalates to staff on Telegram and email the moment it drifts out of range.",
    category: "Projects",
    tags: ["Raspberry Pi", "Cold Chain", "n8n", "Healthcare"],
    flow: "/blog/cold-chain-flow.svg",
    likes: 41,
    body: (flow) => `# Cold-Chain Monitoring

Vaccines and lab samples must stay within a tight temperature band. Here we use a
**Raspberry Pi** and a digital temperature probe to monitor a fridge, and an
**n8n** flow to escalate instantly if it warms up.

## Device code (Raspberry Pi, Python)

Zero-install with the one-file client:

\`\`\`python
from iotflow import IoTFlow
iot = IoTFlow("https://iot.tertiaryinfotech.com", "dev_YOUR_TOKEN", "cold-1")
while True:
    iot.send(temperature=read_probe())
    time.sleep(30)
\`\`\`

Add a **threshold alert** in IoTFlow (temperature > 8°C) — that alert becomes the
event that fires the flow below.
${common(flow, [
  "The Webhook receives the ALERT (or TELEMETRY, metric = temperature).",
  "An IF node checks temperature > 8°C.",
  "A Telegram + Email node escalates to on-call staff with the fridge name.",
])}`,
  },
  {
    slug: "smart-home-motion-activated-lighting-esp32-n8n",
    title: "Smart Home: Motion-Activated Lighting with ESP32 & n8n",
    excerpt:
      "Lights that follow you. A PIR sensor on an ESP32 triggers an n8n flow that switches a light on, waits, and turns it back off — no hub, no subscription.",
    category: "Automation",
    tags: ["ESP32", "Smart Home", "n8n"],
    flow: "/blog/smart-home-flow.svg",
    likes: 28,
    body: (flow) => `# Motion-Activated Lighting

A classic smart-home automation, done with open protocols. A **PIR sensor** on an
**ESP32** reports motion; an **n8n** flow turns the light on, waits five minutes,
then turns it off.

## Device code (ESP32)

\`\`\`cpp
iot.onCommand([](const String& pin, float v, const String&){
  if (pin == "V1") digitalWrite(LIGHT, v > 0 ? HIGH : LOW);
});
// on PIR rising edge:
iot.virtualWrite("motion", 1);
\`\`\`
${common(flow, [
  "The Webhook receives motion telemetry (metric = motion).",
  "An HTTP Request turns the light on (pin V1 = 1).",
  "A Wait node holds 5 minutes, then a second HTTP Request sets V1 = 0.",
])}`,
  },
  {
    slug: "energy-monitoring-log-power-google-sheets-n8n",
    title: "Energy Monitoring: Log Power to Google Sheets with n8n",
    excerpt:
      "Understand where your watts go. An ESP8266 smart plug streams power to IoTFlow, and an n8n flow appends every reading to a Google Sheet for easy charts and billing.",
    category: "Guides",
    tags: ["ESP8266", "Energy", "n8n", "Data Logging"],
    flow: "/blog/energy-flow.svg",
    likes: 22,
    body: (flow) => `# Energy Monitoring & Logging

You can't manage what you don't measure. A **Sonoff-style ESP8266** plug reports
power to IoTFlow; an **n8n** flow logs each reading to **Google Sheets** so you can
build charts or reconcile a power bill.

## Device code (ESP8266)

\`\`\`cpp
iot.virtualWrite("power", readPowerWatts());   // every few seconds
\`\`\`

Put a **Line chart** widget on \`power\` for a live view, then let n8n handle the
long-term history.
${common(flow, [
  "The Webhook receives each power reading (metric = power).",
  "A Function node rounds/aggregates the value and adds a timestamp.",
  "A Google Sheets node appends a row — ready for pivot tables and charts.",
])}`,
  },
  {
    slug: "industrial-predictive-maintenance-vibration-n8n",
    title: "Industrial IoT: Predictive Maintenance with Vibration Sensors & n8n",
    excerpt:
      "Catch failures before they happen. An Arduino reads motor vibration; when it crosses a limit, an n8n flow opens a maintenance ticket and pings the team on Slack.",
    category: "Projects",
    tags: ["Arduino", "Maintenance", "n8n", "Industrial IoT"],
    flow: "/blog/predictive-maintenance-flow.svg",
    likes: 37,
    body: (flow) => `# Predictive Maintenance

Unplanned downtime is expensive. An **Arduino** with an accelerometer measures
motor vibration and reports it to IoTFlow. When vibration spikes past a limit, an
**n8n** flow raises a ticket and alerts the maintenance team.

## Device code (Arduino)

\`\`\`cpp
iot.virtualWrite("vibration", readRms());   // g RMS
\`\`\`

Create an alert rule (vibration > limit). The alert is the trigger for the flow.
${common(flow, [
  "The Webhook receives the ALERT for the machine.",
  "An IF node confirms it is above the action threshold.",
  "A ticket is created (Jira/Sheet) and the team is notified on Slack.",
])}`,
  },
  {
    slug: "smart-city-parking-guidance-esp32-n8n",
    title: "Smart City: ESP32 Parking Guidance with Ultrasonic Sensors & n8n",
    excerpt:
      "Help drivers find a free bay fast. ESP32 + HC-SR04 sensors report each parking bay to IoTFlow, and an n8n flow updates a guidance sign and logs occupancy.",
    category: "Projects",
    tags: ["ESP32", "Smart City", "n8n"],
    flow: "/blog/smart-city-flow.svg",
    likes: 19,
    body: (flow) => `# Smart Parking Guidance

Circling for parking wastes fuel and time. Cheap **ESP32 + HC-SR04** sensors
detect whether each bay is occupied and report it to IoTFlow; an **n8n** flow
updates a "spaces free" sign and logs occupancy for planning.

## Device code (ESP32)

\`\`\`cpp
iot.virtualWrite("occupancy", bayOccupied() ? 1 : 0);
\`\`\`
${common(flow, [
  "The Webhook receives each bay's occupancy (metric = occupancy).",
  "An IF node checks whether a bay just became free.",
  "An HTTP Request updates the guidance sign; a Sheets node logs the count.",
])}`,
  },
  {
    slug: "retail-cooler-monitoring-esp8266-n8n",
    title: "Retail: Keep Fridges & Coolers Safe with an ESP8266 & n8n",
    excerpt:
      "Spoiled stock is lost revenue. An ESP8266 watches cooler temperature and an n8n flow escalates to the store on WhatsApp and email before product is at risk.",
    category: "Projects",
    tags: ["ESP8266", "Retail", "n8n", "Cold Chain"],
    flow: "/blog/retail-cooler-flow.svg",
    likes: 24,
    body: (flow) => `# Retail Cooler Monitoring

A single warm night can ruin a fridge of stock. An **ESP8266** with a DS18B20
probe reports cooler temperature to IoTFlow; an **n8n** flow alerts the store
team the moment it drifts out of range.

## Device code (ESP8266)

\`\`\`cpp
iot.virtualWrite("temperature", readCoolerTemp());
\`\`\`

Add a threshold alert (temperature > 6°C) — that alert triggers the flow.
${common(flow, [
  "The Webhook receives the ALERT (metric = temperature).",
  "An IF node checks temperature > 6°C.",
  "A WhatsApp + Email node notifies the store manager with the cooler name.",
])}`,
  },
  {
    slug: "water-tank-auto-refill-arduino-n8n",
    title: "Water Management: Auto Tank Refill with an Arduino & n8n",
    excerpt:
      "Never run a tank dry. An Arduino float sensor reports tank level to IoTFlow, and an n8n flow starts the fill pump when the level drops — and stops it when full.",
    category: "Projects",
    tags: ["Arduino", "Water", "n8n"],
    flow: "/blog/water-tank-flow.svg",
    likes: 21,
    body: (flow) => `# Auto Tank Refill

Manual tank top-ups are easy to forget. An **Arduino** float/ultrasonic sensor
reports the level to IoTFlow; an **n8n** flow runs the fill pump between low and
high thresholds.

## Device code (Arduino)

\`\`\`cpp
iot.onCommand([](const String& pin, float v, const String&){
  if (pin == "pump") digitalWrite(PUMP, v > 0 ? HIGH : LOW);
});
iot.virtualWrite("level", readLevelPercent());   // 0..100 %
\`\`\`

Add a **Gauge** on \`level\` and a **Switch** on \`pump\` to watch and override.
${common(flow, [
  "The Webhook receives the level reading (metric = level).",
  "An IF node checks level < 20% (low).",
  "An HTTP Request starts the pump; another stops it once the tank is full.",
])}`,
  },
  {
    slug: "fleet-cold-chain-gps-raspberry-pi-n8n",
    title: "Logistics: Fleet Cold-Chain Tracking with Raspberry Pi GPS & n8n",
    excerpt:
      "Prove your cold chain in transit. A Raspberry Pi streams truck temperature and GPS to IoTFlow, and an n8n flow alerts dispatch and logs the trip when it drifts.",
    category: "Projects",
    tags: ["Raspberry Pi", "Logistics", "n8n", "Cold Chain"],
    flow: "/blog/fleet-coldchain-flow.svg",
    likes: 26,
    body: (flow) => `# Fleet Cold-Chain Tracking

Rejected deliveries are expensive. A **Raspberry Pi** with a temperature probe
and a GPS module streams both to IoTFlow — plotted live on the map — and an
**n8n** flow escalates to dispatch the moment the reefer drifts out of range.

## Device code (Raspberry Pi, Python)

\`\`\`python
iot.send(temperature=read_probe(), gps={"lat": lat, "lng": lng})
\`\`\`
${common(flow, [
  "The Webhook receives truck telemetry (temperature + GPS).",
  "An IF node checks whether it is out of range or off-route.",
  "A Slack node alerts dispatch; a Sheets node logs the full trip.",
])}`,
  },
  {
    slug: "smart-building-co2-hvac-esp32-n8n",
    title: "Smart Buildings: Demand-Controlled HVAC with CO₂ Sensing & n8n",
    excerpt:
      "Fresh air without wasting energy. An ESP32 + SCD30 measures room CO₂; an n8n flow boosts ventilation only when it's needed, then eases off.",
    category: "Projects",
    tags: ["ESP32", "Smart Building", "n8n"],
    flow: "/blog/smart-building-flow.svg",
    likes: 22,
    body: (flow) => `# Demand-Controlled Ventilation

Running HVAC flat-out wastes energy; running it too little makes rooms stuffy.
An **ESP32 + SCD30** measures CO₂ and reports it to IoTFlow; an **n8n** flow
boosts ventilation only when CO₂ climbs.

## Device code (ESP32)

\`\`\`cpp
iot.virtualWrite("co2", readCO2ppm());
\`\`\`
${common(flow, [
  "The Webhook receives the CO₂ reading (metric = co2).",
  "An IF node checks CO₂ > 1000 ppm.",
  "An HTTP Request boosts the HVAC (pin hvac), easing off when it recovers.",
])}`,
  },
  {
    slug: "why-n8n-is-a-perfect-fit-for-iot",
    title: "Why n8n Is a Perfect Fit for IoT",
    excerpt:
      "The winning IoT stack splits the work three ways: the IoT platform connects and senses, n8n handles actions and alerts, and mobile apps give you the dashboard and control. Here's why that combination is so powerful.",
    category: "Guides",
    tags: ["n8n", "Architecture", "Automation"],
    flow: "/blog/why-n8n-flow.svg",
    likes: 48,
    body: (flow) => `# Why n8n Is a Perfect Fit for IoT

Most IoT projects don't fail at *sensing* — they fail at everything that has to
happen **after** a reading arrives: the alerts, the escalations, the "if this
then that" logic, the logging, the integrations. That's exactly where **n8n**
shines. The winning stack splits the work three ways, and each part does what
it's best at.

![How IoTFlow, n8n and the mobile apps work together](${flow})

## The three-part IoT stack

### 1) IoT platform — connection & sensing
The platform's job is to **connect devices and capture data reliably**. Arduino,
ESP32, ESP8266 and Raspberry Pi push readings over **MQTT or HTTP**; the platform
normalizes them into metrics, tracks device online/offline status, and stores the
history. It's the sensory nervous system: always on, always listening.

### 2) n8n — actions & alerts
Once a reading exists, **what should happen?** That's business logic, and it
changes constantly — so you don't want it buried in firmware. n8n takes over as
the **automation brain**: every telemetry reading, alert, or command is forwarded
to an n8n **Webhook**, where drag-and-drop nodes decide the outcome — notify on
Slack/Email/SMS/WhatsApp, open a ticket, log to a spreadsheet, call an AI model,
or **call back to control the device**. Change the rules in seconds, no reflashing.

### 3) Mobile apps — dashboard & control
People don't sit at a desk watching dashboards. The **iOS and Android apps** put
the live dashboard and **two-way control** in your pocket: check a gauge, flip a
relay, trigger a flow — from anywhere, with push notifications when something
needs you.

## Why the combination wins

- **Separation of concerns.** Firmware stays simple (just sense + obey commands).
  Logic lives in n8n where it's easy to change. UX lives in the apps.
- **No code for the hard part.** The automation layer — usually the most brittle,
  most-changed code — becomes a visual flow anyone on the team can edit.
- **400+ integrations for free.** Because n8n already speaks to Slack, Sheets,
  Telegram, databases and AI, your sensor instantly plugs into your whole stack.
- **Real-time both ways.** Sense → decide → act → notify, in seconds, with the
  human in the loop on mobile when it matters.

## Try the pattern in minutes

1. Connect a device (the platform sends copy-paste ESP32/Pi code).
2. Add a dashboard widget to see it live — on web and mobile.
3. In IoTFlow → **Automations**, point a device event at an n8n **Webhook**.
4. Build the action in n8n and hit **Test**.

> IoT platform senses. n8n decides and acts. Mobile keeps you in control.
> That's a complete, low-code IoT solution — without the heavyweight complexity.

Happy building! 🚀
`,
  },
];

async function main() {
  // Idempotent: skip if the blog already has posts (safe to run on every deploy).
  // Set BLOG_SEED_FORCE=1 to wipe and reseed.
  const force = process.env.BLOG_SEED_FORCE === "1";
  const existing = await prisma.blogPost.count().catch(() => -1);
  if (existing === -1) {
    console.warn("[blog-seed] blog tables not ready — skipping.");
    return;
  }
  if (existing > 0 && !force) {
    console.log(`[blog-seed] ${existing} post(s) already present — skipping (BLOG_SEED_FORCE=1 to reseed).`);
    return;
  }

  // Author the posts as the first admin (falls back to the demo admin).
  const admin =
    (await prisma.user.findUnique({ where: { email: "admin@demo.io" } })) ??
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }));
  if (!admin) {
    console.warn("[blog-seed] no admin user yet — skipping blog seed.");
    return;
  }

  if (force) {
    await prisma.blogReview.deleteMany();
    await prisma.blogPost.deleteMany();
    await prisma.blogTag.deleteMany();
    await prisma.blogCategory.deleteMany();
  }

  const catByName: Record<string, string> = {};
  for (const name of CATEGORIES) {
    const c = await prisma.blogCategory.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
    catByName[name] = c.id;
  }

  for (const p of POSTS) {
    const tagIds: string[] = [];
    for (const t of p.tags) {
      const tag = await prisma.blogTag.upsert({
        where: { slug: slugify(t) },
        update: {},
        create: { name: t, slug: slugify(t) },
      });
      tagIds.push(tag.id);
    }
    await prisma.blogPost.create({
      data: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.body(p.flow),
        coverImage: p.flow,
        published: true,
        featured: p === POSTS[0],
        likes: p.likes,
        authorId: admin.id,
        categoryId: catByName[p.category],
        tags: { connect: tagIds.map((id) => ({ id })) },
        reviews: {
          create: [
            { rating: 5, name: "Maker Mike", comment: "Followed this end-to-end — worked first try!" },
            { rating: 4, name: "Priya", comment: "Great write-up. Added a second sensor easily." },
          ],
        },
      },
    });
    console.log("  ✓", p.title);
  }
  console.log(`Seeded ${POSTS.length} posts, ${CATEGORIES.length} categories.`);
}

// Never exit non-zero — this runs in the container start chain and must not
// block the server from starting if seeding hiccups.
main().catch((e) => { console.error("[blog-seed]", e); }).finally(() => prisma.$disconnect());
