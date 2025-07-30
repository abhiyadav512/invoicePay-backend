const PDFDocument = require('pdfkit');

exports.generateInvoicePdf = async (invoice, senderCompany = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });
      const chunks = [];

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on('error', reject);

      generateTemplateInvoice(doc, invoice, senderCompany);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

function generateTemplateInvoice(doc, invoice, senderCompany) {
  const path = './assets/NotoSans.ttf';
  doc.font(path);
  const primaryBlue = '#1e40af';
  const lightBlue = '#dbeafe';
  const darkGray = '#374151';
  const lightGray = '#9ca3af';

  // Header with geometric pattern background (simplified)
  drawHeaderBackground(doc);

  // Company Information (Top Left)
  generateCompanyHeader(doc, senderCompany, darkGray, lightGray);

  // Invoice Title (Top Right) - Adjusted position and size
  doc
    .fontSize(28) // Reduced font size from 36
    .fillColor(primaryBlue)
    .text('InvoicePay', 400, 80, {
      // Moved down and left slightly
      align: 'right',
      lineBreak: false
    });

  // Invoice Details Section
  generateInvoiceDetailsSection(doc, invoice, darkGray, lightGray);

  // Bill To and Ship To sections (reduced height)
  generateBillingSection(doc, invoice, primaryBlue, darkGray, lightGray);

  // Items Table with increased row height and pagination support
  const tableEndY = generateItemsTableTemplate(
    doc,
    invoice,
    primaryBlue,
    lightBlue,
    darkGray
  );

  // Totals and Terms (without Balance Due)
  generateTotalsAndTerms(
    doc,
    invoice,
    primaryBlue,
    lightBlue,
    darkGray,
    lightGray,
    tableEndY
  );

  // InvoicePay attribution footer
  generateInvoicePayFooter(doc, lightGray);
}

function drawHeaderBackground(doc) {
  // Simple geometric elements to match template style
  doc.save();

  // Light blue geometric shapes (simplified version)
  doc
    .fillColor('#e0f2fe')
    .polygon([500, 20], [550, 20], [550, 70], [520, 70])
    .fill();

  doc.fillColor('#0ea5e9').polygon([480, 40], [520, 40], [500, 80]).fill();

  doc.restore();
}

function generateCompanyHeader(doc, senderCompany, darkGray, lightGray) {
  // Extract business information with fallbacks
  const companyName = senderCompany.name || 'Your Business Name';
  const address1 = senderCompany.address1 || '';
  const address2 = senderCompany.address2 || '';
  const address3 = senderCompany.address3 || '';
  const phone = senderCompany.phone || '';
  const email = senderCompany.email || '';
  const taxId = senderCompany.taxId || '';

  // Company name
  doc.fontSize(18).fillColor(darkGray).text(companyName, 50, 60);

  let currentY = 85;

  // Address lines (only show if they exist)
  if (address1) {
    doc.fontSize(10).fillColor(lightGray).text(address1, 50, currentY);
    currentY += 15;
  }

  if (address2) {
    doc.fontSize(10).fillColor(lightGray).text(address2, 50, currentY);
    currentY += 15;
  }

  if (address3) {
    doc.fontSize(10).fillColor(lightGray).text(address3, 50, currentY);
    currentY += 15;
  }

  // Contact information
  if (phone) {
    doc.fontSize(10).fillColor(lightGray).text(`Phone: ${phone}`, 50, currentY);
    currentY += 15;
  }

  if (email) {
    doc.fontSize(10).fillColor(lightGray).text(`Email: ${email}`, 50, currentY);
    currentY += 15;
  }

  // Tax ID (GST, VAT, etc.)
  if (taxId) {
    doc
      .fontSize(10)
      .fillColor(lightGray)
      .text(`Tax ID: ${taxId}`, 50, currentY);
    currentY += 15;
  }
}

function generateInvoiceDetailsSection(doc, invoice, darkGray, lightGray) {
  const startY = 180; // Increased from 160 to accommodate larger company header

  // Create the details box with border
  doc.rect(50, startY, 495, 80).stroke('#d1d5db');

  // Left column
  doc
    .fontSize(10)
    .fillColor(lightGray)
    .text('Invoice#', 70, startY + 15)
    .text('Invoice Date', 70, startY + 30)
    .text('Terms', 70, startY + 45)
    .text('Due Date', 70, startY + 60);

  // Use formattedInvoiceNumber if available, otherwise fall back to invoiceNumber or id
  const displayInvoiceNumber =
    invoice.formattedInvoiceNumber ||
    `INV-${String(invoice.invoiceNumber).padStart(3, '0')}` ||
    invoice.id ||
    'INV-000001';

  doc
    .fontSize(10)
    .fillColor(darkGray)
    .text(displayInvoiceNumber, 150, startY + 15)
    .text(
      new Date(
        invoice.createdAt || invoice.invoiceDate || Date.now()
      ).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      }),
      150,
      startY + 30
    )
    .text(invoice.terms || 'Due on Receipt', 150, startY + 45)
    .text(
      new Date(invoice.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      }),
      150,
      startY + 60
    );

  // Right column - Additional invoice details
  doc
    .fontSize(10)
    .fillColor(lightGray)
    .text('Currency', 350, startY + 15)
    .text('Status', 350, startY + 30);

  doc
    .fontSize(10)
    .fillColor(darkGray)
    .text(invoice.currency || 'INR', 420, startY + 15)
    .text(invoice.status || 'UNPAID', 420, startY + 30);
}

function generateBillingSection(
  doc,
  invoice,
  primaryBlue,
  darkGray,
  lightGray
) {
  const startY = 280; // Adjusted for new layout

  // Bill To header with background
  doc.rect(50, startY, 245, 18).fill('#f3f4f6');
  doc.fillColor(darkGray).text('Bill To', 60, startY + 4);

  // Bill To content
  doc
    .fontSize(11)
    .fillColor(darkGray)
    .text(invoice.clientName, 60, startY + 25);

  doc
    .fontSize(9)
    .fillColor(lightGray)
    .text(invoice.clientEmail, 60, startY + 42);

  // Add client phone if available
  if (invoice.clientPhone) {
    doc
      .fontSize(9)
      .fillColor(lightGray)
      .text(invoice.clientPhone, 60, startY + 57);
  }

  // Add client address if available
  if (invoice.clientAddress) {
    doc
      .fontSize(9)
      .fillColor(lightGray)
      .text(
        invoice.clientAddress,
        60,
        startY + (invoice.clientPhone ? 72 : 57),
        {
          width: 220
        }
      );
  }

  // Business Info section (right side)
  doc.rect(300, startY, 245, 18).fill('#f3f4f6');
  doc.fillColor(darkGray).text('From', 310, startY + 4);

  // Business details (right side summary)
  if (invoice.business) {
    doc
      .fontSize(10)
      .fillColor(darkGray)
      .text(invoice.business.name, 310, startY + 25);

    if (invoice.business.email) {
      doc
        .fontSize(9)
        .fillColor(lightGray)
        .text(invoice.business.email, 310, startY + 42);
    }

    if (invoice.business.phone) {
      doc
        .fontSize(9)
        .fillColor(lightGray)
        .text(invoice.business.phone, 310, startY + 57);
    }
  }
}

function generateItemsTableTemplate(doc, invoice, primaryBlue) {
  const tableTop = 380; // Adjusted for new layout
  const tableWidth = 495;
  const rowHeight = 25; // Increased row height
  const maxItemsPerPage = 6; // Reduced to accommodate larger rows
  let currentPage = 1;

  // Table header background
  doc.rect(50, tableTop, tableWidth, 30).fill(primaryBlue);

  // Table border
  doc.rect(50, tableTop, tableWidth, 30).stroke('#ffffff');

  // Header text with proper column widths
  doc
    .fontSize(11)
    .fillColor('#ffffff')
    .text('#', 60, tableTop + 10, { width: 25 })
    .text('Item & Description', 90, tableTop + 10, { width: 250 })
    .text('Qty', 350, tableTop + 10, { width: 40, align: 'center' })
    .text('Amount', 470, tableTop + 10, { width: 70, align: 'center' });

  // Table rows
  let currentY = tableTop + 40;
  let itemsProcessed = 0;

  invoice.items.forEach((item, index) => {
    // Handle different item structure (your schema vs template expectations)
    const qty = item.quantity || 1;
    const amount = item.amount;

    // Convert amounts from paise to rupees if needed (assuming amounts are in paise)
    const displayAmount = amount;

    // Check if we need a new page
    if (itemsProcessed >= maxItemsPerPage && index < invoice.items.length - 1) {
      doc.addPage();
      currentPage++;
      itemsProcessed = 0;

      // Redraw table header on new page
      currentY = 80;
      doc.rect(50, currentY - 30, tableWidth, 30).fill(primaryBlue);
      doc.rect(50, currentY - 30, tableWidth, 30).stroke('#ffffff');

      doc
        .fontSize(11)
        .fillColor('#ffffff')
        .text('#', 60, currentY - 20, { width: 25 })
        .text('Item & Description', 90, currentY - 20, { width: 250 })
        .text('Qty', 350, currentY - 20, { width: 40, align: 'center' })
        .text('Amount', 470, currentY - 20, { width: 70, align: 'center' });
    }

    // Row background (alternating)
    if (index % 2 === 0) {
      doc.rect(50, currentY - 5, tableWidth, rowHeight).fill('#f9fafb');
    }

    // Row borders
    doc.rect(50, currentY - 5, tableWidth, rowHeight).stroke('#e5e7eb');

    // Row content
    doc
      .fontSize(10)
      .fillColor('#1f2937')
      .text((index + 1).toString(), 60, currentY, { width: 25 })
      .text(item.description || item.name || 'Item', 90, currentY, {
        width: 250
      });

    doc
      .fontSize(10)
      .fillColor('#1f2937')
      .text(qty.toString(), 350, currentY, { width: 40, align: 'center' })
      .text(`₹${displayAmount.toFixed(2)}`, 470, currentY, {
        width: 70,
        align: 'center'
      });

    currentY += rowHeight;
    itemsProcessed++;
  });

  // Final table border
  const finalTableHeight = itemsProcessed * rowHeight + 40;
  const tableStartY = currentPage > 1 ? 50 : tableTop;
  doc.rect(50, tableStartY, tableWidth, finalTableHeight).stroke('#d1d5db');

  return currentY;
}

function generateTotalsAndTerms(
  doc,
  invoice,
  primaryBlue,
  lightBlue,
  darkGray,
  lightGray,
  tableEndY
) {
  const startY = tableEndY + 20;

  // Left side - Terms & Conditions
  doc
    .fontSize(10)
    .fillColor(lightGray)
    .text('Thank you for your business!', 60, startY);

  doc
    .fontSize(12)
    .fillColor(darkGray)
    .text('Terms & Conditions', 60, startY + 25);

  doc
    .fontSize(9)
    .fillColor(lightGray)
    .text('Payment is due within 30 days of invoice date.', 60, startY + 45, {
      width: 300
    })
    .text('Late payments may incur additional charges.', 60, startY + 60, {
      width: 300
    })
    .text(
      'Please include invoice number in payment reference.',
      60,
      startY + 75,
      {
        width: 300
      }
    );

  // Right side - Totals box
  const totalsX = 350;
  const totalsWidth = 195;

  // Totals background
  doc.rect(totalsX, startY + 20, totalsWidth, 100).fill(lightBlue);
  doc.rect(totalsX, startY + 20, totalsWidth, 100).stroke('#cbd5e1');

  // Calculate totals (convert from paise to rupees)

  const total = invoice.total;

  let totalsY = startY + 35;

  // Total line
  doc.rect(totalsX + 15, totalsY - 5, totalsWidth - 30, 1).fill(darkGray);

  doc
    .fontSize(14)
    .fillColor(primaryBlue)
    .text('Total:', totalsX + 15, totalsY + 10)
    .text(`₹${total.toFixed(2)}`, totalsX + 120, totalsY + 10, {
      align: 'right',
      width: 60
    });

  // Payment link note
  if (invoice.paymentLink) {
    doc
      .fontSize(8)
      .fillColor(lightGray)
      .text(
        'Scan QR code or use payment link to pay online',
        totalsX + 15,
        totalsY + 35,
        {
          width: totalsWidth - 30,
          align: 'center'
        }
      );
  }
}

function generateInvoicePayFooter(doc, lightGray) {
  // InvoicePay attribution at the bottom
  doc
    .fontSize(8)
    .fillColor(lightGray)
    .text('Generated by InvoicePay - Professional Invoice Solution', 50, 750, {
      align: 'center',
      width: 495
    })
    .text(`Created on ${new Date().toLocaleDateString('en-IN')}`, 50, 765, {
      align: 'center',
      width: 495
    });
}
