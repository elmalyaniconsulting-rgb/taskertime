'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useClients, useCreateClient, useDeleteClient } from '@/hooks/use-api';
import { PageHeader, StatusBadge, EmptyState, TableLoading, Currency } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, MoreHorizontal, Eye, Pencil, Trash2, Loader2, Building2, User } from 'lucide-react';

const CLIENT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'PARTICULIER', label: 'Particulier' },
  { value: 'ENTREPRISE', label: 'Entreprise' },
  { value: 'ASSOCIATION', label: 'Association' },
  { value: 'ETABLISSEMENT_PUBLIC', label: 'Établissement public' },
];

export default function ClientsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useClients({ search, type: typeFilter, page });
  const createClient = useCreateClient();
  const delClient = useDeleteClient();

  const [form, setForm] = useState({
    type: 'PARTICULIER',
    nom: '',
    prenom: '',
    raisonSociale: '',
    email: '',
    telephone: '',
    adresseRue: '',
    adresseCP: '',
    adresseVille: '',
    siret: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({ type: 'PARTICULIER', nom: '', prenom: '', raisonSociale: '', email: '', telephone: '', adresseRue: '', adresseCP: '', adresseVille: '', siret: '', notes: '' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClient.mutateAsync(form);
      toast({ title: 'Client créé', variant: 'success' });
      setShowCreate(false);
      resetForm();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await delClient.mutateAsync(deleteId);
      toast({ title: 'Client supprimé' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const clients = data?.clients || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={`${pagination?.total || 0} client(s)`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {CLIENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value || '_all'}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableLoading rows={8} cols={5} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6 text-muted-foreground" />}
          title="Aucun client"
          description="Ajoutez votre premier client pour commencer à créer des devis et factures."
          actionLabel="Nouveau client"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Factures</TableHead>
                  <TableHead className="hidden lg:table-cell">Devis</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client: any) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="hover:underline">
                        <div className="flex items-center gap-2">
                          {client.type === 'ENTREPRISE' ? (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">
                              {client.raisonSociale || `${client.prenom || ''} ${client.nom}`}
                            </p>
                            {client.raisonSociale && (
                              <p className="text-xs text-muted-foreground">
                                {client.prenom} {client.nom}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{client.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {client.email}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {client._count.invoices}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {client._count.quotes}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}`}>
                              <Eye className="h-4 w-4 mr-2" />Voir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}?edit=true`}>
                              <Pencil className="h-4 w-4 mr-2" />Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(client.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>Ajoutez les informations du client</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTICULIER">Particulier</SelectItem>
                  <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
                  <SelectItem value="ASSOCIATION">Association</SelectItem>
                  <SelectItem value="ETABLISSEMENT_PUBLIC">Établissement public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type !== 'PARTICULIER' && (
              <div className="space-y-2">
                <Label>Raison sociale</Label>
                <Input value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input placeholder="Rue" value={form.adresseRue} onChange={(e) => setForm({ ...form, adresseRue: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="CP" value={form.adresseCP} onChange={(e) => setForm({ ...form, adresseCP: e.target.value })} />
                <Input placeholder="Ville" className="col-span-2" value={form.adresseVille} onChange={(e) => setForm({ ...form, adresseVille: e.target.value })} />
              </div>
            </div>

            {form.type !== 'PARTICULIER' && (
              <div className="space-y-2">
                <Label>SIRET</Label>
                <Input value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
