export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createCustomerPortalSession } from '@/lib/stripe';

// POST /api/subscription/portal - Open Stripe Customer Portal
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Aucun compte de facturation trouvé' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';

    const portalUrl = await createCustomerPortalSession(
      subscription.stripeCustomerId,
      `${baseUrl}/settings`
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
