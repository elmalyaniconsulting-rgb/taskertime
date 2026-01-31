import { requireAuth } from '@/lib/session';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import {
  Receipt,
  FileText,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CalendarDays,
  Euro,
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await requireAuth();

  // Récupérer les statistiques
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    clientsCount,
    invoicesStats,
    quotesStats,
    monthRevenue,
    overdueInvoices,
    upcomingEvents,
    recentInvoices,
    recentQuotes,
  ] = await Promise.all([
    // Nombre de clients actifs
    prisma.client.count({
      where: { userId: user.id, isArchived: false },
    }),

    // Stats factures
    prisma.invoice.groupBy({
      by: ['statut'],
      where: { userId: user.id },
      _sum: { totalTTC: true },
      _count: true,
    }),

    // Stats devis
    prisma.quote.groupBy({
      by: ['statut'],
      where: { userId: user.id },
      _sum: { totalTTC: true },
      _count: true,
    }),

    // CA du mois
    prisma.payment.aggregate({
      where: {
        invoice: { userId: user.id },
        datePaiement: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { montant: true },
    }),

    // Factures en retard
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        statut: { in: ['ENVOYEE', 'VUE', 'PARTIELLEMENT_PAYEE'] },
        dateEcheance: { lt: now },
      },
      include: { client: { select: { nom: true, raisonSociale: true } } },
      orderBy: { dateEcheance: 'asc' },
      take: 5,
    }),

    // Prochains RDV
    prisma.event.findMany({
      where: {
        userId: user.id,
        dateDebut: { gte: now },
        statut: { in: ['PLANIFIE', 'CONFIRME'] },
      },
      include: { client: { select: { nom: true, prenom: true } } },
      orderBy: { dateDebut: 'asc' },
      take: 5,
    }),

    // Dernières factures
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: { client: { select: { nom: true, raisonSociale: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // Derniers devis
    prisma.quote.findMany({
      where: { userId: user.id },
      include: { client: { select: { nom: true, raisonSociale: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Calculs
  const caMonth = Number(monthRevenue._sum.montant || 0);
  const totalPaid = invoicesStats
    .filter((s) => s.statut === 'PAYEE')
    .reduce((sum, s) => sum + Number(s._sum.totalTTC || 0), 0);
  const totalPending = invoicesStats
    .filter((s) => ['ENVOYEE', 'VUE', 'PARTIELLEMENT_PAYEE'].includes(s.statut))
    .reduce((sum, s) => sum + Number(s._sum.totalTTC || 0), 0);
  const quotesAccepted = quotesStats.filter((s) => s.statut === 'ACCEPTE');
  const quotesTotal = quotesStats.reduce((sum, s) => sum + s._count, 0);
  const quotesAcceptedCount = quotesAccepted.reduce((sum, s) => sum + s._count, 0);
  const conversionRate = quotesTotal > 0 ? Math.round((quotesAcceptedCount / quotesTotal) * 100) : 0;

  const statusBadge = (statut: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
      BROUILLON: { label: 'Brouillon', variant: 'secondary' },
      ENVOYEE: { label: 'Envoyée', variant: 'default' },
      ENVOYE: { label: 'Envoyé', variant: 'default' },
      VUE: { label: 'Vu', variant: 'outline' },
      PAYEE: { label: 'Payée', variant: 'success' },
      ACCEPTE: { label: 'Accepté', variant: 'success' },
      REFUSE: { label: 'Refusé', variant: 'destructive' },
      EN_RETARD: { label: 'En retard', variant: 'destructive' },
      PARTIELLEMENT_PAYEE: { label: 'Partiel', variant: 'warning' },
      ANNULEE: { label: 'Annulée', variant: 'secondary' },
      EXPIRE: { label: 'Expiré', variant: 'secondary' },
      CONVERTI: { label: 'Converti', variant: 'success' },
    };
    const s = map[statut] || { label: statut, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour {user.firstName} !
        </h1>
        <p className="text-muted-foreground">
          Voici un résumé de votre activité
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA du mois</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(caMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {quotesAcceptedCount}/{quotesTotal} devis acceptés
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factures en retard */}
        {overdueInvoices.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Factures en retard ({overdueInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{inv.numero}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.client.raisonSociale || inv.client.nom}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-destructive">
                        {formatCurrency(Number(inv.resteAPayer))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.abs(daysUntil(inv.dateEcheance))}j de retard
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prochains RDV */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Prochains rendez-vous
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun RDV à venir
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/calendar?event=${event.id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{event.titre}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.client
                          ? `${event.client.prenom || ''} ${event.client.nom}`
                          : 'Pas de client'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {formatDate(event.dateDebut, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.dateDebut).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dernières factures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Dernières factures
            </CardTitle>
            <Link
              href="/invoices"
              className="text-sm text-primary hover:underline"
            >
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune facture
              </p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{inv.numero}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.client.raisonSociale || inv.client.nom}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(Number(inv.totalTTC))}
                      </span>
                      {statusBadge(inv.statut)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Derniers devis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Derniers devis
            </CardTitle>
            <Link
              href="/quotes"
              className="text-sm text-primary hover:underline"
            >
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun devis
              </p>
            ) : (
              <div className="space-y-3">
                {recentQuotes.map((q) => (
                  <Link
                    key={q.id}
                    href={`/quotes/${q.id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{q.numero}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.client.raisonSociale || q.client.nom}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(Number(q.totalTTC))}
                      </span>
                      {statusBadge(q.statut)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
