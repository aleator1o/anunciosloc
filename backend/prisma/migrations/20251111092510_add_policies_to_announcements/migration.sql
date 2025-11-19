-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('WHITELIST', 'BLACKLIST');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "policyRestrictions" JSONB,
ADD COLUMN     "policyType" "PolicyType" NOT NULL DEFAULT 'WHITELIST';
