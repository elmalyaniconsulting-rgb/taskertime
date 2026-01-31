'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClients, usePrestations, useCreateInvoice } from '@/hooks/use-api';
import { PageHeader } from '@/components/shared';
import { DocumentLinesEditor, DocumentLine } from '@/components/forms/document-lines-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: clientsData } = useClients();
  const { data: prestations } = usePrestations();
  const createInvoice = useCreateInvoice();

  const clients = clientsData?.clients || [];
  const defaultEcheance = new Date();
  defaultEcheance.setDate(defaultEcheance.getDate() + 30);

  const [form, setForm] = useState({
    clientId: '',
    dateEcheance: defaultEcheance.toISOString().split('T')[0],
    conditions: 'Paiement à 30 jours à réception de facture.',
    notes: '',
    mentionsLegales: 'TVA non applicable, art. 293 B du CGI',
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

  // Mettre à jour l'échéance quand on change de client
  const handleClientChange = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    if (client) {
      const echeance = new Date();
      echeance.setDate(echeance.getDate() + (client.delaiPaiement || 30));
      setForm({
        ...form,
        clientId,
        dateEcheance: echeance.toISOString().split('T')[0],
      });
    } else {
      setForm({ ...form, clientId });
    }
  };

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
      const invoice = await createInvoice.mutateAsync({
        clientId: form.clientId,
        dateEcheance: form.dateEcheance,
        conditions: form.conditions || null,
        notes: form.notes || null,
        mentionsLegales: form.mentionsLegales || null,
        lines: validLines.map((l) => ({
          prestationId: l.prestationId || null,
          description: l.description,
          quantite: l.quantite,
          unite: l.unite,
          prixUnitaire: l.prixUnitaire,
          tauxTva: l.tauxTva,
        })),
      });

      toast({ title: 'Facture créée', description: `Numéro : ${invoice.numero}`, variant: 'success' });
      router.push('/invoices');
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
        <PageHeader title="Nouvelle facture" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  onValueChange={handleClientChange}
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
                <Label>Date d'échéance</Label>
                <Input
                  type="date"
                  value={form.dateEcheance}
                  onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mentions & conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mentions légales</Label>
              <Textarea
                value={form.mentionsLegales}
                onChange={(e) => setForm({ ...form, mentionsLegales: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Conditions de paiement</Label>
              <Textarea
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                rows={2}
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={createInvoice.isPending}>
            {createInvoice.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Créer la facture
          </Button>
        </div>
      </form>
    </div>
  );
}
