'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/shared/logo';
import { Receipt, FileText, FileSignature, CalendarDays, Loader2, LogOut, Lock } from 'lucide-react';

export default function ClientPortalPage() {
  const [client, setClient] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/client-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
      const c = await res.json();
      setClient(c);
      const docs = await fetch(`/api/client-portal?clientId=${c.id}`);
      if (docs.ok) setData(await docs.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const statusColor = (s: string) => {
    if (['PAYEE', 'ACCEPTE', 'SIGNE', 'CONFIRME', 'REALISE'].includes(s)) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (['EN_RETARD', 'REFUSE', 'ANNULE_CLIENT', 'ANNULE_PRO', 'ANNULEE'].includes(s)) return 'bg-red-100 text-red-700';
    if (['ENVOYEE', 'ENVOYE', 'EN_ATTENTE'].includes(s)) return 'bg-amber-100 text-amber-700';
    return 'bg-muted text-muted-foreground';
  };

  // LOGIN VIEW
  if (!client) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4"><Logo size="lg" /></div>
            <h1 className="text-xl font-bold mb-1">Espace Client</h1>
            <p className="text-sm text-muted-foreground">Consultez vos documents en toute sécurité</p>
          </div>
          <div className="glass-card rounded-2xl p-8">
            {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mot de passe</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 gradient-primary text-white font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Accéder à mon espace
              </Button>
            </form>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-6">
            Vos identifiants vous ont été fournis par votre prestataire
          </p>
        </div>
      </div>
    );
  }

  // PORTAL VIEW
  return (
    <div className="min-h-screen mesh-bg">
      <header className="sticky top-0 z-40 h-14 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{client.prenom} {client.nom}</span>
            <Button size="sm" variant="ghost" onClick={() => { setClient(null); setData(null); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">Bienvenue {client.prenom || client.nom}</h1>

        <Tabs defaultValue="invoices">
          <TabsList className="mb-6">
            <TabsTrigger value="invoices" className="gap-1.5"><Receipt className="h-4 w-4" />Factures</TabsTrigger>
            <TabsTrigger value="quotes" className="gap-1.5"><FileText className="h-4 w-4" />Devis</TabsTrigger>
            <TabsTrigger value="contracts" className="gap-1.5"><FileSignature className="h-4 w-4" />Contrats</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5"><CalendarDays className="h-4 w-4" />RDV</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <div className="space-y-3">
              {data?.invoices?.length > 0 ? data.invoices.map((inv: any) => (
                <Card key={inv.id} className="glass-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{inv.numero}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(inv.dateEmission)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs ${statusColor(inv.statut)}`}>{inv.statut?.replace(/_/g, ' ')}</Badge>
                      <span className="font-bold text-sm">{fmt(Number(inv.totalTTC))}</span>
                      {inv.stripePaymentUrl && Number(inv.resteAPayer) > 0 && (
                        <a href={inv.stripePaymentUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="gradient-primary text-white text-xs">Payer</Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucune facture</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quotes">
            <div className="space-y-3">
              {data?.quotes?.length > 0 ? data.quotes.map((q: any) => (
                <Card key={q.id} className="glass-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{q.numero}</p>
                        <p className="text-xs text-muted-foreground">Valide jusqu&apos;au {fmtDate(q.dateValidite)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs ${statusColor(q.statut)}`}>{q.statut}</Badge>
                      <span className="font-bold text-sm">{fmt(Number(q.totalTTC))}</span>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucun devis</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contracts">
            <div className="space-y-3">
              {data?.contracts?.length > 0 ? data.contracts.map((c: any) => (
                <Card key={c.id} className="glass-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <FileSignature className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{c.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.signedAt ? `Signé le ${fmtDate(c.signedAt)}` : c.dateEnvoi ? `Envoyé le ${fmtDate(c.dateEnvoi)}` : 'En attente'}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${statusColor(c.statut)}`}>{c.statut}</Badge>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileSignature className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucun contrat</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-3">
              {data?.bookings?.length > 0 ? data.bookings.map((b: any) => (
                <Card key={b.id} className="glass-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <CalendarDays className="h-5 w-5 text-violet-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{fmtDate(b.dateDebut)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(b.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(b.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${statusColor(b.statut)}`}>{b.statut?.replace(/_/g, ' ')}</Badge>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucun rendez-vous</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
