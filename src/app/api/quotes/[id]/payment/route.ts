export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// POST /api/quotes/[id]/payment - Create Stripe payment link for acompte (Connect)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        user: { select: { firstName: true, lastName: true, email: true, stripeAccountId: true, stripeOnboarded: true } },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    // Check if user has connected Stripe
    if (!quote.user.stripeAccountId || !quote.user.stripeOnboarded) {
      return NextResponse.json({ 
        error: 'Compte Stripe non connecté',
        needsSetup: true,
        message: 'Connectez votre compte Stripe dans Paramètres → Facturation pour recevoir des paiements.'
      }, { status: 400 });
    }

    if (!quote.acompteRequis || !quote.acompteMontant) {
      return NextResponse.json({ error: 'Pas d\'acompte requis pour ce devis' }, { status: 400 });
    }

    const acompteMontant = Number(quote.acompteMontant);
    const userName = `${quote.user.firstName} ${quote.user.lastName}`;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';

    // Calculate platform fee (2%)
    const platformFeePercent = 2;
    const applicationFee = Math.round(acompteMontant * platformFeePercent);

    // Create Stripe Checkout Session with Connect
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: quote.client.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Acompte devis ${quote.numero}`,
              description: `Acompte ${quote.acomptePourcent}% — ${userName}`,
            },
            unit_amount: Math.round(acompteMontant * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: quote.user.stripeAccountId,
        },
      },
      metadata: {
        type: 'quote_acompte',
        quoteId: quote.id,
        userId: session.user.id,
      },
      success_url: `${baseUrl}/quotes/${quote.id}?payment=success`,
      cancel_url: `${baseUrl}/quotes/${quote.id}?payment=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
