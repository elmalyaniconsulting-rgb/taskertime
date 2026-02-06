import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Calendar,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Bot,
  Bell,
  Sparkles,
} from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ================================================================
          HEADER
          ================================================================ */}
      <header className="container mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">TaskerTime</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition">Fonctionnalités</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">Tarifs</a>
          <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition">Témoignages</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Se connecter</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Essai gratuit</Button>
          </Link>
        </div>
      </header>

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Conforme facturation électronique 2026
        </Badge>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
          Le seul outil dont votre
          <span className="text-blue-600"> activité indépendante</span> a besoin
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Facturation, devis, calendrier, réservation en ligne, contrats, CRM et paiements — tout au même endroit. Fini les 4 abonnements.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link href="/register">
            <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-blue-600/20">
              Commencer gratuitement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="text-base px-8 h-12">
              Voir les tarifs
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Aucune carte bancaire requise &middot; Essai Pro 14 jours offert
        </p>
      </section>

      {/* ================================================================
          COMPARISON BAR (replaces X tools)
          ================================================================ */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-6 md:p-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-4">TaskerTime remplace</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
              <p className="font-semibold text-sm">Facturation</p>
              <p className="text-xs text-muted-foreground">Indy, Freebe</p>
              <p className="text-sm font-bold text-red-500 line-through mt-1">16€/mois</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
              <p className="font-semibold text-sm">Réservation</p>
              <p className="text-xs text-muted-foreground">Calendly</p>
              <p className="text-sm font-bold text-red-500 line-through mt-1">12€/mois</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
              <p className="font-semibold text-sm">CRM</p>
              <p className="text-xs text-muted-foreground">HubSpot, Axonaut</p>
              <p className="text-sm font-bold text-red-500 line-through mt-1">20€/mois</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
              <p className="font-semibold text-sm">Contrats</p>
              <p className="text-xs text-muted-foreground">DocuSign</p>
              <p className="text-sm font-bold text-red-500 line-through mt-1">25€/mois</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Séparément : <span className="line-through">73€/mois</span></p>
            <p className="text-2xl font-bold text-blue-600">TaskerTime Pro : 14,90€/mois</p>
            <p className="text-sm text-muted-foreground">Soit une économie de 80%</p>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURES
          ================================================================ */}
      <section id="features" className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Tout pour gérer votre activité</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Plus besoin de jongler entre plusieurs outils. TaskerTime centralise tout.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {[
            { icon: Calendar, title: 'Réservation en ligne', desc: 'Vos clients réservent directement via un lien. Comme Calendly, intégré à votre facturation.' },
            { icon: FileText, title: 'Devis & Factures', desc: 'Conformes Factur-X 2026. Chorus Pro pour le secteur public. PDF automatiques.' },
            { icon: CreditCard, title: 'Paiement Stripe', desc: 'Vos clients paient en ligne par carte. Acomptes sur devis, solde sur facture.' },
            { icon: Users, title: 'CRM intégré', desc: 'Fiches clients, historique, notes, tags. Tout le contexte à portée de main.' },
            { icon: Shield, title: 'Contrats & Signature', desc: 'Importez vos contrats, envoyez-les et faites-les signer électroniquement.' },
            { icon: Bell, title: 'Relances automatiques', desc: 'J+1, J+7, J+15, J+30 — fini les impayés oubliés. Emails personnalisés.' },
            { icon: BarChart3, title: 'Statistiques', desc: 'CA réalisé, taux de conversion, clients les plus rentables. Tout en un coup d\'œil.' },
            { icon: Smartphone, title: 'App mobile (PWA)', desc: 'Installez TaskerTime sur votre téléphone. Fonctionne partout.' },
          ].map((f, i) => (
            <div key={i} className="group rounded-xl border bg-card p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all">
              <f.icon className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Business plan features callout */}
        <div className="max-w-3xl mx-auto mt-12 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Bot className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-lg">Plan Business : IA intégrée</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
            Génération automatique de devis depuis un brief texte, suggestions de relances personnalisées, prévisions CA 3 mois, WhatsApp Business et sync Google Calendar.
          </p>
          <Link href="/pricing">
            <Button variant="outline" size="sm">
              Découvrir le plan Business
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Créez votre compte', desc: 'Gratuit, en 2 minutes. Renseignez votre SIRET et vos préférences de facturation.' },
              { step: '2', title: 'Ajoutez vos prestations', desc: 'Définissez vos services, tarifs et disponibilités. Partagez votre lien de réservation.' },
              { step: '3', title: 'Facturez et encaissez', desc: 'Devis → signature → acompte → facture → paiement. Tout automatisé, zéro friction.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PRICING SUMMARY
          ================================================================ */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">Des tarifs simples</h2>
        <p className="text-center text-muted-foreground mb-12">Commencez gratuitement, upgradez quand vous êtes prêt.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {/* Free */}
          <div className="rounded-xl border p-6">
            <Zap className="h-6 w-6 text-muted-foreground mb-3" />
            <h3 className="font-bold text-lg">Gratuit</h3>
            <p className="text-3xl font-bold mt-2">0€</p>
            <p className="text-sm text-muted-foreground mb-4">Pour découvrir</p>
            <ul className="space-y-2 text-sm mb-6">
              {['3 clients', '5 factures/mois', 'Calendrier', 'PWA mobile'].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block">
              <Button variant="outline" className="w-full">Commencer</Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-blue-600 p-6 relative shadow-lg shadow-blue-600/10">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">Populaire</Badge>
            <Zap className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="font-bold text-lg">Pro</h3>
            <p className="text-3xl font-bold mt-2">14,90€<span className="text-base font-normal text-muted-foreground">/mois</span></p>
            <p className="text-sm text-muted-foreground mb-4">149€/an (2 mois offerts)</p>
            <ul className="space-y-2 text-sm mb-6">
              {['Tout illimité', 'Factur-X 2026', 'Réservation en ligne', 'Contrats + signature', 'Relances auto', 'Stripe Connect', 'CRM complet'].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=pro" className="block">
              <Button className="w-full">Essai gratuit 14 jours</Button>
            </Link>
          </div>

          {/* Business */}
          <div className="rounded-xl border p-6">
            <Bot className="h-6 w-6 text-muted-foreground mb-3" />
            <h3 className="font-bold text-lg">Business</h3>
            <p className="text-3xl font-bold mt-2">29,90€<span className="text-base font-normal text-muted-foreground">/mois</span></p>
            <p className="text-sm text-muted-foreground mb-4">299€/an (2 mois offerts)</p>
            <ul className="space-y-2 text-sm mb-6">
              {['Tout Pro +', 'Assistant IA', 'WhatsApp Business', 'Google Calendar sync', 'API ouverte', 'Export FEC', 'Support prioritaire'].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=business" className="block">
              <Button variant="outline" className="w-full">Essai gratuit 14 jours</Button>
            </Link>
          </div>
        </div>
        
        <p className="text-center mt-6">
          <Link href="/pricing" className="text-sm text-blue-600 hover:underline">
            Voir le comparatif complet des plans →
          </Link>
        </p>
      </section>

      {/* ================================================================
          TESTIMONIALS
          ================================================================ */}
      <section id="testimonials" className="bg-gray-50 dark:bg-gray-900/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Ils utilisent TaskerTime</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Marie L.',
                role: 'Coach professionnelle',
                text: 'Avant je perdais 2h par semaine entre Calendly, mon tableur de facturation et les relances manuelles. Avec TaskerTime, tout est centralisé.',
              },
              {
                name: 'Karim B.',
                role: 'Développeur freelance',
                text: 'La réservation en ligne intégrée à la facturation, c\'est exactement ce qui manquait. Mes clients réservent, je facture en 2 clics.',
              },
              {
                name: 'Sophie D.',
                role: 'Formatrice indépendante',
                text: 'Les relances automatiques me font gagner un temps fou. Plus aucune facture oubliée. Et la conformité Factur-X me rassure pour 2026.',
              },
            ].map((t, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA
          ================================================================ */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-10 md:p-16 text-white max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à tout gérer au même endroit ?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Rejoignez les indépendants qui gagnent du temps et de l&apos;argent avec TaskerTime.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-base px-8 h-12">
              Créer mon compte gratuitement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm opacity-70 mt-4">Aucune carte bancaire requise</p>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">TaskerTime</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Formation Panthéon SASU. Tous droits réservés.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">CGU</Link>
            <Link href="/privacy" className="hover:text-foreground">Confidentialité</Link>
            <Link href="/pricing" className="hover:text-foreground">Tarifs</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
