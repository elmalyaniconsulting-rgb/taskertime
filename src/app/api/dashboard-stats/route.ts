import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [clientsCount, invoicesCount, quotesCount, monthRevenue] = await Promise.all([
      prisma.client.count({
        where: { userId, isArchived: false },
      }),
      prisma.invoice.count({
        where: { userId },
      }),
      prisma.quote.count({
        where: { userId },
      }),
      prisma.payment.aggregate({
        where: {
          invoice: { userId },
          datePaiement: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { montant: true },
      }),
    ]);

    return NextResponse.json({
      clientsCount,
      invoicesCount,
      quotesCount,
      caMonth: Number(monthRevenue._sum.montant || 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
