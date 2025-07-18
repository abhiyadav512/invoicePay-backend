const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.generateStripePaymentLink = async ({
  amount,
  email,
  metadata,
  currency
}) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: currency || 'inr',
          product_data: {
            name: 'Invoice Payment'
          },
          unit_amount: amount * 100 // amount in paise (for INR)
        },
        quantity: 1
      }
    ],
    customer_email: email,
    metadata,
    success_url:
      'https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://your-domain.com/cancel'
  });

  return {
    url: session.url,
    id: session.id
  };
};
