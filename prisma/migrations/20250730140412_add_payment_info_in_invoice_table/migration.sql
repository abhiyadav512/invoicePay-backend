/*
  Warnings:

  - Added the required column `metadata` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripePaymentIntentId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeSessionId` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "metadata" TEXT NOT NULL,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "stripePaymentIntentId" TEXT NOT NULL,
ADD COLUMN     "stripeSessionId" TEXT NOT NULL;
