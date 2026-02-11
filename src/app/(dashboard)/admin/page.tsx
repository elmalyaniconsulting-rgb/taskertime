'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, CreditCard, FileText, TrendingUp, Search, Shield, ShieldOff,
  Trash2, Eye, BarChart3, Loader2, RefreshCw, UserPlus, Receipt, FileSignature,
  CalendarDays, AlertTriangle
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  _count: {
    clients: number;
    invoices: number;
    quotes: number;
    events: number;
  };
  subscription?: {
    plan: { slug: string; nom: string };
    statut: string;
  } | null;
}

interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalInvoices: number;
  totalQuotes: number;
  totalBookings: number;
  totalRevenuePlatform: number;
  subscriptionBreakdown: { plan: string; count: number }[];
  recentSignups: AdminUser[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
      ]);
      if (!statsRes.ok || !usersRes.ok) {
        const err = await statsRes.json().catch(() => ({}));
        throw new Error(err.error || 'Accès refusé ou erreur serveur');
      }
      setStats(await statsRes.json());
      setUsers(await usersRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (userId: string, action: 'toggleAdmin' | 'delete') => {
    if (action === 'delete' && !confirm('Supprimer cet utilisateur et toutes ses données ? Cette action est irréversible.')) return;
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Accès refusé</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Administration
          </h1>
          <p className="text-muted-foreground text-sm">Gestion de la plateforme TaskerTime</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
          { label: 'Nouveaux (mois)', value: stats?.newUsersThisMonth || 0, icon: UserPlus, color: 'text-emerald-500' },
          { label: 'Factures', value: stats?.totalInvoices || 0, icon: Receipt, color: 'text-violet-500' },
          { label: 'Devis', value: stats?.totalQuotes || 0, icon: FileSignature, color: 'text-amber-500' },
          { label: 'Réservations', value: stats?.totalBookings || 0, icon: CalendarDays, color: 'text-rose-500' },
          { label: 'CA plateforme', value: fmt(stats?.totalRevenuePlatform || 0), icon: TrendingUp, color: 'text-emerald-600', isText: true },
        ].map((s: any, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold">{s.isText ? s.value : s.value.toLocaleString('fr-FR')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" />Utilisateurs</TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-1.5"><CreditCard className="h-4 w-4" />Abonnements</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5"><BarChart3 className="h-4 w-4" />Activité</TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredUsers.length} utilisateur(s)</span>
          </div>

          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{user.firstName} {user.lastName}</p>
                          {user.role === 'admin' && (
                            <Badge className="bg-violet-100 text-violet-700 text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Inscrit le {fmtDate(user.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{user._count.clients} clients</span>
                        <span>{user._count.invoices} factures</span>
                        <span>{user._count.quotes} devis</span>
                        <span>{user._count.events} events</span>
                      </div>

                      <Badge className={
                        user.subscription?.plan.slug === 'business' ? 'bg-amber-100 text-amber-700' :
                        user.subscription?.plan.slug === 'pro' ? 'bg-violet-100 text-violet-700' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {user.subscription?.plan.nom || 'Gratuit'}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => handleAction(user.id, 'toggleAdmin')}
                          disabled={actionLoading === user.id}
                          title={user.role === 'admin' ? 'Retirer admin' : 'Rendre admin'}
                        >
                          {user.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                          onClick={() => handleAction(user.id, 'delete')}
                          disabled={actionLoading === user.id}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SUBSCRIPTIONS TAB */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(stats?.subscriptionBreakdown || []).map((sub, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold mb-1">{sub.count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{sub.plan}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Utilisateurs par plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        user.subscription?.plan.slug === 'business' ? 'bg-amber-100 text-amber-700' :
                        user.subscription?.plan.slug === 'pro' ? 'bg-violet-100 text-violet-700' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {user.subscription?.plan.nom || 'Gratuit'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.subscription?.statut || '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Dernières inscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.recentSignups || []).map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtDate(user.createdAt)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Activité globale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-600">{stats?.totalInvoices || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Factures créées</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                  <p className="text-2xl font-bold text-violet-600">{stats?.totalQuotes || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Devis créés</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                  <p className="text-2xl font-bold text-rose-600">{stats?.totalBookings || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Réservations</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-2xl font-bold text-emerald-600">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Utilisateurs actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
