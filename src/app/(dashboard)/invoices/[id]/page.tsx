'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useInvoice, useUpdateInvoice, useAddPayment } from '@/hooks/use-api';
import { PageHeader, StatusBadge, Currency } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, AlertTriangle, FileDown, Mail, CreditCard, Loader2, CheckCircle, Banknote, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: invoice, isLoading, refetch } = useInvoice(params.id as string);
  const updateInvoice = useUpdateInvoice();
  const addPayment = useAddPayment();

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCreditNoteConfirm, setShowCreditNoteConfirm] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    montant: '',
    mode: 'VIREMENT' as string,
    reference: '',
    datePaiement: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Handle payment callback
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast({ title: 'Paiement réussi !', description: 'Le paiement a été traité avec succès.', variant: 'success' });
      refetch();
      router.replace(`/invoices/${params.id}`);
    } else if (payment === 'cancelled') {
      toast({ title: 'Paiement annulé', description: 'Le paiement a été annulé.' });
      router.replace(`/invoices/${params.id}`);
    }
  }, [searchParams, params.id, router, toast, refetch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Facture introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/invoices')}>Retour</Button>
      </div>
    );
  }

  const handleStatus = async (statut: string) => {
    try {
      await updateInvoice.mutateAsync({ id: invoice.id, data: { statut } });
      toast({ title: 'Statut mis à jour', variant: 'success' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: emailMessage }),
      });
      const data = await res.json();

      if (data.fallback === 'mailto') {
        const mailtoUrl = `mailto:${data.to}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
        window.open(mailtoUrl, '_blank');
        toast({ title: 'Client mail ouvert' });
        refetch();
      } else if (res.ok) {
        toast({ title: 'Email envoyé', variant: 'success' });
        refetch();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsSending(false);
    setShowEmailDialog(false);
    setEmailMessage('');
  };

  const handleCreatePaymentLink = async () => {
    setIsCreatingPayment(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payment`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        if (data.needsSetup) {
          toast({ 
            title: 'Stripe non configuré', 
            description: data.message || 'Connectez votre compte Stripe dans Paramètres.',
            variant: 'destructive' 
          });
          return;
        }
        throw new Error(data.error || 'Erreur création lien');
      }

      await navigator.clipboard.writeText(data.url);
      toast({ 
        title: 'Lien de paiement créé', 
        description: 'Le lien a été copié dans le presse-papier.',
        variant: 'success' 
      });
      window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsCreatingPayment(false);
  };

  // Record manual payment — NEW
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPayment.mutateAsync({
        invoiceId: invoice.id,
        data: {
          montant: parseFloat(paymentForm.montant),
          mode: paymentForm.mode,
          reference: paymentForm.reference || null,
          datePaiement: new Date(paymentForm.datePaiement).toISOString(),
          notes: paymentForm.notes || null,
        },
      });
      toast({ title: 'Paiement enregistré', variant: 'success' });
      setShowPaymentDialog(false);
      setPaymentForm({ montant: '', mode: 'VIREMENT', reference: '', datePaiement: new Date().toISOString().split('T')[0], notes: '' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  // Create credit note — NEW
  const handleCreateCreditNote = async () => {
    try {
      await updateInvoice.mutateAsync({ id: invoice.id, data: { statut: 'AVOIR' } });
      toast({ title: 'Facture d\'avoir créée', description: 'La facture a été convertie en avoir.', variant: 'success' });
      setShowCreditNoteConfirm(false);
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const clientName = invoice.client.raisonSociale || `${invoice.client.prenom || ''} ${invoice.client.nom}`;
  const totalTTC = Number(invoice.totalTTC);
  const montantPaye = Number(invoice.montantPaye);
  const resteAPayer = Number(invoice.resteAPayer);
  const pctPaid = totalTTC > 0 ? (montantPaye / totalTTC) * 100 : 0;
  const isOverdue = !['PAYEE', 'ANNULEE', 'AVOIR'].includes(invoice.statut) && new Date(invoice.dateEcheance) < new Date();
  const hasTva = Number(invoice.totalTVA) > 0;
  const isPaid = invoice.statut === 'PAYEE';
  const isCreditNote = invoice.statut === 'AVOIR';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader title={`${isCreditNote ? 'Avoir' : 'Facture'} ${invoice.numero}`} description={clientName} />
        <div className="ml-auto">
          <StatusBadge status={isOverdue ? 'EN_RETARD' : invoice.statut} />
        </div>
      </div>

      {isPaid && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4" />
          Facture entièrement payée
        </div>
      )}

      {isCreditNote && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-700 text-sm">
          <FileText className="h-4 w-4" />
          Facture d&apos;avoir — annule et remplace la facture originale
        </div>
      )}

      {isOverdue && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          Facture en retard de {Math.abs(Math.floor((new Date().getTime() - new Date(invoice.dateEcheance).getTime()) / 86400000))} jour(s)
        </div>
      )}

      {/* Payment progress */}
      {!['BROUILLON', 'ANNULEE', 'AVOIR'].includes(invoice.statut) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Paiement</span>
              <span className="text-sm">
                <Currency amount={montantPaye} /> / <Currency amount={totalTTC} />
              </span>
            </div>
            <Progress value={pctPaid} className="h-3" />
            {resteAPayer > 0 && (
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <p className="text-sm text-muted-foreground">
                  Reste à payer : <Currency amount={resteAPayer} className="font-medium text-destructive" />
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => { setPaymentForm(f => ({ ...f, montant: resteAPayer.toFixed(2) })); setShowPaymentDialog(true); }} size="sm" variant="outline">
                    <Banknote className="h-4 w-4 mr-2" />
                    Encaisser
                  </Button>
                  <Button onClick={handleCreatePaymentLink} disabled={isCreatingPayment} size="sm">
                    {isCreatingPayment ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Lien Stripe
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {invoice.statut === 'BROUILLON' && (
          <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
            <Mail className="h-4 w-4 mr-2" />Envoyer au client
          </Button>
        )}
        {['ENVOYEE', 'VUE'].includes(invoice.statut) && (
          <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
            <Mail className="h-4 w-4 mr-2" />Renvoyer
          </Button>
        )}
        {resteAPayer > 0 && !['BROUILLON', 'AVOIR'].includes(invoice.statut) && (
          <>
            <Button variant="outline" onClick={() => { setPaymentForm(f => ({ ...f, montant: resteAPayer.toFixed(2) })); setShowPaymentDialog(true); }}>
              <Banknote className="h-4 w-4 mr-2" />
              Enregistrer un paiement
            </Button>
            <Button onClick={handleCreatePaymentLink} disabled={isCreatingPayment}>
              {isCreatingPayment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Créer lien Stripe
            </Button>
          </>
        )}
        <Button variant="outline" onClick={handleDownloadPdf}>
          <FileDown className="h-4 w-4 mr-2" />Télécharger PDF
        </Button>
        {!['AVOIR', 'ANNULEE', 'BROUILLON'].includes(invoice.statut) && (
          <Button variant="outline" onClick={() => setShowCreditNoteConfirm(true)} className="text-orange-600 hover:text-orange-700">
            <FileText className="h-4 w-4 mr-2" />
            Facture d&apos;avoir
          </Button>
        )}
      </div>

      {/* Invoice preview */}
      <Card>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">{isCreditNote ? 'AVOIR' : 'FACTURE'}</h2>
              <p className="text-lg font-semibold text-primary">{invoice.numero}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Date d&apos;émission : {formatDate(invoice.dateEmission)}
              </p>
              <p className="text-sm text-muted-foreground">
                Échéance : {formatDate(invoice.dateEcheance)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{clientName}</p>
              {invoice.client.adresseRue && <p className="text-sm">{invoice.client.adresseRue}</p>}
              {(invoice.client.adresseCP || invoice.client.adresseVille) && (
                <p className="text-sm">{invoice.client.adresseCP} {invoice.client.adresseVille}</p>
              )}
              <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
            </div>
          </div>

          <Separator />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Description</TableHead>
                <TableHead className="text-right">Qté</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">PU HT</TableHead>
                {hasTva && <TableHead className="text-right">TVA</TableHead>}
                <TableHead className="text-right">Total HT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell><p className="font-medium text-sm">{line.description}</p></TableCell>
                  <TableCell className="text-right">{Number(line.quantite)}</TableCell>
                  <TableCell>{line.unite}</TableCell>
                  <TableCell className="text-right"><Currency amount={Number(line.prixUnitaire)} /></TableCell>
                  {hasTva && <TableCell className="text-right">{Number(line.tauxTva)}%</TableCell>}
                  <TableCell className="text-right font-medium"><Currency amount={Number(line.totalHT)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total HT</span>
                <Currency amount={Number(invoice.totalHT)} className="font-medium" />
              </div>
              {hasTva && (
                <div className="flex justify-between text-sm">
                  <span>TVA</span>
                  <Currency amount={Number(invoice.totalTVA)} />
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total TTC</span>
                <Currency amount={totalTTC} />
              </div>
            </div>
          </div>

          {invoice.mentionsLegales && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">{invoice.mentionsLegales}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment history */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Historique des paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.datePaiement)}</TableCell>
                    <TableCell><Badge variant="outline">{p.mode}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{p.reference || '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      <Currency amount={Number(p.montant)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer la facture par email</DialogTitle>
            <DialogDescription>
              La facture sera envoyée à <strong>{invoice.client.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message personnalisé (optionnel)</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
                placeholder="Ajoutez un message pour votre client..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Annuler</Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Payment Dialog — NEW */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Enregistrer un paiement
            </DialogTitle>
            <DialogDescription>
              Reste à payer : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(resteAPayer)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={resteAPayer}
                  value={paymentForm.montant}
                  onChange={(e) => setPaymentForm({ ...paymentForm, montant: e.target.value })}
                  required
                  placeholder={resteAPayer.toFixed(2)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mode de paiement *</Label>
                <Select value={paymentForm.mode} onValueChange={(v) => setPaymentForm({ ...paymentForm, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIREMENT">Virement</SelectItem>
                    <SelectItem value="CHEQUE">Chèque</SelectItem>
                    <SelectItem value="CB">Carte bancaire</SelectItem>
                    <SelectItem value="ESPECES">Espèces</SelectItem>
                    <SelectItem value="PRELEVEMENT">Prélèvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date du paiement</Label>
                <Input
                  type="date"
                  value={paymentForm.datePaiement}
                  onChange={(e) => setPaymentForm({ ...paymentForm, datePaiement: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Référence</Label>
                <Input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="N° chèque, virement..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
                placeholder="Informations complémentaires..."
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-sm">
              {parseFloat(paymentForm.montant) < resteAPayer && parseFloat(paymentForm.montant) > 0
                ? `Paiement partiel — il restera ${(resteAPayer - parseFloat(paymentForm.montant)).toFixed(2)} € à payer`
                : parseFloat(paymentForm.montant) >= resteAPayer
                  ? 'Paiement total — la facture sera marquée comme payée'
                  : 'Saisissez le montant encaissé'
              }
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>Annuler</Button>
              <Button type="submit" disabled={addPayment.isPending || !paymentForm.montant}>
                {addPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credit Note Confirm — NEW */}
      <Dialog open={showCreditNoteConfirm} onOpenChange={setShowCreditNoteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une facture d&apos;avoir</DialogTitle>
            <DialogDescription>
              Cette action convertira la facture {invoice.numero} en avoir. Le statut sera changé et la facture ne pourra plus être encaissée. Confirmez-vous ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditNoteConfirm(false)}>Annuler</Button>
            <Button onClick={handleCreateCreditNote} className="bg-orange-600 hover:bg-orange-700 text-white">
              Confirmer l&apos;avoir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
