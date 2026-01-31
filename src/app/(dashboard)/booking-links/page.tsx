'use client';

import { useState } from 'react';
import { useAvailabilityLinks, useCreateAvailabilityLink, useUpdateAvailabilityLink, usePrestations } from '@/hooks/use-api';
import { PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Link2, Copy, ExternalLink, Loader2, Clock, Users } from 'lucide-react';

export default function BookingLinksPage() {
  const { toast } = useToast();
  const { data: links, isLoading } = useAvailabilityLinks();
  const { data: prestations } = usePrestations();
  const createLink = useCreateAvailabilityLink();
  const updateLink = useUpdateAvailabilityLink();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    nom: '', description: '', dureeMinutes: '60', prestationId: '',
    afficherTarif: false, acompteRequis: false, couleur: '#10B981',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLink.mutateAsync({
        nom: form.nom,
        description: form.description || null,
        dureeMinutes: parseInt(form.dureeMinutes),
        prestationId: form.prestationId || null,
        afficherTarif: form.afficherTarif,
        acompteRequis: form.acompteRequis,
        couleur: form.couleur,
      });
      toast({ title: 'Lien créé', variant: 'success' });
      setShowCreate(false);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Lien copié !' });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateLink.mutateAsync({ id, data: { isActive: !isActive } });
      toast({ title: isActive ? 'Lien désactivé' : 'Lien activé' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liens de réservation"
        description="Partagez ces liens pour que vos clients réservent directement"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />Nouveau lien
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !links || links.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-6 w-6 text-muted-foreground" />}
          title="Aucun lien de réservation"
          description="Créez un lien de type Calendly pour vos clients."
          actionLabel="Nouveau lien"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((link: any) => (
            <Card key={link.id} className={`relative ${!link.isActive ? 'opacity-60' : ''}`}>
              <div className="absolute top-0 left-0 w-full h-1 rounded-t" style={{ backgroundColor: link.couleur }} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{link.nom}</CardTitle>
                  <Switch checked={link.isActive} onCheckedChange={() => toggleActive(link.id, link.isActive)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {link.description && <p className="text-sm text-muted-foreground">{link.description}</p>}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {link.dureeMinutes} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {link._count.bookings} réservation(s)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    /book/{link.slug}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyLink(link.slug)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/book/${link.slug}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau lien de réservation</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required placeholder="Consultation initiale" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durée (min)</Label>
                <Input type="number" value={form.dureeMinutes} onChange={(e) => setForm({ ...form, dureeMinutes: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Input type="color" value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className="h-10 p-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prestation associée</Label>
              <Select value={form.prestationId} onValueChange={(v) => setForm({ ...form, prestationId: v === '_none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Aucune</SelectItem>
                  {(prestations || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.afficherTarif} onCheckedChange={(v) => setForm({ ...form, afficherTarif: v })} />
                <Label>Afficher le tarif</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.acompteRequis} onCheckedChange={(v) => setForm({ ...form, acompteRequis: v })} />
                <Label>Acompte requis</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={createLink.isPending}>
                {createLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
