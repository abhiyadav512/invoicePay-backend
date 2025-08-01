require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../config/db');

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (!sig) {
    return res.status(400).send('No signature');
  }

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object);
        break;
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function handleCheckoutSessionCompleted(session) {
  try {
    const invoiceId = session.metadata?.invoiceId;
    if (!invoiceId) {
      return;
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, status: true }
    });

    if (!existingInvoice || existingInvoice.status === 'PAID') return;

    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent
    );
    const temp = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        updatedAt: new Date(),
        paidDate: new Date(),
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown',
        metadata: session.metadata
      }
    });
  } catch (error) {
    // Log to monitoring system if needed
  }
}

async function handleCheckoutSessionExpired(session) {
  try {
    const invoiceId = session.metadata?.invoiceId;
    if (!invoiceId) return;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (
      invoice &&
      new Date() > invoice.dueDate &&
      invoice.status === 'UNPAID'
    ) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'OVERDUE',
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    // Log to monitoring system if needed
  }
}
