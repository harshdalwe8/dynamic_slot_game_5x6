/*
  Warnings:

  - You are about to drop the column `amount` on the `PaymentLink` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `PaymentLink` table. All the data in the column will be lost.
  - You are about to drop the column `transactionNote` on the `PaymentLink` table. All the data in the column will be lost.
  - You are about to drop the column `transactionRef` on the `PaymentLink` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'SCREENSHOT_UPLOADED', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "PaymentLink_transactionRef_key";

-- AlterTable
ALTER TABLE "PaymentLink" DROP COLUMN "amount",
DROP COLUMN "currency",
DROP COLUMN "transactionNote",
DROP COLUMN "transactionRef";

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentLinkId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT E'INR',
    "transactionRef" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "status" "DepositStatus" NOT NULL DEFAULT E'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_transactionRef_key" ON "Deposit"("transactionRef");

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_paymentLinkId_fkey" FOREIGN KEY ("paymentLinkId") REFERENCES "PaymentLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
