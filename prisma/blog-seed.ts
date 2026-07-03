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
];

async function main() {
  // Author the posts as the first admin (falls back to the demo admin).
  const admin =
    (await prisma.user.findUnique({ where: { email: "admin@demo.io" } })) ??
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }));
  if (!admin) throw new Error("No admin user found — create an admin first.");

  // Clean slate for blog data
  await prisma.blogReview.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogTag.deleteMany();
  await prisma.blogCategory.deleteMany();

  const catByName: Record<string, string> = {};
  for (const name of CATEGORIES) {
    const c = await prisma.blogCategory.create({ data: { name, slug: slugify(name) } });
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

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
