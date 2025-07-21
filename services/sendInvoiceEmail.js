const sendEmail = require('../helper/sendEmail');

exports.sendInvoiceEmail = async (
  to,
  clientName,
  paymentLink,
  invoice,
  senderUser,
  pdfBuffer
) => {
  try {
    if (
      !to ||
      !clientName ||
      !paymentLink ||
      !invoice ||
      !senderUser ||
      !pdfBuffer
    ) {
      throw new Error('Missing required parameters to send invoice email.');
    }

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
      .map(
        (item) =>
          `<li style="margin-bottom: 5px;">${item.description}: ₹${item.amount.toFixed(2)}</li>`
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #004085;">Hello ${clientName},</h2>

        <p><strong>${senderUser.name}</strong> has sent you an invoice using <strong>InvoicePay</strong>.</p>
        
        <p><strong>Invoice Details:</strong></p>
        <ul style="padding-left: 20px;">
          ${itemListHtml}
        </ul>

        <p><strong>Total Amount:</strong> ₹${invoice.total.toFixed(2)}</p>

        <p style="margin: 20px 0;">
          <a href="${paymentLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pay Invoice</a>
        </p>

        <p><em>Due by: ${formattedDueDate}</em></p>

        <p><strong>Note:</strong> A copy of the invoice has been attached as a PDF to this email for your records.</p>

        <hr style="margin: 30px 0;" />

        <p>If you have any questions, feel free to contact ${senderUser.name} at 
        <a href="mailto:${senderUser.email}">${senderUser.email}</a> or reply to this email.</p>

        <p>Thank you for using <strong>InvoicePay</strong>!</p>
      </div>
    `;

    await sendEmail({
      to,
      subject,
      html,
      attachments: [
        {
          filename: `Invoice-${invoice.clientName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
  } catch (error) {
    // console.error('Error sending invoice email:', error.message);
    // throw error;
  }
};
