-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN     "gmailClientId" TEXT,
ADD COLUMN     "gmailClientSecret" TEXT,
ADD COLUMN     "gmailRefreshToken" TEXT,
ADD COLUMN     "gmailUser" TEXT;

-- Email verification is now required to sign in with a password. Grandfather
-- every pre-existing account so nobody is locked out by the new check.
UPDATE "User" SET "emailVerified" = "createdAt" WHERE "emailVerified" IS NULL;
