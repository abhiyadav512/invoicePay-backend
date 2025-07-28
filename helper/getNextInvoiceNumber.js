const prisma = require('../config/db');

const getNextInvoiceNumber = async (userId) => {
  const lastInvoice = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true }
  });

  return (lastInvoice?.invoiceNumber || 0) + 1;
};

module.exports = getNextInvoiceNumber;
