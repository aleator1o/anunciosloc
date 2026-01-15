-- CreateEnum
CREATE TYPE "MuleMessageStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "publicKey" TEXT,
ADD COLUMN     "signature" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "privateKey" TEXT,
ADD COLUMN     "publicKey" TEXT;

-- CreateTable
CREATE TABLE "MuleConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxSpaceBytes" INTEGER NOT NULL DEFAULT 10485760,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuleMessage" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "muleUserId" TEXT NOT NULL,
    "destinationUserId" TEXT NOT NULL,
    "status" "MuleMessageStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "MuleMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuleConfig_userId_key" ON "MuleConfig"("userId");

-- CreateIndex
CREATE INDEX "MuleMessage_muleUserId_status_idx" ON "MuleMessage"("muleUserId", "status");

-- CreateIndex
CREATE INDEX "MuleMessage_destinationUserId_status_idx" ON "MuleMessage"("destinationUserId", "status");

-- CreateIndex
CREATE INDEX "MuleMessage_announcementId_idx" ON "MuleMessage"("announcementId");

-- AddForeignKey
ALTER TABLE "MuleConfig" ADD CONSTRAINT "MuleConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuleMessage" ADD CONSTRAINT "MuleMessage_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuleMessage" ADD CONSTRAINT "MuleMessage_muleUserId_fkey" FOREIGN KEY ("muleUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuleMessage" ADD CONSTRAINT "MuleMessage_destinationUserId_fkey" FOREIGN KEY ("destinationUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
