export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  getOrCreateStripeCustomer,
  createSubscriptionCheckout,
  cancelSubscription,
  reactivateSubscription,
} from '@/lib/stripe';
import { getUserPlan, getUserUsage } from '@/lib/plans';

// GET /api/subscription - Get current subscription status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const [userPlan, usage] = await Promise.all([
      getUserPlan(session.user.id),
      getUserUsage(session.user.id),
    ]);

    return NextResponse.json({ plan: userPlan, usage });
  } catch (error: any) {
    console.error('Subscription GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/subscription - Create checkout session for a plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { planSlug, periode } = body; // periode: 'mensuel' | 'annuel'

    if (!planSlug || !periode) {
      return NextResponse.json(
        { error: 'planSlug et periode requis' },
        { status: 400 }
      );
    }

    // Get plan from DB
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 });
    }

    if (plan.slug === 'free') {
      return NextResponse.json(
        { error: 'Le plan gratuit ne nécessite pas de paiement' },
        { status: 400 }
      );
    }

    const priceId = periode === 'annuel' ? plan.stripePriceYear : plan.stripePriceMonth;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Prix Stripe non configuré pour ce plan' },
        { status: 500 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscription: { select: { stripeCustomerId: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      `${user.firstName} ${user.lastName}`,
      user.subscription?.stripeCustomerId
    );

    // Update subscription record with customer ID
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { stripeCustomerId: customerId },
      create: {
        userId: user.id,
        planId: plan.id,
        stripeCustomerId: customerId,
        statut: 'INCOMPLETE',
        periodeType: periode === 'annuel' ? 'ANNUEL' : 'MENSUEL',
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';

    // Create checkout session
    const checkoutUrl = await createSubscriptionCheckout({
      customerId,
      priceId,
      userId: user.id,
      successUrl: `${baseUrl}/dashboard?subscription=success`,
      cancelUrl: `${baseUrl}/pricing?subscription=cancelled`,
      trialDays: 14, // 14 jours d'essai gratuit
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error('Subscription POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/subscription - Cancel or reactivate subscription
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'cancel' | 'reactivate'

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif' },
        { status: 400 }
      );
    }

    if (action === 'cancel') {
      await cancelSubscription(subscription.stripeSubscriptionId, false);
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { cancelAtPeriodEnd: true },
      });
      return NextResponse.json({ message: 'Abonnement sera annulé à la fin de la période' });
    }

    if (action === 'reactivate') {
      await reactivateSubscription(subscription.stripeSubscriptionId);
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { cancelAtPeriodEnd: false },
      });
      return NextResponse.json({ message: 'Abonnement réactivé' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    console.error('Subscription PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
