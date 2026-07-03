-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN     "mqttBrokerUrl" TEXT,
ADD COLUMN     "mqttPassword" TEXT,
ADD COLUMN     "mqttPublicHost" TEXT,
ADD COLUMN     "mqttUsername" TEXT,
ADD COLUMN     "n8nApiKey" TEXT,
ADD COLUMN     "n8nBaseUrl" TEXT;
