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
  generateCompanyHeader(doc, senderCompany, darkGray);

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

function generateCompanyHeader(doc, senderCompany, darkGray) {
  const companyName = senderCompany.name || 'Your Company Name';
  const address1 = senderCompany.address1 || '123 Business Street';
  const address2 = senderCompany.address2 || 'City, State 12345';
  const country = senderCompany.country || 'Country';

  doc.fontSize(18).fillColor(darkGray).text(companyName, 50, 60);

  doc
    .fontSize(10)
    .fillColor('#6b7280')
    .text(address1, 50, 85)
    .text(address2, 50, 100)
    .text(country, 50, 115);
}

function generateInvoiceDetailsSection(doc, invoice, darkGray, lightGray) {
  const startY = 160;

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

  doc
    .fontSize(10)
    .fillColor(darkGray)
    .text(invoice.invoiceNumber || invoice.id || 'INV-000001', 150, startY + 15)
    .text(
      new Date(invoice.invoiceDate || Date.now()).toLocaleDateString('en-US', {
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
}

function generateBillingSection(doc, invoice, darkGray, lightGray) {
  const startY = 260;

  doc
    .fontSize(10)
    .fillColor(darkGray)
    .text('Bill To', 60, startY + 4);

  //   // Ship To header
  //   doc.rect(300, startY, 245, 18).fill('#f3f4f6');

  //   doc.fillColor(darkGray).text('Ship To', 310, startY + 4);

  // Bill To content
  doc
    .fontSize(9)
    .fillColor(darkGray)
    .text(invoice.clientName, 60, startY + 22);

  doc
    .fontSize(8)
    .fillColor(lightGray)
    .text(invoice.clientAddress || invoice.clientEmail, 60, startY + 35, {
      width: 220
    });

  // Ship To content (same as Bill To if not provided)
  //   const shipTo = invoice.shipTo || {
  //     name: invoice.clientName,
  //     address: invoice.clientAddress || invoice.clientEmail
  //   };

  //   doc
  //     .fontSize(8)
  //     .fillColor(lightGray)
  //     .text(shipTo.address || shipTo.name, 310, startY + 22, { width: 220 });
}

function generateItemsTableTemplate(doc, invoice, primaryBlue, darkGray) {
  const tableTop = 340;
  const tableWidth = 495;
  const rowHeight = 20;
  const maxItemsPerPage = 8;
  let currentPage = 1;

  // Table header background
  doc.rect(50, tableTop, tableWidth, 30).fill(primaryBlue);

  // Table border
  doc.rect(50, tableTop, tableWidth, 30).stroke('#ffffff');

  // Header text with wider "Item & Description" column
  doc
    .fontSize(11)
    .fillColor('#ffffff')
    .text('#', 60, tableTop + 10)
    .text('Item & Description', 85, tableTop + 10, { width: 250 })
    .text('Qty', 350, tableTop + 10, { width: 40, align: 'right' })
    .text('Rate', 400, tableTop + 10, { width: 60, align: 'right' })
    .text('Amount', 470, tableTop + 10, { width: 70, align: 'right' });

  // Table rows
  let currentY = tableTop + 40;
  let itemsProcessed = 0;

  invoice.items.forEach((item, index) => {
    const qty = item.quantity || 1;
    const rate = item.rate || item.amount;
    const amount = qty * rate;

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
        .text('#', 60, currentY - 20)
        .text('Item & Description', 85, currentY - 20, { width: 320 })
        .text('Qty', 420, currentY - 20)
        .text('Rate', 460, currentY - 20)
        .text('Amount', 500, currentY - 20);
    }

    // Row background (alternating)
    if (index % 2 === 0) {
      doc.rect(50, currentY - 5, tableWidth, rowHeight).fill('#f9fafb');
    }

    // Row content with wider description area
    doc
      .fontSize(10)
      .fillColor('#1f2937')
      .text((index + 1).toString(), 60, currentY)
      .text(item.name || item.description, 85, currentY, { width: 250 });

    // Item description/subtitle with more space
    if (item.description && item.name) {
      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .text(item.description, 85, currentY + 12, { width: 250 });
    }

    doc
      .fontSize(10)
      .fillColor('#1f2937')
      .text(qty.toFixed(2), 350, currentY, { width: 40, align: 'right' })
      .text(`₹${rate.toFixed(2)}`, 400, currentY, { width: 60, align: 'right' })
      .text(`₹${amount.toFixed(2)}`, 470, currentY, {
        width: 70,
        align: 'right'
      });

    currentY += rowHeight;
    itemsProcessed++;
  });

  // Table border
  const tableHeight = Math.min(
    itemsProcessed * rowHeight + 40,
    maxItemsPerPage * rowHeight + 40
  );
  const tableStartY = currentPage > 1 ? 50 : tableTop;
  doc.rect(50, tableStartY, tableWidth, tableHeight).stroke('#d1d5db');

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
    .text('Thanks for shopping with us.', 60, startY);

  doc
    .fontSize(12)
    .fillColor(darkGray)
    .text('Terms & Conditions', 60, startY + 25);

  doc
    .fontSize(9)
    .fillColor(lightGray)
    .text(
      'Full payment is due upon receipt of this invoice.',
      60,
      startY + 45,
      { width: 300 }
    )
    .text('Late payments may incur additional charges or', 60, startY + 60, {
      width: 300
    })
    .text('interest as per the applicable laws.', 60, startY + 75, {
      width: 300
    });

  // Right side - Totals box
  const totalsX = 350;
  const totalsWidth = 195;

  // Totals background - reduced height (removed Balance Due)
  doc.rect(totalsX, startY + 20, totalsWidth, 80).fill(lightBlue);

  // Total (removed Balance Due section)
  doc
    .fontSize(12)
    .fillColor(primaryBlue)
    .text('Total', totalsX + 15, startY + 75)
    .text(`₹${invoice.total.toFixed(2)}`, totalsX + 120, startY + 75);
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
    .text(`Created on ${new Date().toLocaleDateString()}`, 50, 765, {
      align: 'center',
      width: 495
    });
}
