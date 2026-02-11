export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Check admin role
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      newUsersThisMonth,
      totalInvoices,
      totalQuotes,
      totalBookings,
      totalEvents,
      revenueResult,
      users,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.invoice.count(),
      prisma.quote.count(),
      prisma.booking.count(),
      prisma.event.count(),
      prisma.invoice.aggregate({
        _sum: { montantPaye: true },
        where: { statut: { in: ['PAYEE', 'PARTIELLEMENT_PAYEE'] } },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          activite: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { invoices: true, clients: true, events: true, quotes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Estimate active users today by checking updatedAt
    const activeUsersToday = users.filter(u => 
      new Date(u.updatedAt) >= startOfDay
    ).length;

    return NextResponse.json({
      totalUsers,
      newUsersThisMonth,
      totalInvoices,
      totalQuotes,
      totalBookings,
      totalEvents,
      totalRevenue: Number(revenueResult._sum.montantPaye) || 0,
      activeUsersToday,
      users,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
