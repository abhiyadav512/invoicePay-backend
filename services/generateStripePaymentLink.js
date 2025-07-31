const Stripe = require('stripe');
const stripeClient = Stripe(process.env.STRIPE_SECRET_KEY);

exports.generateStripePaymentLink = async ({
  amount,
  email,
  metadata,
  currency
}) => {
  try {
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency?.toLowerCase() || 'inr',
            product_data: {
              name: `Invoice ID-${metadata.invoiceId}`,
              description: `Payment for Invoice -${metadata.invoiceNumber}`
            },
            unit_amount: amount * 100
          },
          quantity: 1
        }
      ],
      customer_email: email,
      metadata: {
        invoiceId: metadata.invoiceId.toString(),
        item: metadata.item
      },
      success_url: `${process.env.FRONTEND_URL || 'https://abhishek512.vercel.app/payment-sucess'}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://your-domain.com'}/payment-cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours from now
    });

    return {
      url: session.url,
      id: session.id
    };
  } catch (error) {
    // console.error('Error creating Stripe checkout session:', error);
    // throw error;
  }
};
