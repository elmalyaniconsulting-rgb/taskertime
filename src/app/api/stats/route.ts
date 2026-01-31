import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, serverError, success } from '@/lib/api-helpers';

// GET /api/stats - Statistiques complètes
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // CA par mois
    const payments = await prisma.payment.findMany({
      where: {
        invoice: { userId },
        datePaiement: { gte: startOfYear, lte: endOfYear },
      },
      select: { montant: true, datePaiement: true },
    });

    const caParMois: Record<number, number> = {};
    for (let i = 0; i < 12; i++) caParMois[i] = 0;
    payments.forEach((p) => {
      const month = new Date(p.datePaiement).getMonth();
      caParMois[month] += Number(p.montant);
    });

    const monthlyRevenue = Object.entries(caParMois).map(([month, ca]) => ({
      mois: new Date(year, parseInt(month)).toLocaleDateString('fr-FR', { month: 'short' }),
      ca: Math.round(ca * 100) / 100,
    }));

    // CA par client (top 10)
    const revenueByClient = await prisma.payment.groupBy({
      by: ['invoiceId'],
      where: {
        invoice: { userId },
        datePaiement: { gte: startOfYear, lte: endOfYear },
      },
      _sum: { montant: true },
    });

    // Récupérer les infos clients
    const invoiceIds = revenueByClient.map((r) => r.invoiceId);
    const invoicesWithClients = await prisma.invoice.findMany({
      where: { id: { in: invoiceIds } },
      select: { id: true, clientId: true, client: { select: { nom: true, raisonSociale: true } } },
    });

    const clientRevMap: Record<string, { name: string; total: number }> = {};
    revenueByClient.forEach((r) => {
      const inv = invoicesWithClients.find((i) => i.id === r.invoiceId);
      if (inv) {
        const clientName = inv.client.raisonSociale || inv.client.nom;
        if (!clientRevMap[inv.clientId]) {
          clientRevMap[inv.clientId] = { name: clientName, total: 0 };
        }
        clientRevMap[inv.clientId].total += Number(r._sum.montant || 0);
      }
    });

    const topClients = Object.values(clientRevMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((c) => ({ name: c.name, value: Math.round(c.total * 100) / 100 }));

    // CA par prestation
    const invoiceLines = await prisma.invoiceLine.findMany({
      where: {
        invoice: { userId, statut: 'PAYEE', dateEmission: { gte: startOfYear, lte: endOfYear } },
      },
      include: { prestation: { select: { nom: true } } },
    });

    const prestationRevMap: Record<string, number> = {};
    invoiceLines.forEach((line) => {
      const name = line.prestation?.nom || line.description;
      prestationRevMap[name] = (prestationRevMap[name] || 0) + Number(line.totalTTC);
    });

    const revenueByPrestation = Object.entries(prestationRevMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Taux conversion devis
    const [totalQuotes, acceptedQuotes] = await Promise.all([
      prisma.quote.count({
        where: { userId, createdAt: { gte: startOfYear, lte: endOfYear } },
      }),
      prisma.quote.count({
        where: {
          userId,
          createdAt: { gte: startOfYear, lte: endOfYear },
          statut: { in: ['ACCEPTE', 'CONVERTI'] },
        },
      }),
    ]);

    // Heures travaillées
    const events = await prisma.event.aggregate({
      where: {
        userId,
        statut: 'REALISE',
        dateDebut: { gte: startOfYear, lte: endOfYear },
      },
      _sum: { dureeHeures: true },
    });

    // Total CA annuel
    const totalCA = payments.reduce((sum, p) => sum + Number(p.montant), 0);

    return success({
      year,
      totalCA: Math.round(totalCA * 100) / 100,
      monthlyRevenue,
      topClients,
      revenueByPrestation,
      conversionRate: totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0,
      totalQuotes,
      acceptedQuotes,
      heuresTravaillees: Math.round(Number(events._sum.dureeHeures || 0) * 10) / 10,
    });
  } catch (error) {
    return serverError(error);
  }
}
