const sendEmail = require('../helper/sendEmail');

exports.sendInvoiceEmail = async (
  to,
  clientName,
  paymentLink,
  invoice,
  senderUser
) => {
  const subject = `Invoice from ${senderUser.name} via InvoicePay`;

  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString(
    'en-IN',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );

  const itemListHtml = invoice.items
    .map((item) => `<li>${item.description}: ₹${item.amount.toFixed(2)}</li>`)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #004085;">Hello ${clientName},</h2>
      <p>${senderUser.name} has sent you an invoice using InvoicePay. Please find your invoice details below:</p>
      <ul>
        ${itemListHtml}
      </ul>
      <p><strong>Total Amount:</strong> ₹${invoice.total.toFixed(2)}</p>
      <p><a href="${paymentLink}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Pay Invoice</a></p>
      <p><em>Due by: ${formattedDueDate}</em></p>
      <hr />
      <p>If you have any questions, please feel free to contact ${senderUser.name} at <a href="mailto:${senderUser.email}">${senderUser.email}</a> or reply to this email.</p>
      <p>Thank you for using InvoicePay!</p>
    </div>
  `;

  await sendEmail({ to, subject, html });
};
