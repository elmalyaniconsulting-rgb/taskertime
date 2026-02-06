export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      // ====================================================================
      // SUBSCRIPTION EVENTS
      // ====================================================================

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const subscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (subscription) {
          const statusMap: Record<string, string> = {
            active: 'ACTIVE',
            trialing: 'TRIALING',
            past_due: 'PAST_DUE',
            canceled: 'CANCELLED',
            unpaid: 'UNPAID',
            incomplete: 'INCOMPLETE',
            incomplete_expired: 'CANCELLED',
            paused: 'CANCELLED',
          };

          const priceId = sub.items.data[0]?.price?.id;
          let planId = subscription.planId;

          if (priceId) {
            const plan = await prisma.plan.findFirst({
              where: {
                OR: [
                  { stripePriceMonth: priceId },
                  { stripePriceYear: priceId },
                ],
              },
            });
            if (plan) planId = plan.id;
          }

          const interval = sub.items.data[0]?.price?.recurring?.interval;
          const periodeType = interval === 'year' ? 'ANNUEL' : 'MENSUEL';

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId || undefined,
              planId,
              statut: (statusMap[sub.status] || 'ACTIVE') as any,
              periodeType: periodeType as any,
              dateDebut: new Date(sub.start_date * 1000),
              dateFin: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
              dateProchainPaiement: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
              trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              cancelledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const subscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (subscription) {
          const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              statut: 'CANCELLED',
              cancelledAt: new Date(),
              planId: freePlan?.id || subscription.planId,
              stripeSubscriptionId: null,
              stripePriceId: null,
            },
          });

          await prisma.notification.create({
            data: {
              userId: subscription.userId,
              type: 'PAIEMENT_RECU',
              titre: 'Abonnement annulé',
              message: 'Votre abonnement a été annulé. Vous êtes sur le plan Gratuit.',
            },
          });
        }
        break;
      }

      // ====================================================================
      // PAYMENT EVENTS (existing logic - invoice/quote payments)
      // ====================================================================

      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const metadata = checkoutSession.metadata;

        // Subscription checkout - handled by subscription events above
        if (checkoutSession.mode === 'subscription') break;

        // Invoice payment
        if (metadata?.type === 'invoice' && metadata.invoiceId) {
          const invoiceId = metadata.invoiceId;
          const amountPaid = (checkoutSession.amount_total || 0) / 100;

          await prisma.payment.create({
            data: {
              invoiceId,
              montant: amountPaid,
              mode: 'STRIPE',
              reference: checkoutSession.payment_intent as string,
              datePaiement: new Date(),
              stripePaymentId: checkoutSession.payment_intent as string,
            },
          });

          const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
          if (invoice) {
            const newMontantPaye = Number(invoice.montantPaye) + amountPaid;
            const totalTTC = Number(invoice.totalTTC);
            const resteAPayer = Math.max(0, totalTTC - newMontantPaye);
            const newStatut = resteAPayer <= 0 ? 'PAYEE' : 'PARTIELLEMENT_PAYEE';

            await prisma.invoice.update({
              where: { id: invoiceId },
              data: { montantPaye: newMontantPaye, resteAPayer, statut: newStatut },
            });

            await prisma.notification.create({
              data: {
                userId: metadata.userId!,
                type: 'PAIEMENT_RECU',
                titre: `Paiement reçu : ${amountPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
                message: `Paiement reçu pour la facture ${invoice.numero}`,
                entityType: 'invoice',
                entityId: invoiceId,
              },
            });
          }
        }

        // Quote acompte
        if (metadata?.type === 'quote_acompte' && metadata.quoteId) {
          const quoteId = metadata.quoteId;
          const amountPaid = (checkoutSession.amount_total || 0) / 100;

          await prisma.quote.update({ where: { id: quoteId }, data: { statut: 'ACCEPTE' } });
          const quote = await prisma.quote.findUnique({ where: { id: quoteId } });

          await prisma.notification.create({
            data: {
              userId: metadata.userId!,
              type: 'PAIEMENT_RECU',
              titre: `Acompte reçu : ${amountPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
              message: `Acompte reçu pour le devis ${quote?.numero || quoteId}`,
              entityType: 'quote',
              entityId: quoteId,
            },
          });
        }
        break;
      }

      // ====================================================================
      // SUBSCRIPTION INVOICE EVENTS
      // ====================================================================

      case 'invoice.payment_succeeded': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        if (stripeInvoice.subscription) {
          const customerId = stripeInvoice.customer as string;
          const subscription = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (subscription && subscription.statut !== 'ACTIVE') {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { statut: 'ACTIVE' },
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        if (stripeInvoice.subscription) {
          const customerId = stripeInvoice.customer as string;
          const subscription = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (subscription) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { statut: 'PAST_DUE' },
            });
            await prisma.notification.create({
              data: {
                userId: subscription.userId,
                type: 'FACTURE_EN_RETARD',
                titre: 'Échec de paiement',
                message: 'Le paiement de votre abonnement a échoué. Mettez à jour votre moyen de paiement.',
              },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
