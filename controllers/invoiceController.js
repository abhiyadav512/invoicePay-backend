require('dotenv').config('');
const prisma = require('../config/db');
const {
  generateStripePaymentLink
} = require('../services/generateStripePaymentLink');
const { sendInvoiceEmail } = require('../services/sendInvoiceEmail');
const sendResponse = require('../helper/sendResponse');
const Stripe = require('stripe');
const { generateInvoicePdf } = require('../services/generateInvoicePdf');
const getNextInvoiceNumber = require('../helper/getNextInvoiceNumber');
const generateFormattedInvoiceNumber = require('../helper/generateFormattedInvoiceNumber');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createInvoice = async (req, res, next) => {
  const { clientName, clientEmail, currency, dueDate, items, quantity } =
    req.body;

  if (!items || items.length === 0) {
    return sendResponse(
      res,
      400,
      false,
      'Invoice must have at least one item.'
    );
  }

  try {
    const userBusiness = await prisma.business.findUnique({
      where: { ownerId: req.user.id }
    });

    if (!userBusiness) {
      return sendResponse(
        res,
        403,
        false,
        'Business setup required. Please complete your business profile first.'
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const nextInvoiceNumber = await getNextInvoiceNumber(req.user.id);

      const formattedInvoiceNumber = generateFormattedInvoiceNumber(
        req.user.id,
        nextInvoiceNumber,
        userBusiness.name
      );

      const total = items.reduce((sum, item) => sum + item.amount, 0);

      const invoice = await tx.invoice.create({
        data: {
          clientName,
          clientEmail,
          currency: currency || userBusiness.defaultCurrency || 'INR',
          dueDate: new Date(dueDate),
          total,
          invoiceNumber: nextInvoiceNumber,
          user: {
            connect: { id: req.user.id }
          },
          business: {
            connect: { id: userBusiness.id }
          },
          items: {
            create: items.map(({ description, amount, quantity }) => ({
              description,
              amount,
              quantity
            }))
          }
        },
        include: {
          items: true,
          business: true
        }
      });

      return { invoice, formattedInvoiceNumber };
    });

    const { invoice, formattedInvoiceNumber } = result;

    // Generate Stripe payment link
    let paymentLink, paymentLinkId;

    try {
      const { url, id } = await generateStripePaymentLink({
        amount: invoice.total,
        email: clientEmail,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: formattedInvoiceNumber
        },
        currency: invoice.currency
      });

      paymentLink = url;
      paymentLinkId = id;
    } catch (err) {
      // If payment link generation fails, delete the created invoice
      await prisma.invoice.delete({ where: { id: invoice.id } });
      return sendResponse(
        res,
        500,
        false,
        'Failed to generate payment link. Please try again later.',
        { error: err.message }
      );
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paymentLink, paymentLinkId },
      include: {
        items: true,
        business: true
      }
    });

    // Use business info as sender company (fallback to default if needed)
    const senderCompany = {
      name: updatedInvoice.business.name,
      address1: updatedInvoice.business.address || '',
      address2: `${updatedInvoice.business.city || ''}${updatedInvoice.business.state ? ', ' + updatedInvoice.business.state : ''}`,
      address3: `${updatedInvoice.business.country || 'India'} ${updatedInvoice.business.postalCode || ''}`,
      phone: updatedInvoice.business.phone,
      email: updatedInvoice.business.email,
      taxId: updatedInvoice.business.taxId
    };

    // Generate PDF with business information
    const pdfBuffer = await generateInvoicePdf(
      { ...updatedInvoice, formattedInvoiceNumber },
      senderCompany
    );

    const senderUser = req.user;
    // Send invoice email
    await sendInvoiceEmail(
      clientEmail,
      clientName,
      paymentLink,
      { ...updatedInvoice, formattedInvoiceNumber },
      senderUser,
      pdfBuffer
    );

    const responseData = {
      id: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      formattedInvoiceNumber,
      clientName,
      clientEmail,
      currency: updatedInvoice.currency,
      total: updatedInvoice.total,
      status: updatedInvoice.status,
      dueDate: updatedInvoice.dueDate,
      paymentLink,
      business: {
        id: updatedInvoice.business.id,
        name: updatedInvoice.business.name,
        email: updatedInvoice.business.email
      },
      items: updatedInvoice.items.map(({ id, description, amount }) => ({
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
    // console.error('Create invoice error:', error);
    next(error);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  const { invoiceId } = req.params;
  const userId = req.user.id;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: userId // Ensure user can only delete their own invoices
      }
    });

    if (!invoice) {
      return sendResponse(res, 404, false, 'Invoice not found');
    }

    if (invoice.status === 'PAID') {
      return sendResponse(res, 400, false, 'Cannot delete a paid invoice');
    }

    // Deactivate Stripe payment link if exists
    if (invoice.paymentLinkId) {
      try {
        await stripe.paymentLinks.update(invoice.paymentLinkId, {
          active: false
        });
      } catch (stripeError) {
        // console.error('Stripe error:', stripeError);
      }
    }

    // Delete invoice (items will be deleted due to cascade)
    await prisma.invoice.delete({
      where: { id: invoiceId }
    });

    return sendResponse(res, 200, true, 'Invoice and payment link deleted');
  } catch (error) {
    // console.error('Delete invoice error:', error);
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  const { invoiceId } = req.params;
  const userId = req.user.id;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: userId
      },
      include: {
        items: true,
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            number: true,
            address: true,
            city: true,
            owner: true,
            country: true,
            logo: true,
            state: true,
            postalCode: true
          }
        }
      }
    });

    if (!invoice) {
      return sendResponse(res, 404, false, 'Invoice not found.');
    }

    // Generate formatted invoice number for display
    const formattedInvoiceNumber = generateFormattedInvoiceNumber(
      userId,
      invoice.invoiceNumber,
      invoice.business.name
    );

    const {
      id,
      clientName,
      clientEmail,
      currency,
      total,
      status,
      dueDate,
      pdfUrl,
      items,
      invoiceNumber,
      business,
      paymentLink
    } = invoice;

    const sanitizedInvoice = {
      id,
      invoiceNumber,
      formattedInvoiceNumber,
      clientName,
      clientEmail,
      currency,
      total,
      status,
      dueDate,
      pdfUrl,
      paymentLink,
      business: {
        id: business.id,
        name: business.name,
        email: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        owner: business.owner,
        country: business.country,
        logo: business.logo,
        state: business.state,
        postalCode: business.postalCode
      },
      items: items.map(({ id, description, amount, quantity }) => ({
        id,
        description,
        amount,
        quantity
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
    // console.error('Get invoice by ID error:', error);
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
        include: {
          items: true,
          business: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { invoiceNumber: 'desc' }
      }),
      prisma.invoice.count({
        where: { userId }
      })
    ]);

    if (invoices.length === 0) {
      return sendResponse(res, 200, true, 'No invoices found.', {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      });
    }

    const sanitizedInvoices = invoices.map((invoice) => {
      const formattedInvoiceNumber = generateFormattedInvoiceNumber(
        userId,
        invoice.invoiceNumber,
        invoice.business.name
      );

      const {
        id,
        clientName,
        clientEmail,
        currency,
        total,
        status,
        dueDate,
        pdfUrl,
        items,
        invoiceNumber,
        business,
        paymentLink,
        createdAt
      } = invoice;

      return {
        id,
        invoiceNumber,
        formattedInvoiceNumber,
        clientName,
        clientEmail,
        currency,
        total,
        status,
        dueDate,
        pdfUrl,
        paymentLink,
        createdAt,
        business: {
          id: business.id,
          name: business.name,
          email: business.email
        },
        items: items.map(({ id, description, amount, quantity }) => ({
          id,
          description,
          amount,
          quantity
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
    // console.error('Get invoices error:', error);
    next(error);
  }
};
