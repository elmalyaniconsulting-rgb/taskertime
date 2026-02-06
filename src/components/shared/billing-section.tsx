'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Crown,
  CreditCard,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface SubscriptionData {
  plan: {
    slug: string;
    nom: string;
    status: string;
    periodeType: string;
    cancelAtPeriodEnd: boolean;
    dateFin?: string;
    trialEnd?: string;
    limits: Record<string, any>;
  };
  usage: {
    clients: number;
    factures: number;
    devis: number;
    prestations: number;
  };
}

export function BillingSection() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading('portal');
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' });
      const body = await res.json();
      if (body.url) {
        window.location.href = body.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Il restera actif jusqu\'à la fin de la période en cours.')) return;
    setActionLoading('cancel');
    try {
      await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      fetchSubscription();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setActionLoading('reactivate');
    try {
      await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });
      fetchSubscription();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const { plan, usage } = data;
  const isFree = plan.slug === 'free';
  const isPastDue = plan.status === 'PAST_DUE';
  const isTrialing = plan.status === 'TRIALING';

  const usageItems = [
    { label: 'Clients', current: usage.clients, limit: plan.limits.maxClients },
    { label: 'Factures/mois', current: usage.factures, limit: plan.limits.maxFactures },
    { label: 'Devis/mois', current: usage.devis, limit: plan.limits.maxDevis },
    { label: 'Prestations', current: usage.prestations, limit: plan.limits.maxPrestations },
  ];

  return (
    <div className="space-y-6">
      {/* Plan actuel */}
      <div className="rounded-lg border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crown className={`h-5 w-5 ${isFree ? 'text-muted-foreground' : 'text-primary'}`} />
            <div>
              <h3 className="font-semibold">
                Plan {plan.nom}
                {isTrialing && <Badge variant="secondary" className="ml-2 text-xs">Essai gratuit</Badge>}
                {isPastDue && <Badge variant="destructive" className="ml-2 text-xs">Paiement en retard</Badge>}
                {plan.cancelAtPeriodEnd && <Badge variant="outline" className="ml-2 text-xs">Annulation prévue</Badge>}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isFree
                  ? 'Fonctionnalités limitées'
                  : `${plan.periodeType === 'ANNUEL' ? 'Annuel' : 'Mensuel'}${plan.dateFin ? ` • Prochain paiement le ${new Date(plan.dateFin).toLocaleDateString('fr-FR')}` : ''}`
                }
                {isTrialing && plan.trialEnd && (
                  <span> • Essai jusqu&apos;au {new Date(plan.trialEnd).toLocaleDateString('fr-FR')}</span>
                )}
              </p>
            </div>
          </div>

          {isFree ? (
            <Link href="/pricing">
              <Button size="sm">
                Passer au Pro
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePortal}
                disabled={actionLoading === 'portal'}
              >
                {actionLoading === 'portal' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-1" />
                    Gérer
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {isPastDue && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">
              Votre paiement a échoué. Mettez à jour votre moyen de paiement pour éviter la suspension.
            </p>
            <Button size="sm" variant="destructive" onClick={handlePortal}>
              Mettre à jour
            </Button>
          </div>
        )}

        {/* Usage */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Utilisation</p>
          {usageItems.map((item) => {
            if (item.limit === -1) {
              return (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">{item.current} (illimité)</span>
                </div>
              );
            }

            const pct = Math.min((item.current / item.limit) * 100, 100);
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className={pct >= 100 ? 'text-red-600 font-medium' : pct >= 80 ? 'text-amber-600' : 'text-muted-foreground'}>
                    {item.current}/{item.limit}
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={`h-1.5 ${pct >= 100 ? '[&>div]:bg-red-500' : pct >= 80 ? '[&>div]:bg-amber-500' : ''}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {!isFree && (
        <div className="rounded-lg border p-5">
          <h3 className="font-semibold mb-3">Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handlePortal}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Gérer le moyen de paiement
            </Button>
            {plan.cancelAtPeriodEnd ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-green-600"
                onClick={handleReactivate}
                disabled={actionLoading === 'reactivate'}
              >
                {actionLoading === 'reactivate' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Réactiver l&apos;abonnement
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleCancel}
                disabled={actionLoading === 'cancel'}
              >
                {actionLoading === 'cancel' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Annuler l&apos;abonnement
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
