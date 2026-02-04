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

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (metadata?.type === 'invoice' && metadata.invoiceId) {
        // Invoice payment
        const invoiceId = metadata.invoiceId;
        const amountPaid = (session.amount_total || 0) / 100;

        // Create payment record
        await prisma.payment.create({
          data: {
            invoiceId,
            montant: amountPaid,
            mode: 'STRIPE',
            reference: session.payment_intent as string,
            datePaiement: new Date(),
            stripePaymentId: session.payment_intent as string,
          },
        });

        // Update invoice
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          const newMontantPaye = Number(invoice.montantPaye) + amountPaid;
          const totalTTC = Number(invoice.totalTTC);
          const resteAPayer = Math.max(0, totalTTC - newMontantPaye);
          const newStatut = resteAPayer <= 0 ? 'PAYEE' : 'PARTIELLEMENT_PAYEE';

          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              montantPaye: newMontantPaye,
              resteAPayer,
              statut: newStatut,
            },
          });

          // Create notification
          await prisma.notification.create({
            data: {
              userId: metadata.userId!,
              type: 'PAIEMENT_RECU',
              titre: `Paiement reçu : ${amountPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
              message: `Paiement reçu pour la facture ${invoice.numero}`,
              lien: `/invoices/${invoiceId}`,
            },
          });
        }
      } else if (metadata?.type === 'quote_acompte' && metadata.quoteId) {
        // Quote acompte payment
        const quoteId = metadata.quoteId;
        const amountPaid = (session.amount_total || 0) / 100;

        // Update quote status
        await prisma.quote.update({
          where: { id: quoteId },
          data: { statut: 'ACCEPTE' },
        });

        const quote = await prisma.quote.findUnique({ where: { id: quoteId } });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: metadata.userId!,
            type: 'PAIEMENT_RECU',
            titre: `Acompte reçu : ${amountPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
            message: `Acompte reçu pour le devis ${quote?.numero || quoteId}`,
            lien: `/quotes/${quoteId}`,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
