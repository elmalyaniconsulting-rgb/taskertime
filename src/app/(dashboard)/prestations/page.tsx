'use client';

import { useState } from 'react';
import { usePrestations, useCreatePrestation, useUpdatePrestation, useDeletePrestation } from '@/hooks/use-api';
import { PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Briefcase, Clock, Euro, Pencil, Trash2, Loader2 } from 'lucide-react';

const EMPTY_FORM = {
  nom: '',
  description: '',
  typeTarif: 'HORAIRE',
  tauxHoraire: '',
  prixForfait: '',
  dureeMinutes: '60',
  categorie: '',
  couleur: '#3B82F6',
  isActive: true,
};

export default function PrestationsPage() {
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const { data: prestations, isLoading } = usePrestations(!showAll);
  const createPrestation = useCreatePrestation();
  const updatePrestation = useUpdatePrestation();
  const delPrestation = useDeletePrestation();

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      nom: p.nom,
      description: p.description || '',
      typeTarif: p.typeTarif,
      tauxHoraire: p.tauxHoraire ? String(Number(p.tauxHoraire)) : '',
      prixForfait: p.prixForfait ? String(Number(p.prixForfait)) : '',
      dureeMinutes: String(p.dureeMinutes),
      categorie: p.categorie || '',
      couleur: p.couleur || '#3B82F6',
      isActive: p.isActive,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nom: form.nom,
      description: form.description || null,
      typeTarif: form.typeTarif,
      tauxHoraire: form.tauxHoraire ? parseFloat(form.tauxHoraire) : null,
      prixForfait: form.prixForfait ? parseFloat(form.prixForfait) : null,
      dureeMinutes: parseInt(form.dureeMinutes),
      categorie: form.categorie || null,
      couleur: form.couleur,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await updatePrestation.mutateAsync({ id: editingId, data: payload });
        toast({ title: 'Prestation modifiée', variant: 'success' });
      } else {
        await createPrestation.mutateAsync(payload);
        toast({ title: 'Prestation créée', variant: 'success' });
      }
      setShowDialog(false);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await delPrestation.mutateAsync(deleteId);
      toast({ title: 'Prestation supprimée' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const isPending = createPrestation.isPending || updatePrestation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue de prestations"
        description="Vos services et tarifs"
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={showAll} onCheckedChange={setShowAll} />
              <span>Afficher les inactives</span>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle prestation
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !prestations || prestations.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6 text-muted-foreground" />}
          title="Aucune prestation"
          description="Créez votre catalogue de services pour les ajouter facilement à vos devis et factures."
          actionLabel="Nouvelle prestation"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prestations.map((p: any) => (
            <Card key={p.id} className={`relative ${!p.isActive ? 'opacity-60' : ''}`}>
              <div className="absolute top-0 left-0 w-full h-1 rounded-t" style={{ backgroundColor: p.couleur }} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{p.nom}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {p.typeTarif === 'FORFAIT'
                        ? `${Number(p.prixForfait).toFixed(0)} € forfait`
                        : p.typeTarif === 'JOURNALIER'
                        ? `${Number(p.tauxHoraire).toFixed(0)} €/jour`
                        : `${Number(p.tauxHoraire).toFixed(0)} €/h`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{p.dureeMinutes} min</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {p.categorie && <Badge variant="outline">{p.categorie}</Badge>}
                  {!p.isActive && <Badge variant="secondary">Inactive</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {p._count.invoiceLines + p._count.quoteLines} utilisation(s)
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier la prestation' : 'Nouvelle prestation'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de tarif</Label>
                <Select value={form.typeTarif} onValueChange={(v) => setForm({ ...form, typeTarif: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HORAIRE">Horaire (€/h)</SelectItem>
                    <SelectItem value="JOURNALIER">Journalier (€/jour)</SelectItem>
                    <SelectItem value="FORFAIT">Forfait (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.typeTarif === 'FORFAIT' ? (
                <div className="space-y-2">
                  <Label>Prix forfait (€)</Label>
                  <Input type="number" step="0.01" value={form.prixForfait} onChange={(e) => setForm({ ...form, prixForfait: e.target.value })} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Taux {form.typeTarif === 'JOURNALIER' ? '(€/jour)' : '(€/h)'}</Label>
                  <Input type="number" step="0.01" value={form.tauxHoraire} onChange={(e) => setForm({ ...form, tauxHoraire: e.target.value })} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Durée (min)</Label>
                <Input type="number" value={form.dureeMinutes} onChange={(e) => setForm({ ...form, dureeMinutes: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="Formation" />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Input type="color" value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className="h-10 p-1" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette prestation ?</AlertDialogTitle>
            <AlertDialogDescription>Elle ne sera plus disponible dans les devis et factures.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
