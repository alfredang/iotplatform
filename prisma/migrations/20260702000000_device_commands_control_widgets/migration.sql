-- AlterEnum — add control widget types (Blynk-style)
ALTER TYPE "WidgetType" ADD VALUE IF NOT EXISTS 'BUTTON';
ALTER TYPE "WidgetType" ADD VALUE IF NOT EXISTS 'SLIDER';
ALTER TYPE "WidgetType" ADD VALUE IF NOT EXISTS 'SWITCH';
ALTER TYPE "WidgetType" ADD VALUE IF NOT EXISTS 'TERMINAL';
ALTER TYPE "WidgetType" ADD VALUE IF NOT EXISTS 'LED';

-- CreateTable
CREATE TABLE "DeviceCommand" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "strValue" TEXT,
    "source" TEXT NOT NULL DEFAULT 'dashboard',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceCommand_deviceId_idx" ON "DeviceCommand"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCommand_deviceId_pin_key" ON "DeviceCommand"("deviceId", "pin");

-- AddForeignKey
ALTER TABLE "DeviceCommand" ADD CONSTRAINT "DeviceCommand_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AutomationEvent" AS ENUM ('TELEMETRY', 'ALERT', 'DEVICE_ONLINE', 'DEVICE_OFFLINE', 'COMMAND');

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "event" "AutomationEvent" NOT NULL,
    "deviceId" TEXT,
    "metric" TEXT,
    "n8nWebhookUrl" TEXT NOT NULL,
    "n8nWorkflowId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFiredAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Automation_ownerId_idx" ON "Automation"("ownerId");

-- CreateIndex
CREATE INDEX "Automation_projectId_idx" ON "Automation"("projectId");

-- CreateIndex
CREATE INDEX "Automation_event_idx" ON "Automation"("event");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
