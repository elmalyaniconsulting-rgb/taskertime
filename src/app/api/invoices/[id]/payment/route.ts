export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// POST /api/invoices/[id]/payment - Create Stripe payment link (Connect)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        user: { select: { firstName: true, lastName: true, email: true, stripeAccountId: true, stripeOnboarded: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    // Check if user has connected Stripe
    if (!invoice.user.stripeAccountId || !invoice.user.stripeOnboarded) {
      return NextResponse.json({ 
        error: 'Compte Stripe non connecté',
        needsSetup: true,
        message: 'Connectez votre compte Stripe dans Paramètres → Facturation pour recevoir des paiements.'
      }, { status: 400 });
    }

    const resteAPayer = Number(invoice.resteAPayer);
    if (resteAPayer <= 0) {
      return NextResponse.json({ error: 'Facture déjà payée' }, { status: 400 });
    }

    const userName = `${invoice.user.firstName} ${invoice.user.lastName}`;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';

    // Calculate platform fee (2%)
    const platformFeePercent = 2;
    const applicationFee = Math.round(resteAPayer * platformFeePercent);

    // Create Stripe Checkout Session with Connect
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: invoice.client.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Facture ${invoice.numero}`,
              description: `Paiement à ${userName}`,
            },
            unit_amount: Math.round(resteAPayer * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee, // Platform fee in cents
        transfer_data: {
          destination: invoice.user.stripeAccountId, // Money goes to pro's account
        },
      },
      metadata: {
        type: 'invoice',
        invoiceId: invoice.id,
        userId: session.user.id,
      },
      success_url: `${baseUrl}/invoices/${invoice.id}?payment=success`,
      cancel_url: `${baseUrl}/invoices/${invoice.id}?payment=cancelled`,
    });

    // Save payment URL
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        stripePaymentIntent: checkoutSession.payment_intent as string,
        stripePaymentUrl: checkoutSession.url,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
