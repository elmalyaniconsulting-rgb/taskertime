import { requireAuth } from '@/lib/session';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Receipt,
  FileText,
  Users,
  TrendingUp,
  CalendarDays,
  Euro,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  let user: any;
  let stats = {
    clientsCount: 0,
    invoicesCount: 0,
    quotesCount: 0,
    caMonth: 0,
  };

  try {
    user = await requireAuth();
  } catch (error: any) {
    // re-throw redirect errors
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-destructive">Erreur d&apos;authentification</h1>
        <p className="mt-2 text-muted-foreground">Impossible de charger la session. Veuillez vous reconnecter.</p>
        <pre className="mt-4 p-4 bg-muted rounded text-sm overflow-auto">{String(error?.message || error)}</pre>
        <Link href="/login" className="mt-4 inline-block text-primary hover:underline">Retour à la connexion</Link>
      </div>
    );
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [clientsCount, invoicesCount, quotesCount, monthRevenue] = await Promise.all([
      prisma.client.count({
        where: { userId: user.id, isArchived: false },
      }),
      prisma.invoice.count({
        where: { userId: user.id },
      }),
      prisma.quote.count({
        where: { userId: user.id },
      }),
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
    ]);

    stats = {
      clientsCount,
      invoicesCount,
      quotesCount,
      caMonth: Number(monthRevenue._sum.montant || 0),
    };
  } catch (error: any) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-destructive">Erreur de chargement</h1>
        <p className="mt-2 text-muted-foreground">Impossible de charger les données du tableau de bord.</p>
        <pre className="mt-4 p-4 bg-muted rounded text-sm overflow-auto whitespace-pre-wrap">{String(error?.message || error)}</pre>
        <Link href="/login" className="mt-4 inline-block text-primary hover:underline">Retour à la connexion</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour {user.firstName} !
        </h1>
        <p className="text-muted-foreground">
          Voici un résumé de votre activité
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA du mois</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.caMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoicesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quotesCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Prochains rendez-vous
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun RDV à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/clients/new"
                className="block p-3 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                ➕ Ajouter un client
              </Link>
              <Link
                href="/invoices/new"
                className="block p-3 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                ➕ Créer une facture
              </Link>
              <Link
                href="/quotes/new"
                className="block p-3 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                ➕ Créer un devis
              </Link>
              <Link
                href="/prestations"
                className="block p-3 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                ➕ Gérer mes prestations
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
