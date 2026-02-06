'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Clock,
  Check,
  X,
  Zap,
  Crown,
  Rocket,
  ArrowRight,
} from 'lucide-react';

const plans = [
  {
    slug: 'free',
    nom: 'Gratuit',
    description: 'Pour découvrir TaskerTime',
    icon: Zap,
    prixMensuel: 0,
    prixAnnuel: 0,
    popular: false,
    cta: 'Commencer gratuitement',
    ctaVariant: 'outline' as const,
    features: [
      { text: '3 clients', included: true },
      { text: '5 factures / mois', included: true },
      { text: '5 devis / mois', included: true },
      { text: '1 prestation', included: true },
      { text: 'Calendrier (vue)', included: true },
      { text: 'PWA mobile', included: true },
      { text: 'Branding "Powered by TaskerTime"', included: true, note: true },
      { text: 'Paiement Stripe Connect', included: false },
      { text: 'Réservation en ligne', included: false },
      { text: 'Contrats + signature', included: false },
      { text: 'Relances automatiques', included: false },
      { text: 'Statistiques avancées', included: false },
    ],
  },
  {
    slug: 'pro',
    nom: 'Pro',
    description: 'Pour les indépendants sérieux',
    icon: Crown,
    prixMensuel: 14.90,
    prixAnnuel: 149,
    popular: true,
    cta: 'Essai gratuit 14 jours',
    ctaVariant: 'default' as const,
    features: [
      { text: 'Clients illimités', included: true },
      { text: 'Factures illimitées', included: true },
      { text: 'Devis illimités', included: true },
      { text: 'Prestations illimitées', included: true },
      { text: 'Factur-X 2026 + Chorus Pro', included: true },
      { text: 'Paiement Stripe Connect', included: true },
      { text: 'Réservation en ligne (Calendly)', included: true },
      { text: 'Contrats + signature électronique', included: true },
      { text: 'Relances automatiques', included: true },
      { text: 'CRM complet', included: true },
      { text: 'Statistiques avancées', included: true },
      { text: 'Sans branding TaskerTime', included: true },
      { text: 'Support email', included: true },
      { text: 'Assistant IA', included: false },
      { text: 'WhatsApp Business', included: false },
    ],
  },
  {
    slug: 'business',
    nom: 'Business',
    description: 'IA + intégrations avancées',
    icon: Rocket,
    prixMensuel: 29.90,
    prixAnnuel: 299,
    popular: false,
    cta: 'Essai gratuit 14 jours',
    ctaVariant: 'outline' as const,
    features: [
      { text: 'Tout le plan Pro +', included: true, bold: true },
      { text: 'Assistant IA (devis, relances, prévisions)', included: true },
      { text: 'WhatsApp Business (rappels + relances)', included: true },
      { text: 'Sync Google Calendar', included: true },
      { text: 'Espace client dédié', included: true },
      { text: 'API ouverte (Zapier/Make)', included: true },
      { text: 'Multi-devise', included: true },
      { text: 'Export FEC comptable', included: true },
      { text: 'Support prioritaire (chat)', included: true },
    ],
  },
];

export default function PricingPage() {
  const [annuel, setAnnuel] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">TaskerTime</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Se connecter</Button>
          </Link>
          <Link href="/register">
            <Button>Essai gratuit</Button>
          </Link>
        </div>
      </header>

      {/* Title */}
      <section className="container mx-auto px-4 pt-16 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Un prix simple, transparent
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Remplacez Calendly + votre outil de facturation + votre CRM. Un seul abonnement.
        </p>

        {/* Toggle mensuel/annuel */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${!annuel ? 'text-foreground' : 'text-muted-foreground'}`}>
            Mensuel
          </span>
          <Switch checked={annuel} onCheckedChange={setAnnuel} />
          <span className={`text-sm font-medium ${annuel ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annuel
          </span>
          {annuel && (
            <Badge variant="secondary" className="ml-1 text-xs">
              2 mois offerts
            </Badge>
          )}
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.slug}
              className={`relative rounded-2xl border bg-card p-6 flex flex-col ${
                plan.popular
                  ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary'
                  : 'border-border shadow-sm'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">
                  Le plus populaire
                </Badge>
              )}

              <div className="mb-6">
                <plan.icon className={`h-8 w-8 mb-3 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="text-xl font-bold">{plan.nom}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    {plan.prixMensuel === 0
                      ? '0€'
                      : annuel
                        ? `${(plan.prixAnnuel / 12).toFixed(0)}€`
                        : `${plan.prixMensuel.toFixed(0)}€`
                    }
                  </span>
                  {plan.prixMensuel > 0 && (
                    <span className="text-muted-foreground text-sm">/mois</span>
                  )}
                </div>
                {plan.prixMensuel > 0 && annuel && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Facturé {plan.prixAnnuel}€/an
                  </p>
                )}
                {plan.prixMensuel > 0 && !annuel && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Sans engagement
                  </p>
                )}
              </div>

              <Link
                href={plan.slug === 'free' ? '/register' : `/register?plan=${plan.slug}&periode=${annuel ? 'annuel' : 'mensuel'}`}
                className="mb-6"
              >
                <Button
                  variant={plan.ctaVariant}
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  size="lg"
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <div className="space-y-3 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`${
                        !feature.included
                          ? 'text-muted-foreground/50'
                          : ('bold' in feature && feature.bold)
                            ? 'font-semibold'
                            : ''
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison value */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-2xl bg-card border p-8 text-center">
          <h2 className="text-2xl font-bold mb-6">
            Ce que vous payez séparément ailleurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Facturation</p>
              <p className="text-lg font-bold">16€/mois</p>
              <p className="text-xs text-muted-foreground">Indy, Freebe...</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Réservation</p>
              <p className="text-lg font-bold">12€/mois</p>
              <p className="text-xs text-muted-foreground">Calendly Pro</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">CRM</p>
              <p className="text-lg font-bold">20€/mois</p>
              <p className="text-xs text-muted-foreground">HubSpot, Axonaut...</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground line-through">48€/mois</p>
              <p className="text-3xl font-bold text-primary">14,90€/mois</p>
              <p className="text-sm text-muted-foreground">Tout inclus avec TaskerTime Pro</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              q: 'Puis-je changer de plan à tout moment ?',
              a: 'Oui, vous pouvez upgrader ou downgrader à tout moment. Le changement est effectif immédiatement, avec un prorata calculé automatiquement.',
            },
            {
              q: 'Y a-t-il un engagement ?',
              a: 'Non, aucun engagement. Vous pouvez annuler à tout moment. En annuel, vous bénéficiez de 2 mois offerts.',
            },
            {
              q: 'Mes données sont-elles en sécurité ?',
              a: 'Oui, vos données sont hébergées en Europe (Supabase), chiffrées et sauvegardées quotidiennement. Conforme RGPD.',
            },
            {
              q: 'TaskerTime est-il conforme à la facturation électronique 2026 ?',
              a: 'Oui, TaskerTime génère des factures au format Factur-X et supporte Chorus Pro pour le secteur public.',
            },
            {
              q: 'Que se passe-t-il si je dépasse les limites du plan gratuit ?',
              a: 'Vous recevez une notification et vos données existantes restent accessibles. Vous ne pouvez simplement plus en créer de nouvelles sans passer au plan supérieur.',
            },
          ].map((faq, i) => (
            <div key={i} className="rounded-lg border bg-card p-5">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">TaskerTime</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Formation Panthéon. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
