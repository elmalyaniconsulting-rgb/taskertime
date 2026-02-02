'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Building, CreditCard, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', phone: '', activite: '',
    siret: '', siren: '', tvaIntracom: '', rcs: '',
    capitalSocial: '', formeJuridique: '',
    adresseRue: '', adresseCP: '', adresseVille: '',
    tauxHoraireDefaut: '', tvaApplicable: false, tauxTva: '20',
    mentionTvaExo: 'TVA non applicable, art. 293 B du CGI',
    prefixeFacture: 'F', prefixeDevis: 'D',
    iban: '', bic: '', banque: '',
    numeroNda: '', certifQualiopi: false,
  });

  // Load settings from API
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          activite: data.activite || '',
          siret: data.siret || '',
          siren: data.siren || '',
          tvaIntracom: data.tvaIntracom || '',
          rcs: data.rcs || '',
          capitalSocial: data.capitalSocial ? String(data.capitalSocial) : '',
          formeJuridique: data.formeJuridique || '',
          adresseRue: data.adresseRue || '',
          adresseCP: data.adresseCP || '',
          adresseVille: data.adresseVille || '',
          tauxHoraireDefaut: data.tauxHoraireDefaut ? String(data.tauxHoraireDefaut) : '',
          tvaApplicable: data.tvaApplicable || false,
          tauxTva: data.tauxTva ? String(data.tauxTva) : '20',
          mentionTvaExo: data.mentionTvaExo || 'TVA non applicable, art. 293 B du CGI',
          prefixeFacture: data.prefixeFacture || 'F',
          prefixeDevis: data.prefixeDevis || 'D',
          iban: data.iban || '',
          bic: data.bic || '',
          banque: data.banque || '',
          numeroNda: data.numeroNda || '',
          certifQualiopi: data.certifQualiopi || false,
        });
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone || null,
          activite: profile.activite || null,
          siret: profile.siret || null,
          siren: profile.siren || null,
          tvaIntracom: profile.tvaIntracom || null,
          rcs: profile.rcs || null,
          capitalSocial: profile.capitalSocial ? parseFloat(profile.capitalSocial) : null,
          formeJuridique: profile.formeJuridique || null,
          adresseRue: profile.adresseRue || null,
          adresseCP: profile.adresseCP || null,
          adresseVille: profile.adresseVille || null,
          tauxHoraireDefaut: profile.tauxHoraireDefaut ? parseFloat(profile.tauxHoraireDefaut) : 0,
          tvaApplicable: profile.tvaApplicable,
          tauxTva: profile.tauxTva ? parseFloat(profile.tauxTva) : 20,
          mentionTvaExo: profile.mentionTvaExo || null,
          prefixeFacture: profile.prefixeFacture,
          prefixeDevis: profile.prefixeDevis,
          iban: profile.iban || null,
          bic: profile.bic || null,
          banque: profile.banque || null,
          numeroNda: profile.numeroNda || null,
          certifQualiopi: profile.certifQualiopi,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur serveur');
      }

      toast({ title: 'Paramètres sauvegardés', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Paramètres" />
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-1" />Profil</TabsTrigger>
          <TabsTrigger value="business"><Building className="h-4 w-4 mr-1" />Entreprise</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="h-4 w-4 mr-1" />Facturation</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" />Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Activité</Label>
                <Input value={profile.activite} onChange={(e) => setProfile({ ...profile, activite: e.target.value })} placeholder="Formateur, Consultant, Coach..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adresse professionnelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rue</Label>
                <Input value={profile.adresseRue} onChange={(e) => setProfile({ ...profile, adresseRue: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Code postal</Label>
                  <Input value={profile.adresseCP} onChange={(e) => setProfile({ ...profile, adresseCP: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Ville</Label>
                  <Input value={profile.adresseVille} onChange={(e) => setProfile({ ...profile, adresseVille: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identité juridique</CardTitle>
              <CardDescription>Informations légales obligatoires sur vos factures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Forme juridique</Label>
                <Input value={profile.formeJuridique} onChange={(e) => setProfile({ ...profile, formeJuridique: e.target.value })} placeholder="SASU, EURL, EI, Micro-entreprise..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SIRET</Label>
                  <Input value={profile.siret} onChange={(e) => setProfile({ ...profile, siret: e.target.value })} placeholder="14 chiffres" />
                </div>
                <div className="space-y-2">
                  <Label>SIREN</Label>
                  <Input value={profile.siren} onChange={(e) => setProfile({ ...profile, siren: e.target.value })} placeholder="9 chiffres" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>N° TVA intracommunautaire</Label>
                  <Input value={profile.tvaIntracom} onChange={(e) => setProfile({ ...profile, tvaIntracom: e.target.value })} placeholder="FR + 11 chiffres" />
                </div>
                <div className="space-y-2">
                  <Label>RCS</Label>
                  <Input value={profile.rcs} onChange={(e) => setProfile({ ...profile, rcs: e.target.value })} placeholder="Paris B 123 456 789" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capital social (€)</Label>
                  <Input type="number" value={profile.capitalSocial} onChange={(e) => setProfile({ ...profile, capitalSocial: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>N° NDA (formateur)</Label>
                  <Input value={profile.numeroNda} onChange={(e) => setProfile({ ...profile, numeroNda: e.target.value })} placeholder="11 chiffres" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={profile.certifQualiopi} onCheckedChange={(v) => setProfile({ ...profile, certifQualiopi: v })} />
                <Label>Certifié Qualiopi</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>TVA & Facturation</CardTitle>
              <CardDescription>Ces paramètres s&apos;appliquent à tous vos devis et factures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={profile.tvaApplicable} onCheckedChange={(v) => setProfile({ ...profile, tvaApplicable: v })} />
                <Label>TVA applicable</Label>
              </div>
              {profile.tvaApplicable ? (
                <div className="space-y-2">
                  <Label>Taux TVA par défaut (%)</Label>
                  <Input type="number" value={profile.tauxTva} onChange={(e) => setProfile({ ...profile, tauxTva: e.target.value })} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Mention d&apos;exonération TVA</Label>
                  <Textarea value={profile.mentionTvaExo} onChange={(e) => setProfile({ ...profile, mentionTvaExo: e.target.value })} rows={2} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Préfixe factures</Label>
                  <Input value={profile.prefixeFacture} onChange={(e) => setProfile({ ...profile, prefixeFacture: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Préfixe devis</Label>
                  <Input value={profile.prefixeDevis} onChange={(e) => setProfile({ ...profile, prefixeDevis: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Taux horaire par défaut (€/h)</Label>
                <Input type="number" value={profile.tauxHoraireDefaut} onChange={(e) => setProfile({ ...profile, tauxHoraireDefaut: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coordonnées bancaires</CardTitle>
              <CardDescription>Affichées sur vos factures pour les virements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={profile.iban} onChange={(e) => setProfile({ ...profile, iban: e.target.value })} placeholder="FR76 xxxx xxxx xxxx xxxx xxxx xxx" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BIC</Label>
                  <Input value={profile.bic} onChange={(e) => setProfile({ ...profile, bic: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Banque</Label>
                  <Input value={profile.banque} onChange={(e) => setProfile({ ...profile, banque: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Bientôt disponible — Configuration des relances automatiques et rappels</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-4 text-center">
                Les paramètres de notifications seront disponibles dans une prochaine version.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
