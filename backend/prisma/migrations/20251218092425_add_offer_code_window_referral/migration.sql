/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `OfferCode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OfferCode" DROP COLUMN "expiresAt",
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
