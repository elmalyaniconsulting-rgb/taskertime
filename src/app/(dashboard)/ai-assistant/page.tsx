'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  Loader2,
  Euro,
  Users,
  Clock,
  Zap,
  Brain,
  Target,
  BarChart3,
} from 'lucide-react';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'suggestion';
  title: string;
  message: string;
  action?: string;
  actionHref?: string;
}

export default function AIAssistantPage() {
  const { data: session } = useSession();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const [statsRes, invoicesRes, clientsRes] = await Promise.all([
        fetch('/api/dashboard-stats'),
        fetch('/api/invoices'),
        fetch('/api/clients'),
      ]);

      const stats = statsRes.ok ? await statsRes.json() : {};
      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
      const clients = clientsRes.ok ? await clientsRes.json() : [];

      const generated: Insight[] = [];

      // Analyse factures en retard
      const overdueInvoices = Array.isArray(invoices)
        ? invoices.filter((i: any) => i.statut === 'EN_RETARD')
        : [];
      if (overdueInvoices.length > 0) {
        const total = overdueInvoices.reduce((s: number, i: any) => s + Number(i.resteAPayer || 0), 0);
        generated.push({
          type: 'warning',
          title: `${overdueInvoices.length} facture(s) en retard`,
          message: `Vous avez ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total)} d'impayés. La relance automatique peut récupérer jusqu'à 60% des impayés sous 7 jours.`,
          action: 'Voir les factures',
          actionHref: '/invoices',
        });
      }

      // Taux d'occupation
      if (stats?.weekEvents !== undefined) {
        const occupancy = Math.round((stats.weekEvents / 40) * 100);
        if (occupancy < 50) {
          generated.push({
            type: 'suggestion',
            title: 'Taux d\'occupation faible',
            message: `Votre calendrier est rempli à ${occupancy}% cette semaine. Activez la réservation en ligne pour maximiser votre planning.`,
            action: 'Configurer',
            actionHref: '/bookings',
          });
        }
      }

      // Clients sans facture récente
      const activeClients = Array.isArray(clients) ? clients.filter((c: any) => !c.isArchived) : [];
      if (activeClients.length > 5) {
        generated.push({
          type: 'info',
          title: 'Base client solide',
          message: `Vous avez ${activeClients.length} clients actifs. Pensez à proposer des forfaits récurrents pour stabiliser votre CA.`,
        });
      }

      // Conseil tarification
      generated.push({
        type: 'suggestion',
        title: 'Optimisation tarifaire',
        message: 'Les indépendants qui augmentent leurs tarifs de 10% chaque année maintiennent leur pouvoir d\'achat. Revoyez vos prix si vous ne l\'avez pas fait depuis 6 mois.',
        action: 'Mes prestations',
        actionHref: '/prestations',
      });

      // Conformité 2026
      generated.push({
        type: 'info',
        title: 'Factur-X 2026 : vous êtes prêt',
        message: 'Vos factures sont déjà générées au format conforme. Assurez-vous que vos coordonnées bancaires et numéro SIRET sont à jour.',
        action: 'Vérifier',
        actionHref: '/settings',
      });

      setInsights(generated);
    } catch {
      setInsights([{
        type: 'info',
        title: 'Bienvenue',
        message: 'Créez vos premières factures et clients pour que l\'IA puisse analyser votre activité.',
      }]);
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion('');
    setChatHistory((prev) => [...prev, { role: 'user', content: q }]);
    setChatLoading(true);

    // Simulate AI response based on keyword matching (can be replaced with real API)
    setTimeout(() => {
      let response = '';
      const lowerQ = q.toLowerCase();

      if (lowerQ.includes('tarif') || lowerQ.includes('prix')) {
        response = 'Pour un indépendant en France, le TJM moyen varie entre 350€ (junior) et 800€ (expert) selon le secteur. Pour calculer votre tarif horaire idéal : (charges annuelles + salaire souhaité + marge) / heures facturables. En moyenne, un indépendant facture 130-140 jours/an.';
      } else if (lowerQ.includes('relance') || lowerQ.includes('impayé')) {
        response = 'Voici le protocole recommandé : J+1 après échéance → rappel amical par email. J+7 → relance formelle avec copie de la facture. J+15 → mise en demeure recommandée. J+30 → envisager une procédure de recouvrement. TaskerTime peut automatiser les 3 premières étapes.';
      } else if (lowerQ.includes('tva') || lowerQ.includes('franchise')) {
        response = 'En franchise en base de TVA (art. 293 B CGI), vos seuils 2025 sont : 36 800€ (services) ou 91 900€ (vente). En cas de dépassement, vous devez facturer la TVA dès le 1er jour du mois de dépassement. Pensez à mettre à jour votre mention légale dans Paramètres.';
      } else if (lowerQ.includes('client') || lowerQ.includes('prospect')) {
        response = 'Conseil : les recommandations représentent 60% des nouveaux clients pour les indépendants. Proposez un programme de parrainage simple (remise sur la prochaine facture). Utilisez aussi votre lien de réservation sur vos réseaux sociaux et signature email.';
      } else {
        response = 'C\'est une excellente question. Pour vous donner une réponse précise, je vous recommande de consulter vos statistiques dans l\'onglet dédié, ou de vérifier vos paramètres. N\'hésitez pas à me poser des questions sur la tarification, les relances, la TVA ou la gestion de clientèle.';
      }

      setChatHistory((prev) => [...prev, { role: 'assistant', content: response }]);
      setChatLoading(false);
    }, 1500);
  };

  const insightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-violet-500" />;
      default: return <Sparkles className="h-4 w-4 text-blue-500" />;
    }
  };

  const insightBg = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
      case 'success': return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20';
      case 'suggestion': return 'border-l-violet-500 bg-violet-50/50 dark:bg-violet-950/20';
      default: return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">IA Assistant</h1>
            <Badge className="gradient-primary text-white text-[10px]">Pro</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyses et recommandations personnalisées pour votre activité
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={generateInsights} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-1.5" />}
          Actualiser
        </Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Insights */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Target className="h-3.5 w-3.5" /> Recommandations
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : (
            insights.map((insight, i) => (
              <div
                key={i}
                className={`rounded-xl border-l-4 p-4 ${insightBg(insight.type)} opacity-0 animate-fade-in stagger-${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{insightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-1">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.message}</p>
                    {insight.action && insight.actionHref && (
                      <a
                        href={insight.actionHref}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        {insight.action} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="glass-card h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Posez une question
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat messages */}
              <div className="flex-1 space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                {chatHistory.length === 0 && (
                  <div className="text-center py-8">
                    <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-xs text-muted-foreground">
                      Posez des questions sur vos tarifs, la TVA, les relances, la gestion clients...
                    </p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'gradient-primary text-white'
                        : 'bg-muted'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Quel tarif pour du consulting IT ?"
                  className="min-h-[40px] max-h-[80px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChat();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="shrink-0 gradient-primary text-white"
                  onClick={handleChat}
                  disabled={chatLoading || !question.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Mes tarifs sont-ils corrects ?', 'Comment relancer un impayé ?', 'Seuils TVA 2025'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setQuestion(prompt); }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
