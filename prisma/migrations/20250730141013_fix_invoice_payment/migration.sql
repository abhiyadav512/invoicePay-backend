-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "metadata" DROP NOT NULL,
ALTER COLUMN "paymentMethod" DROP NOT NULL,
ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL,
ALTER COLUMN "stripeSessionId" DROP NOT NULL;
