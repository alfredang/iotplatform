import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email,
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const otpRequestSchema = z.object({
  email,
  purpose: z.enum(["login", "reset"]).default("login"),
});

export const otpResetSchema = z.object({
  email,
  code: z.string().trim().length(6, "Enter the 6-digit code"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email,
  company: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export const deviceCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  type: z.string().trim().max(60).optional(),
  deviceId: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, dashes or underscores")
    .optional(),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  protocol: z.enum(["MQTT", "HTTP", "WEBSOCKET"]).default("HTTP"),
});

export const deviceUpdateSchema = deviceCreateSchema.partial();

export const alertRuleSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    deviceId: z.string().min(1, "Select a device"),
    metric: z.string().trim().max(60).optional(),
    operator: z.enum(["GT", "LT", "GTE", "LTE", "EQ", "OFFLINE"]),
    threshold: z.coerce.number().optional(),
    durationSecs: z.coerce.number().int().min(0).default(0),
    enabled: z.boolean().default(true),
  })
  .refine((d) => d.operator === "OFFLINE" || (d.metric && d.threshold !== undefined), {
    message: "Metric and threshold are required for value rules",
    path: ["threshold"],
  });

export const widgetSchema = z.object({
  dashboardId: z.string().optional(),
  type: z.enum(["NUMBER", "LINE", "BAR", "GAUGE", "STATUS", "ALERTS", "MAP"]),
  title: z.string().trim().max(120).optional(),
  deviceId: z.string().optional().nullable(),
  metric: z.string().trim().max(60).optional().nullable(),
  config: z.record(z.string(), z.any()).optional(),
});

export const apiKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const settingsSchema = z.object({
  name: z.string().trim().max(120).optional(),
  orgName: z.string().trim().max(160).optional(),
  notificationEmail: z.union([email, z.literal("")]).optional(),
  theme: z.enum(["dark", "light"]).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type DeviceCreateInput = z.infer<typeof deviceCreateSchema>;
