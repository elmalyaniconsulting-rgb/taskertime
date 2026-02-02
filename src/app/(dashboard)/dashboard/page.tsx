'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Receipt,
  FileText,
  Users,
  CalendarDays,
  Euro,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/dashboard-stats')
        .then((res) => {
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          return res.json();
        })
        .then(setStats)
        .catch((e) => setError(e.message));
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8 text-center">
        <p>Session expirée.</p>
        <Link href="/login" className="text-primary hover:underline">
          Se reconnecter
        </Link>
      </div>
    );
  }

  const user = session?.user;
  const firstName = user?.name?.split(' ')[0] || 'Utilisateur';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour {firstName} !
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
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.caMonth || 0) : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.invoicesCount || 0 : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.clientsCount || 0 : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.quotesCount || 0 : '...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Erreur chargement stats: {error}</p>
          </CardContent>
        </Card>
      )}

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
          <CardHeader>
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
