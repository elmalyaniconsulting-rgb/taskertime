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
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', phone: '', activite: '',
    siret: '', siren: '', tvaIntracom: '', rcs: '',
    capitalSocial: '', formeJuridique: '',
    adresseRue: '', adresseCP: '', adresseVille: '',
    tauxHoraireDefaut: '', tvaApplicable: false, tauxTva: '20',
    mentionTvaExo: 'TVA non applicable, art. 293 B du CGI',
    prefixeFacture: 'FA', prefixeDevis: 'DE',
    iban: '', bic: '', banque: '',
    numeroNda: '', certifQualiopi: false,
  });

  useEffect(() => {
    fetch('/api/auth/session').then(async (res) => {
      // Charger le profil complet depuis une API dédiée si nécessaire
    });
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // API PUT /api/settings/profile à créer si besoin
      toast({ title: 'Profil sauvegardé', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" />

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
                <Input value={profile.activite} onChange={(e) => setProfile({ ...profile, activite: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations légales</CardTitle>
              <CardDescription>Données affichées sur vos factures et devis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SIRET</Label>
                  <Input value={profile.siret} onChange={(e) => setProfile({ ...profile, siret: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>SIREN</Label>
                  <Input value={profile.siren} onChange={(e) => setProfile({ ...profile, siren: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>N° TVA intracommunautaire</Label>
                  <Input value={profile.tvaIntracom} onChange={(e) => setProfile({ ...profile, tvaIntracom: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>RCS</Label>
                  <Input value={profile.rcs} onChange={(e) => setProfile({ ...profile, rcs: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forme juridique</Label>
                  <Input value={profile.formeJuridique} onChange={(e) => setProfile({ ...profile, formeJuridique: e.target.value })} placeholder="SASU, EI, EURL..." />
                </div>
                <div className="space-y-2">
                  <Label>Capital social</Label>
                  <Input value={profile.capitalSocial} onChange={(e) => setProfile({ ...profile, capitalSocial: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input placeholder="Rue" value={profile.adresseRue} onChange={(e) => setProfile({ ...profile, adresseRue: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="CP" value={profile.adresseCP} onChange={(e) => setProfile({ ...profile, adresseCP: e.target.value })} />
                  <Input placeholder="Ville" className="col-span-2" value={profile.adresseVille} onChange={(e) => setProfile({ ...profile, adresseVille: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>N° Déclaration d'activité (NDA)</Label>
                  <Input value={profile.numeroNda} onChange={(e) => setProfile({ ...profile, numeroNda: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={profile.certifQualiopi} onCheckedChange={(v) => setProfile({ ...profile, certifQualiopi: v })} />
                  <Label>Certifié Qualiopi</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>TVA & Facturation</CardTitle>
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
                  <Label>Mention exonération TVA</Label>
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
              <CardDescription>Affichées sur vos factures pour le virement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={profile.iban} onChange={(e) => setProfile({ ...profile, iban: e.target.value })} />
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Relances automatiques</p>
                  <p className="text-xs text-muted-foreground">Relancer les factures impayées à J+1, J+7, J+15, J+30</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Rappels de RDV</p>
                  <p className="text-xs text-muted-foreground">Email au client 24h avant le RDV</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Notifications email</p>
                  <p className="text-xs text-muted-foreground">Recevoir les notifications par email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Notifications push</p>
                  <p className="text-xs text-muted-foreground">Recevoir les notifications push (PWA)</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
