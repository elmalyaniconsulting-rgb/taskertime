'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Euro,
  Loader2,
  Receipt,
  FileText,
  Users,
  CalendarDays,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Clock,
  AlertCircle,
} from 'lucide-react';

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
        .catch((e: any) => setError(e.message));
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
        <Link href="/login" className="text-primary hover:underline">Se reconnecter</Link>
      </div>
    );
  }

  const user = session?.user;
  const firstName = user?.name?.split(' ')[0] || 'Utilisateur';

  const fmt = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);

  const statCards = [
    {
      label: 'CA du mois',
      value: fmt(stats?.monthRevenue || 0),
      icon: Euro,
      trend: '+12%',
      trendUp: true,
      color: 'from-violet-500 to-purple-600',
      href: '/stats',
    },
    {
      label: 'Factures en attente',
      value: stats?.pendingInvoices || 0,
      icon: Receipt,
      sub: stats?.pendingAmount ? fmt(stats.pendingAmount) : null,
      color: 'from-amber-500 to-orange-600',
      href: '/invoices',
    },
    {
      label: 'Clients actifs',
      value: stats?.clientsCount || 0,
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      href: '/clients',
    },
    {
      label: 'RDV cette semaine',
      value: stats?.weekEvents || 0,
      icon: CalendarDays,
      color: 'from-blue-500 to-indigo-600',
      href: '/calendar',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Voici votre activité du jour
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quotes/new">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Devis
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button size="sm" className="gap-1.5 gradient-primary text-white">
              <Plus className="h-3.5 w-3.5" /> Facture
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link key={card.label} href={card.href}>
            <Card className={`glass-card stat-card cursor-pointer opacity-0 animate-fade-in stagger-${i + 1}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                  {card.trend && (
                    <Badge variant="secondary" className="text-xs font-medium gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {card.trend}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.sub || card.label}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent invoices */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Dernières factures</CardTitle>
            <Link href="/invoices" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentInvoices?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentInvoices.slice(0, 5).map((inv: any) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inv.numero}</p>
                        <p className="text-xs text-muted-foreground">{inv.client?.nom || 'Client'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(Number(inv.totalTTC))}</p>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          inv.statut === 'PAYEE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          inv.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          inv.statut === 'ENVOYEE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          ''
                        }`}
                      >
                        {inv.statut?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Receipt className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Aucune facture pour le moment</p>
                <Link href="/invoices/new">
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Créer une facture
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Nouveau client', href: '/clients', icon: Users },
              { label: 'Nouveau devis', href: '/quotes/new', icon: FileText },
              { label: 'Nouvelle facture', href: '/invoices/new', icon: Receipt },
              { label: 'Créer un créneau', href: '/bookings/new', icon: Clock },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <Button variant="ghost" className="w-full justify-between h-11 font-medium group">
                  <div className="flex items-center gap-3">
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                    {action.label}
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
