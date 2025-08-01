/*
  Warnings:

  - The primary key for the `Invoice` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Invoice_id_seq";

-- AlterTable
ALTER TABLE "InvoiceItem" ALTER COLUMN "invoiceId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
