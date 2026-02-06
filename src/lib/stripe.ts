import Stripe from 'stripe';

// Singleton Stripe instance
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY non défini');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripeInstance;
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string,
  existingCustomerId?: string | null
): Promise<string> {
  const stripe = getStripe();

  if (existingCustomerId) {
    try {
      await stripe.customers.retrieve(existingCustomerId);
      return existingCustomerId;
    } catch {
      // Customer deleted or invalid, create new
    }
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  return customer.id;
}

// ============================================================================
// SUBSCRIPTION CHECKOUT
// ============================================================================

export async function createSubscriptionCheckout(params: {
  customerId: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<string> {
  const stripe = getStripe();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: params.customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      type: 'subscription',
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    tax_id_collection: { enabled: true },
  };

  if (params.trialDays && params.trialDays > 0) {
    sessionParams.subscription_data = {
      trial_period_days: params.trialDays,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error('Impossible de créer la session de paiement');
  }

  return session.url;
}

// ============================================================================
// CUSTOMER PORTAL
// ============================================================================

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// ============================================================================
// WEBHOOK HELPERS
// ============================================================================

export function constructWebhookEvent(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(body, signature, secret);
}
