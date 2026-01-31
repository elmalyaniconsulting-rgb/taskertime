import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Calendar,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Shield,
  Smartphone,
} from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">TaskerTime</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Se connecter</Button>
          </Link>
          <Link href="/register">
            <Button>Essai gratuit</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Gérez votre activité
          <br />
          <span className="text-primary">en toute simplicité</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          TaskerTime est l&apos;outil tout-en-un pour les indépendants et professions libérales.
          Devis, factures, planning, paiements en ligne — tout au même endroit.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Commencer gratuitement
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Aucune carte bancaire requise
        </p>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Tout ce dont vous avez besoin
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Calendar,
              title: 'Calendrier intelligent',
              desc: 'Planifiez vos RDV et partagez vos disponibilités comme Calendly.',
            },
            {
              icon: FileText,
              title: 'Devis & Factures',
              desc: 'Conformes Factur-X 2026. Chorus Pro intégré pour le secteur public.',
            },
            {
              icon: CreditCard,
              title: 'Paiement en ligne',
              desc: 'Acceptez les paiements par carte via Stripe. Acomptes automatiques.',
            },
            {
              icon: Users,
              title: 'Espace client',
              desc: 'Vos clients accèdent à leurs documents, factures et RDV.',
            },
            {
              icon: BarChart3,
              title: 'Statistiques',
              desc: 'CA, taux de conversion, clients les plus rentables — tout en un coup d\'œil.',
            },
            {
              icon: Shield,
              title: 'Contrats',
              desc: 'Import, export et signature électronique de vos contrats.',
            },
            {
              icon: Smartphone,
              title: 'Application mobile',
              desc: 'Installable sur votre téléphone. Fonctionne même hors connexion.',
            },
            {
              icon: Clock,
              title: 'Relances automatiques',
              desc: 'Fini les impayés oubliés. Relances programmées automatiquement.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="rounded-2xl bg-primary p-12 text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à simplifier votre quotidien ?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Rejoignez des milliers d&apos;indépendants qui gagnent du temps avec TaskerTime.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Créer mon compte gratuitement
            </Button>
          </Link>
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
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">CGU</Link>
            <Link href="/privacy" className="hover:text-foreground">Confidentialité</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
