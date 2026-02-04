import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// POST /api/stripe/connect - Create Stripe Connect account and onboarding link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, stripeAccountId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';
    let accountId = user.stripeAccountId;

    // Create Stripe Connect account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          mcc: '8299', // Educational Services
          product_description: 'Services professionnels',
        },
        metadata: {
          userId: user.id,
        },
      });

      accountId = account.id;

      // Save account ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId },
      });
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings?stripe=refresh`,
      return_url: `${baseUrl}/settings?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/stripe/connect - Check account status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true, stripeOnboarded: true },
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json({ connected: false });
    }

    // Check account status with Stripe
    try {
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      const isOnboarded = account.charges_enabled && account.payouts_enabled;

      // Update DB if status changed
      if (isOnboarded !== user.stripeOnboarded) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeOnboarded: isOnboarded },
        });
      }

      return NextResponse.json({
        connected: true,
        accountId: user.stripeAccountId,
        onboarded: isOnboarded,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      });
    } catch {
      return NextResponse.json({ connected: false });
    }
  } catch (error: any) {
    console.error('Stripe status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/stripe/connect - Disconnect account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeAccountId: null, stripeOnboarded: false },
    });

    return NextResponse.json({ message: 'Compte déconnecté' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
