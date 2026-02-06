'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  User,
  Building2,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const steps = [
  { icon: User, title: 'Votre profil', description: 'Informations personnelles' },
  { icon: Building2, title: 'Votre activité', description: 'Informations professionnelles' },
  { icon: CreditCard, title: 'Facturation', description: 'Préférences de facturation' },
  { icon: CheckCircle2, title: 'Terminé !', description: 'Bienvenue sur TaskerTime' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    // Step 1 - Profil
    firstName: '',
    lastName: '',
    phone: '',
    // Step 2 - Activité
    activite: '',
    formeJuridique: '',
    siret: '',
    adresseRue: '',
    adresseCP: '',
    adresseVille: '',
    // Step 3 - Facturation
    tvaApplicable: false,
    tauxTva: '20',
    tauxHoraireDefaut: '',
    prefixeFacture: 'F',
    prefixeDevis: 'D',
    iban: '',
    bic: '',
  });

  const updateData = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tauxTva: parseFloat(data.tauxTva) || 20,
          tauxHoraireDefaut: parseFloat(data.tauxHoraireDefaut) || 0,
        }),
      });
      router.push('/dashboard?welcome=true');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return data.firstName.length > 0 && data.lastName.length > 0;
    if (step === 1) return data.activite.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Clock className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">TaskerTime</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {/* Step header */}
          <div className="flex items-center gap-3 mb-6">
            {(() => {
              const Icon = steps[step].icon;
              return <Icon className="h-6 w-6 text-primary" />;
            })()}
            <div>
              <h2 className="font-semibold">{steps[step].title}</h2>
              <p className="text-sm text-muted-foreground">{steps[step].description}</p>
            </div>
            <Badge variant="outline" className="ml-auto">
              {step + 1}/{steps.length}
            </Badge>
          </div>

          {/* Step 1 - Profil */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={data.firstName}
                    onChange={(e) => updateData('firstName', e.target.value)}
                    placeholder="Mehdi"
                  />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={data.lastName}
                    onChange={(e) => updateData('lastName', e.target.value)}
                    placeholder="Dupont"
                  />
                </div>
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={data.phone}
                  onChange={(e) => updateData('phone', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          )}

          {/* Step 2 - Activité */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Activité *</Label>
                <Input
                  value={data.activite}
                  onChange={(e) => updateData('activite', e.target.value)}
                  placeholder="Consultant IT, Coach, Formateur..."
                />
              </div>
              <div>
                <Label>Forme juridique</Label>
                <Select
                  value={data.formeJuridique}
                  onValueChange={(v) => updateData('formeJuridique', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EI">Entreprise individuelle</SelectItem>
                    <SelectItem value="MICRO">Micro-entreprise</SelectItem>
                    <SelectItem value="EURL">EURL</SelectItem>
                    <SelectItem value="SASU">SASU</SelectItem>
                    <SelectItem value="SARL">SARL</SelectItem>
                    <SelectItem value="SAS">SAS</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SIRET</Label>
                <Input
                  value={data.siret}
                  onChange={(e) => updateData('siret', e.target.value)}
                  placeholder="123 456 789 00012"
                  maxLength={17}
                />
              </div>
              <div>
                <Label>Adresse</Label>
                <Input
                  value={data.adresseRue}
                  onChange={(e) => updateData('adresseRue', e.target.value)}
                  placeholder="Rue"
                  className="mb-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={data.adresseCP}
                    onChange={(e) => updateData('adresseCP', e.target.value)}
                    placeholder="CP"
                  />
                  <Input
                    value={data.adresseVille}
                    onChange={(e) => updateData('adresseVille', e.target.value)}
                    placeholder="Ville"
                    className="col-span-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Facturation */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">Assujetti à la TVA</Label>
                  <p className="text-xs text-muted-foreground">
                    Si non, mention &quot;TVA non applicable, art. 293 B du CGI&quot;
                  </p>
                </div>
                <Switch
                  checked={data.tvaApplicable}
                  onCheckedChange={(v) => updateData('tvaApplicable', v)}
                />
              </div>
              {data.tvaApplicable && (
                <div>
                  <Label>Taux TVA (%)</Label>
                  <Input
                    type="number"
                    value={data.tauxTva}
                    onChange={(e) => updateData('tauxTva', e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label>Taux horaire par défaut (€)</Label>
                <Input
                  type="number"
                  value={data.tauxHoraireDefaut}
                  onChange={(e) => updateData('tauxHoraireDefaut', e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Préfixe facture</Label>
                  <Input
                    value={data.prefixeFacture}
                    onChange={(e) => updateData('prefixeFacture', e.target.value)}
                    placeholder="F"
                  />
                </div>
                <div>
                  <Label>Préfixe devis</Label>
                  <Input
                    value={data.prefixeDevis}
                    onChange={(e) => updateData('prefixeDevis', e.target.value)}
                    placeholder="D"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>IBAN</Label>
                  <Input
                    value={data.iban}
                    onChange={(e) => updateData('iban', e.target.value)}
                    placeholder="FR76 1234..."
                  />
                </div>
                <div>
                  <Label>BIC</Label>
                  <Input
                    value={data.bic}
                    onChange={(e) => updateData('bic', e.target.value)}
                    placeholder="BNPAFRPP"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Terminé */}
          {step === 3 && (
            <div className="text-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Votre compte est prêt !</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Vous êtes sur le plan Gratuit. Vous pouvez commencer à utiliser TaskerTime immédiatement.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 text-left text-sm space-y-2 mb-4">
                <p>Prochaines étapes recommandées :</p>
                <p className="text-muted-foreground">1. Créez votre première prestation</p>
                <p className="text-muted-foreground">2. Ajoutez un client</p>
                <p className="text-muted-foreground">3. Envoyez votre premier devis</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            {step > 0 && step < 3 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            ) : (
              <div />
            )}

            {step < 2 && (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === 2 && (
              <Button onClick={() => { handleSave(); setStep(3); }} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Terminer
              </Button>
            )}

            {step === 3 && (
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Accéder à mon tableau de bord
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Skip */}
        {step < 3 && (
          <p className="text-center mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Passer pour le moment
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
