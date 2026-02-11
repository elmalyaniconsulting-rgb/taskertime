'use client';

import { useState } from 'react';
import { useContracts, useCreateContract, useUpdateContract } from '@/hooks/use-api';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useClients } from '@/hooks/use-api';
import { Plus, FileSignature, Loader2, Send, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ContractsPage() {
  const { toast } = useToast();
  const { data: contracts, isLoading } = useContracts();
  const { data: clientsData } = useClients();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nom: '', clientId: '', description: '' });

  const clients = clientsData?.clients || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContract.mutateAsync({
        nom: form.nom,
        clientId: form.clientId || null,
        description: form.description || null,
      });
      toast({ title: 'Contrat créé', variant: 'success' });
      setShowCreate(false);
      setForm({ nom: '', clientId: '', description: '' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: string, statut: string) => {
    try {
      await updateContract.mutateAsync({ id, data: { statut } });
      toast({ title: 'Statut mis à jour', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contrats"
        description={`${contracts?.length || 0} contrat(s)`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />Nouveau contrat
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !contracts || contracts.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-6 w-6 text-muted-foreground" />}
          title="Aucun contrat"
          description="Créez et gérez vos contrats clients."
          actionLabel="Nouveau contrat"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contracts.map((c: any) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{c.nom}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {c.client ? (c.client.raisonSociale || c.client.nom) : 'Pas de client'}
                    </p>
                  </div>
                  <StatusBadge status={c.statut} />
                </div>
              </CardHeader>
              <CardContent>
                {c.description && <p className="text-sm text-muted-foreground mb-3">{c.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                  <div className="flex gap-1">
                    {c.statut === 'BROUILLON' && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(c.id, 'ENVOYE')}>
                        <Send className="h-3.5 w-3.5 mr-1" />Envoyer
                      </Button>
                    )}
                    {['ENVOYE', 'VU'].includes(c.statut) && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(c.id, 'SIGNE')}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />Signé
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau contrat</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v === '_none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Aucun</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.raisonSociale || c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={createContract.isPending}>
                {createContract.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
