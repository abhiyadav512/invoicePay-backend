const generateFormattedInvoiceNumber = (
  userId,
  invoiceNumber,
  businessName
) => {
  const userPrefix = userId.substring(0, 8).toUpperCase();
  const businessPrefix = businessName
    ? businessName
        .substring(0, 6)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
    : 'BIZ';

  // Format: INV-BUSINESS-001 or INV-USERPREFIX-001
  return `INV-${businessPrefix}-${invoiceNumber.toString().padStart(3, '0')}`;
};
module.exports = generateFormattedInvoiceNumber;
