'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInvoices, useUpdateInvoice, useAddPayment } from '@/hooks/use-api';
import { PageHeader, StatusBadge, EmptyState, TableLoading, Currency } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, Receipt, MoreHorizontal, Eye, Send, CreditCard, Ban, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'BROUILLON', label: 'Brouillons' },
  { value: 'ENVOYEE', label: 'Envoyées' },
  { value: 'PARTIELLEMENT_PAYEE', label: 'Paiement partiel' },
  { value: 'PAYEE', label: 'Payées' },
  { value: 'EN_RETARD', label: 'En retard' },
  { value: 'ANNULEE', label: 'Annulées' },
];

export default function InvoicesPage() {
  const { toast } = useToast();
  const [statutFilter, setStatutFilter] = useState('');
  const [page, setPage] = useState(1);
  const [paymentDialog, setPaymentDialog] = useState<{ invoiceId: string; resteAPayer: number } | null>(null);
  const [paymentForm, setPaymentForm] = useState({ montant: '', mode: 'VIREMENT', reference: '', datePaiement: new Date().toISOString().split('T')[0] });

  const { data, isLoading } = useInvoices({ statut: statutFilter, page });
  const updateInvoice = useUpdateInvoice();
  const addPayment = useAddPayment();

  const handleStatusChange = async (id: string, statut: string) => {
    try {
      await updateInvoice.mutateAsync({ id, data: { statut } });
      toast({ title: `Facture ${statut === 'ENVOYEE' ? 'marquée comme envoyée' : 'annulée'}`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const openPayment = (invoiceId: string, resteAPayer: number) => {
    setPaymentForm({
      montant: resteAPayer.toFixed(2),
      mode: 'VIREMENT',
      reference: '',
      datePaiement: new Date().toISOString().split('T')[0],
    });
    setPaymentDialog({ invoiceId, resteAPayer });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDialog) return;
    try {
      await addPayment.mutateAsync({
        invoiceId: paymentDialog.invoiceId,
        data: {
          montant: parseFloat(paymentForm.montant),
          mode: paymentForm.mode,
          reference: paymentForm.reference || null,
          datePaiement: paymentForm.datePaiement,
        },
      });
      toast({ title: 'Paiement enregistré', variant: 'success' });
      setPaymentDialog(null);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const invoices = data?.invoices || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures"
        description={`${pagination?.total || 0} facture(s)`}
        action={
          <Link href="/invoices/new">
            <Button><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
          </Link>
        }
      />

      <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v === '_all' ? '' : v); setPage(1); }}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {STATUTS.map((s) => (
            <SelectItem key={s.value} value={s.value || '_all'}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <TableLoading rows={8} cols={6} />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6 text-muted-foreground" />}
          title="Aucune facture"
          description="Créez votre première facture ou convertissez un devis accepté."
          actionLabel="Nouvelle facture"
          onAction={() => window.location.href = '/invoices/new'}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Émission</TableHead>
                  <TableHead className="hidden md:table-cell">Échéance</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Reste dû</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => {
                  const isOverdue = !['PAYEE', 'ANNULEE', 'AVOIR'].includes(inv.statut) &&
                    new Date(inv.dateEcheance) < new Date();
                  return (
                    <TableRow key={inv.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">{inv.numero}</Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {inv.client.raisonSociale || `${inv.client.prenom || ''} ${inv.client.nom}`}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(inv.dateEmission)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(inv.dateEcheance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Currency amount={Number(inv.totalTTC)} className="font-medium" />
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        {Number(inv.resteAPayer) > 0 ? (
                          <Currency amount={Number(inv.resteAPayer)} className="text-destructive font-medium" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={isOverdue && inv.statut !== 'PAYEE' ? 'EN_RETARD' : inv.statut} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${inv.id}`}><Eye className="h-4 w-4 mr-2" />Voir</Link>
                            </DropdownMenuItem>
                            {inv.statut === 'BROUILLON' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(inv.id, 'ENVOYEE')}>
                                <Send className="h-4 w-4 mr-2" />Marquer envoyée
                              </DropdownMenuItem>
                            )}
                            {['ENVOYEE', 'VUE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'].includes(inv.statut) && (
                              <DropdownMenuItem onClick={() => openPayment(inv.id, Number(inv.resteAPayer))}>
                                <CreditCard className="h-4 w-4 mr-2" />Enregistrer un paiement
                              </DropdownMenuItem>
                            )}
                            {!['PAYEE', 'ANNULEE'].includes(inv.statut) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleStatusChange(inv.id, 'ANNULEE')}
                                >
                                  <Ban className="h-4 w-4 mr-2" />Annuler
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button>
              <span className="text-sm text-muted-foreground">Page {page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
            </div>
          )}
        </>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Montant (€) — Reste dû : {paymentDialog?.resteAPayer.toFixed(2)} €</Label>
              <Input
                type="number"
                step="0.01"
                max={paymentDialog?.resteAPayer}
                value={paymentForm.montant}
                onChange={(e) => setPaymentForm({ ...paymentForm, montant: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={paymentForm.mode} onValueChange={(v) => setPaymentForm({ ...paymentForm, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIREMENT">Virement</SelectItem>
                  <SelectItem value="CB">Carte bancaire</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                  <SelectItem value="ESPECES">Espèces</SelectItem>
                  <SelectItem value="PRELEVEMENT">Prélèvement</SelectItem>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Référence</Label>
              <Input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Optionnel" />
            </div>
            <div className="space-y-2">
              <Label>Date du paiement</Label>
              <Input type="date" value={paymentForm.datePaiement} onChange={(e) => setPaymentForm({ ...paymentForm, datePaiement: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialog(null)}>Annuler</Button>
              <Button type="submit" disabled={addPayment.isPending}>
                {addPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
