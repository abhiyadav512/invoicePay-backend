require('dotenv').config('');
const prisma = require('../config/db');
const {
  generateStripePaymentLink
} = require('../services/generateStripePaymentLink');
const { sendInvoiceEmail } = require('../services/sendInvoiceEmail');
const sendResponse = require('../helper/sendResponse');
const Stripe = require('stripe');
const { generateInvoicePdf } = require('../services/generateInvoicePdf');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createInvoice = async (req, res, next) => {
  const { clientName, clientEmail, currency, dueDate, items } = req.body;

  if (!items || items.length === 0) {
    return sendResponse(
      res,
      400,
      false,
      'Invoice must have at least one item.'
    );
  }

  try {
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    // Create invoice WITHOUT paymentLink
    const invoice = await prisma.invoice.create({
      data: {
        clientName,
        clientEmail,
        currency: currency || 'INR',
        dueDate: new Date(dueDate),
        total,
        user: {
          connect: { id: req.user.id }
        },
        items: {
          create: items.map(({ description, amount }) => ({
            description,
            amount
          }))
        }
      },
      include: { items: true }
    });

    // Generate Stripe payment link
    let paymentLink, paymentLinkId;

    try {
      const { url, id } = await generateStripePaymentLink({
        amount: total,
        email: clientEmail,
        metadata: {
          invoiceId: invoice.id
        },
        currency
      });
      // console.log("user",url,"id",id);
      paymentLink = url;
      paymentLinkId = id;
    } catch (err) {
      // If payment link generation fails, delete the created invoice to avoid inconsistent state
      await prisma.invoice.delete({ where: { id: invoice.id } });
      return sendResponse(
        res,
        500,
        false,
        'Failed to generate payment link. Please try again later.',
        { date: err }
      );
    }

    // Update invoice with payment link
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paymentLink, paymentLinkId },
      include: { items: true }
    });

    const senderCompany = {
      name: 'Zylker Electronics Hub',
      address1: '14B, Northern Street',
      address2: 'Greater South Avenue',
      address3: 'New York New York 10001',
      country: 'U.S.A'
    };

    const pdfBuffer = await generateInvoicePdf(updatedInvoice, senderCompany);

    const senderUser = req.user;
    // Send invoice email
    await sendInvoiceEmail(
      clientEmail,
      clientName,
      paymentLink,
      updatedInvoice,
      senderUser,
      pdfBuffer
    );

    const {
      id,
      currency: finalCurrency,
      total: finalTotal,
      status,
      dueDate: finalDueDate,
      pdfUrl,
      items: invoiceItems
    } = updatedInvoice;

    const responseData = {
      id,
      clientName,
      clientEmail,
      currency: finalCurrency,
      total: finalTotal,
      status,
      dueDate: finalDueDate,
      pdfUrl,
      paymentLink,
      items: invoiceItems.map(({ id, description, amount }) => ({
        id,
        description,
        amount
      }))
    };

    // Respond with updated invoice (with paymentLink)
    sendResponse(
      res,
      201,
      true,
      'Invoice created and email sent.',
      responseData
    );
  } catch (error) {
    // console.error(error);
    next(error);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  const { invoiceId } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(invoiceId) }
    });
    if (!invoice) {
      return sendResponse(res, 404, false, 'Invoice not found');
    }

    if (invoice.status === 'PAID') {
      return sendResponse(res, 400, false, 'Cannot delete a paid invoice');
    }

    if (invoice.paymentLinkId) {
      try {
        await stripe.paymentLinks.update(invoice.paymentLinkId, {
          active: false
        });
      } catch (stripeError) {
        next(stripeError.message);
      }
    }

    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: Number(invoiceId) }
    });

    await prisma.invoice.delete({
      where: { id: Number(invoiceId) }
    });
    return sendResponse(res, 200, true, 'Invoice and payment link deleted');
  } catch (error) {
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  const { invoiceId } = req.params;
  const userId = req.user.id;
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: Number(invoiceId), userId: userId },
      include: { items: true }
    });
    if (!invoice) {
      return sendResponse(res, 404, false, 'Invoice not found.');
    }
    const {
      id,
      clientName,
      clientEmail,
      currency,
      total,
      status,
      dueDate,
      pdfUrl,
      items
    } = invoice;

    const sanitizedInvoice = {
      id,
      clientName,
      clientEmail,
      currency,
      total,
      status,
      dueDate,
      pdfUrl,
      items: items.map(({ id, description, amount }) => ({
        id,
        description,
        amount
      }))
    };

    return sendResponse(
      res,
      200,
      true,
      'Invoice retrieved successfully.',
      sanitizedInvoice
    );
  } catch (error) {
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        include: { items: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' } // optional sorting
      }),
      prisma.invoice.count({
        where: { userId }
      })
    ]);

    if (invoices.length === 0) {
      return sendResponse(res, 200, true, 'No invoices found.', []);
    }

    const sanitizedInvoices = invoices.map((invoice) => {
      const {
        id,
        clientName,
        clientEmail,
        currency,
        total,
        status,
        dueDate,
        pdfUrl,
        items
      } = invoice;

      return {
        id,
        clientName,
        clientEmail,
        currency,
        total,
        status,
        dueDate,
        pdfUrl,
        items: items.map(({ id, description, amount }) => ({
          id,
          description,
          amount
        }))
      };
    });

    return sendResponse(res, 200, true, 'Invoices retrieved successfully.', {
      data: sanitizedInvoices,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
