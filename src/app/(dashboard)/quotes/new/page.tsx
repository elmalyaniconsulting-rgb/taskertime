'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClients, usePrestations, useCreateQuote } from '@/hooks/use-api';
import { PageHeader } from '@/components/shared';
import { DocumentLinesEditor, DocumentLine } from '@/components/forms/document-lines-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function NewQuotePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: clientsData } = useClients();
  const { data: prestations } = usePrestations();
  const createQuote = useCreateQuote();

  const clients = clientsData?.clients || [];
  const defaultValidite = new Date();
  defaultValidite.setDate(defaultValidite.getDate() + 30);

  const [form, setForm] = useState({
    clientId: '',
    dateValidite: defaultValidite.toISOString().split('T')[0],
    conditions: '',
    notes: '',
    acompteRequis: false,
    acomptePourcent: '30',
  });

  const [lines, setLines] = useState<DocumentLine[]>([
    {
      prestationId: '',
      description: '',
      quantite: 1,
      unite: 'heure',
      prixUnitaire: 0,
      tauxTva: 0,
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clientId) {
      toast({ title: 'Erreur', description: 'Sélectionnez un client', variant: 'destructive' });
      return;
    }

    const validLines = lines.filter((l) => l.description.trim() && l.prixUnitaire > 0);
    if (validLines.length === 0) {
      toast({ title: 'Erreur', description: 'Ajoutez au moins une ligne avec un prix', variant: 'destructive' });
      return;
    }

    try {
      const quote = await createQuote.mutateAsync({
        clientId: form.clientId,
        dateValidite: form.dateValidite,
        conditions: form.conditions || null,
        notes: form.notes || null,
        acompteRequis: form.acompteRequis,
        acomptePourcent: form.acompteRequis ? parseFloat(form.acomptePourcent) : null,
        lines: validLines.map((l) => ({
          prestationId: l.prestationId || null,
          description: l.description,
          quantite: l.quantite,
          unite: l.unite,
          prixUnitaire: l.prixUnitaire,
          tauxTva: l.tauxTva,
        })),
      });

      toast({ title: 'Devis créé', description: `Numéro : ${quote.numero}`, variant: 'success' });
      router.push('/quotes');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader title="Nouveau devis" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm({ ...form, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.raisonSociale || `${c.prenom || ''} ${c.nom}`} — {c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de validité</Label>
                <Input
                  type="date"
                  value={form.dateValidite}
                  onChange={(e) => setForm({ ...form, dateValidite: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.acompteRequis}
                  onCheckedChange={(v) => setForm({ ...form, acompteRequis: v })}
                />
                <Label>Acompte requis</Label>
              </div>
              {form.acompteRequis && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={form.acomptePourcent}
                    onChange={(e) => setForm({ ...form, acomptePourcent: e.target.value })}
                    className="w-20"
                  />
                  <span className="text-sm">%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardContent className="pt-6">
            <DocumentLinesEditor
              lines={lines}
              onChange={setLines}
              prestations={prestations || []}
              tvaApplicable={false}
              defaultTva={0}
            />
          </CardContent>
        </Card>

        {/* Notes & conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes & conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Conditions de paiement</Label>
              <Textarea
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                rows={2}
                placeholder="Ex: Paiement à 30 jours à réception de facture"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes internes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Non visible par le client"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={createQuote.isPending}>
            {createQuote.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Créer le devis
          </Button>
        </div>
      </form>
    </div>
  );
}
