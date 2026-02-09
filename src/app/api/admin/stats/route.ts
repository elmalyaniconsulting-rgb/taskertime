export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Check admin role
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      totalInvoices,
      totalQuotes,
      totalBookings,
      subscriptions,
      recentSignups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.invoice.count(),
      prisma.quote.count(),
      prisma.booking.count(),
      prisma.subscription.findMany({
        include: { plan: { select: { slug: true, nom: true, prixMensuel: true } } },
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true,
          _count: { select: { clients: true, invoices: true, quotes: true, events: true } },
        },
      }),
    ]);

    // Calculate platform revenue from subscriptions
    const totalRevenuePlatform = subscriptions.reduce(
      (sum: number, s: any) => sum + Number(s.plan.prixMensuel || 0), 0
    );

    // Subscription breakdown
    const planCounts: Record<string, number> = {};
    subscriptions.forEach((s: any) => {
      const name = s.plan.nom || 'Gratuit';
      planCounts[name] = (planCounts[name] || 0) + 1;
    });
    const subscriptionBreakdown = Object.entries(planCounts).map(([plan, count]) => ({ plan, count }));

    // Add "Sans abonnement" count
    const usersWithSub = subscriptions.length;
    if (totalUsers > usersWithSub) {
      subscriptionBreakdown.unshift({ plan: 'Sans abonnement', count: totalUsers - usersWithSub });
    }

    return NextResponse.json({
      totalUsers,
      newUsersThisMonth,
      totalInvoices,
      totalQuotes,
      totalBookings,
      totalRevenuePlatform,
      subscriptionBreakdown,
      recentSignups,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
