-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "allowAnnouncements" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;
