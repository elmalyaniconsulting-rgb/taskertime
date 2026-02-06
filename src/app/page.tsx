import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Clock,
  Calendar,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Bot,
  Bell,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen mesh-bg">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <defs>
                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(250, 84%, 54%)" />
                  <stop offset="100%" stopColor="hsl(280, 70%, 50%)" />
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#lg)" />
              <rect x="2" y="2" width="36" height="18" rx="9" fill="white" fillOpacity="0.15" />
              <path d="M8 12h10M13 12v16M22 12h10M27 12v16" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-extrabold tracking-tight">
              Tasker<span className="gradient-text">Time</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Fonctionnalités</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">Tarifs</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white gradient-primary hover:opacity-90 transition shadow-lg shadow-primary/25"
            >
              Commencer gratuitement <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Conforme Factur-X 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Gérez votre activité<br />
            <span className="gradient-text">sans friction.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Planning, devis, factures, paiements, réservation en ligne.
            Tout ce dont un indépendant a besoin, dans une seule app.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white gradient-primary hover:opacity-90 transition shadow-xl shadow-primary/25 animate-pulse-glow"
            >
              Essai gratuit — 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-card border border-border hover:border-primary/30 transition"
            >
              Découvrir <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="glass-card rounded-2xl p-1.5 shadow-2xl shadow-primary/5">
            <div className="bg-card rounded-xl p-6 border border-border/50">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'CA du mois', value: '12 450 €', color: 'text-primary' },
                  { label: 'Factures en attente', value: '3', color: 'text-orange-500' },
                  { label: 'RDV cette semaine', value: '8', color: 'text-emerald-500' },
                  { label: 'Taux occupation', value: '76%', color: 'text-violet-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/50 rounded-lg p-4 stat-card">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground/50">
                  <BarChart3 className="h-8 w-8" />
                  <span className="text-sm font-medium">Graphique CA mensuel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Tout ce qu&apos;il vous faut, <span className="gradient-text">rien de superflu</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Conçu spécifiquement pour les indépendants et professions libérales en France.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'Planning intelligent', desc: 'Calendrier avec détection des trous et calcul du manque à gagner.' },
            { icon: FileText, title: 'Devis en 30 secondes', desc: 'Créez vos devis depuis le calendrier et convertissez-les en facture.' },
            { icon: Shield, title: 'Factur-X 2026', desc: 'Factures conformes avec XML embarqué, prêtes pour la réforme.' },
            { icon: CreditCard, title: 'Paiement Stripe', desc: 'Vos clients paient en ligne. Acomptes et factures, tout est géré.' },
            { icon: Users, title: 'Réservation type Calendly', desc: 'Lien de réservation personnalisé. Vos clients bookent en autonomie.' },
            { icon: Bot, title: 'IA Assistant', desc: 'Suggestions tarifaires, relances intelligentes, analyses prédictives.' },
            { icon: Bell, title: 'Relances automatiques', desc: 'Rappels RDV et relances factures impayées, 100% automatisés.' },
            { icon: BarChart3, title: 'Statistiques avancées', desc: 'CA, taux de conversion, clients les plus rentables, en temps réel.' },
            { icon: Zap, title: 'Ultra rapide', desc: 'Application PWA installable sur mobile. Fonctionne même hors ligne.' },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-xl p-6 group">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Des tarifs <span className="gradient-text">transparents</span>
          </h2>
          <p className="text-muted-foreground text-lg">Commencez gratuitement, passez Pro quand vous êtes prêt.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: 'Gratuit', price: '0', period: '/mois', desc: 'Pour démarrer',
              features: ['5 clients', '5 factures/mois', 'Calendrier', 'Devis'],
              cta: 'Commencer', highlight: false,
            },
            {
              name: 'Pro', price: '9', period: ',99€/mois', desc: 'Pour les indépendants actifs',
              features: ['Clients illimités', 'Factures illimitées', 'Réservation en ligne', 'Paiement Stripe', 'Relances auto', 'IA Assistant', 'Contrats + Signature'],
              cta: 'Essai gratuit 14j', highlight: true,
            },
            {
              name: 'Business', price: '24', period: ',99€/mois', desc: 'Pour aller plus loin',
              features: ['Tout Pro +', 'WhatsApp intégré', 'Google Calendar sync', 'Espace client', 'API access', 'Export FEC', 'Support prioritaire'],
              cta: 'Essai gratuit 14j', highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 ${
                plan.highlight
                  ? 'gradient-primary text-white shadow-2xl shadow-primary/30 scale-105 relative'
                  : 'glass-card'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-primary text-xs font-bold shadow">
                  Populaire
                </div>
              )}
              <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? '' : ''}`}>{plan.name}</h3>
              <p className={`text-sm mb-4 ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-white/80' : 'text-primary'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition ${
                  plan.highlight
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
              <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#lg)" />
              <path d="M8 12h10M13 12v16M22 12h10M27 12v16" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-bold">TaskerTime</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Formation Panthéon. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition">CGU</a>
            <a href="#" className="hover:text-foreground transition">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
