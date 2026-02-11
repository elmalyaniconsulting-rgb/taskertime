'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useInvoice, useUpdateInvoice } from '@/hooks/use-api';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, AlertTriangle, FileDown, Mail, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: invoice, isLoading, refetch } = useInvoice(params.id as string);
  const updateInvoice = useUpdateInvoice();

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

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

      // Copy to clipboard
      await navigator.clipboard.writeText(data.url);
      toast({ 
        title: 'Lien de paiement créé', 
        description: 'Le lien a été copié dans le presse-papier.',
        variant: 'success' 
      });

      // Option: open payment page
      window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsCreatingPayment(false);
  };

  const clientName = invoice.client.raisonSociale || `${invoice.client.prenom || ''} ${invoice.client.nom}`;
  const totalTTC = Number(invoice.totalTTC);
  const montantPaye = Number(invoice.montantPaye);
  const resteAPayer = Number(invoice.resteAPayer);
  const pctPaid = totalTTC > 0 ? (montantPaye / totalTTC) * 100 : 0;
  const isOverdue = !['PAYEE', 'ANNULEE', 'AVOIR'].includes(invoice.statut) && new Date(invoice.dateEcheance) < new Date();
  const hasTva = Number(invoice.totalTVA) > 0;
  const isPaid = invoice.statut === 'PAYEE';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader title={`Facture ${invoice.numero}`} description={clientName} />
        <div className="ml-auto">
          <StatusBadge status={isOverdue ? 'EN_RETARD' : invoice.statut} />
        </div>
      </div>

      {/* Paid success banner */}
      {isPaid && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4" />
          Facture entièrement payée
        </div>
      )}

      {/* Overdue warning */}
      {isOverdue && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          Facture en retard de {Math.abs(Math.floor((new Date().getTime() - new Date(invoice.dateEcheance).getTime()) / 86400000))} jour(s)
        </div>
      )}

      {/* Payment progress */}
      {!['BROUILLON', 'ANNULEE'].includes(invoice.statut) && (
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
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-muted-foreground">
                  Reste à payer : <Currency amount={resteAPayer} className="font-medium text-destructive" />
                </p>
                <Button onClick={handleCreatePaymentLink} disabled={isCreatingPayment} size="sm">
                  {isCreatingPayment ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Lien de paiement
                </Button>
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
        {resteAPayer > 0 && !['BROUILLON'].includes(invoice.statut) && (
          <Button onClick={handleCreatePaymentLink} disabled={isCreatingPayment}>
            {isCreatingPayment ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Créer lien Stripe
          </Button>
        )}
        <Button variant="outline" onClick={handleDownloadPdf}>
          <FileDown className="h-4 w-4 mr-2" />Télécharger PDF
        </Button>
      </div>

      {/* Invoice preview */}
      <Card>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">FACTURE</h2>
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
    </div>
  );
}
