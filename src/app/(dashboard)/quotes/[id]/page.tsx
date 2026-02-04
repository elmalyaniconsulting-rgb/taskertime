'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuote, useUpdateQuote, useConvertQuote } from '@/hooks/use-api';
import { PageHeader, StatusBadge, Currency } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Send, CheckCircle, XCircle, ArrowRightLeft,
  FileDown, Mail, CreditCard, Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: quote, isLoading, refetch } = useQuote(params.id as string);
  const updateQuote = useUpdateQuote();
  const convertQuote = useConvertQuote();

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Handle payment callback
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast({ title: 'Acompte payé !', description: 'L\'acompte a été reçu. Devis accepté.', variant: 'success' });
      refetch();
      router.replace(`/quotes/${params.id}`);
    } else if (payment === 'cancelled') {
      toast({ title: 'Paiement annulé' });
      router.replace(`/quotes/${params.id}`);
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

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Devis introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/quotes')}>Retour</Button>
      </div>
    );
  }

  const handleStatus = async (statut: string) => {
    try {
      await updateQuote.mutateAsync({ id: quote.id, data: { statut } });
      toast({ title: 'Statut mis à jour', variant: 'success' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleConvert = async () => {
    try {
      await convertQuote.mutateAsync(quote.id);
      toast({ title: 'Devis converti en facture', variant: 'success' });
      router.push('/invoices');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/quotes/${quote.id}/pdf`, '_blank');
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/send`, {
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
      const res = await fetch(`/api/quotes/${quote.id}/payment`, { method: 'POST' });
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
        description: 'Le lien a été copié. Le client peut payer l\'acompte.',
        variant: 'success' 
      });

      window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsCreatingPayment(false);
  };

  const clientName = quote.client.raisonSociale || `${quote.client.prenom || ''} ${quote.client.nom}`;
  const hasTva = Number(quote.totalTVA) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`Devis ${quote.numero}`}
          description={clientName}
        />
        <div className="ml-auto"><StatusBadge status={quote.statut} /></div>
      </div>

      {/* Acompte card if required */}
      {quote.acompteRequis && quote.acompteMontant && ['ENVOYE', 'VU'].includes(quote.statut) && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Acompte requis : {Number(quote.acomptePourcent)}%</p>
                <p className="text-2xl font-bold text-primary">
                  <Currency amount={Number(quote.acompteMontant)} />
                </p>
              </div>
              <Button onClick={handleCreatePaymentLink} disabled={isCreatingPayment}>
                {isCreatingPayment ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Lien paiement acompte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {quote.statut === 'BROUILLON' && (
          <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
            <Mail className="h-4 w-4 mr-2" />Envoyer au client
          </Button>
        )}
        {['ENVOYE', 'VU'].includes(quote.statut) && (
          <>
            <Button onClick={() => handleStatus('ACCEPTE')}>
              <CheckCircle className="h-4 w-4 mr-2" />Accepter
            </Button>
            <Button variant="destructive" onClick={() => handleStatus('REFUSE')}>
              <XCircle className="h-4 w-4 mr-2" />Refuser
            </Button>
            <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Mail className="h-4 w-4 mr-2" />Renvoyer
            </Button>
          </>
        )}
        {quote.statut === 'ACCEPTE' && !quote.invoiceId && (
          <Button onClick={handleConvert}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />Convertir en facture
          </Button>
        )}
        <Button variant="outline" onClick={handleDownloadPdf}>
          <FileDown className="h-4 w-4 mr-2" />Télécharger PDF
        </Button>
      </div>

      {/* Quote preview */}
      <Card>
        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">DEVIS</h2>
              <p className="text-lg font-semibold text-primary">{quote.numero}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Date d&apos;émission : {formatDate(quote.dateEmission)}
              </p>
              <p className="text-sm text-muted-foreground">
                Valide jusqu&apos;au : {formatDate(quote.dateValidite)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{clientName}</p>
              {quote.client.adresseRue && <p className="text-sm">{quote.client.adresseRue}</p>}
              {(quote.client.adresseCP || quote.client.adresseVille) && (
                <p className="text-sm">{quote.client.adresseCP} {quote.client.adresseVille}</p>
              )}
              <p className="text-sm text-muted-foreground">{quote.client.email}</p>
              {quote.client.siret && (
                <p className="text-xs text-muted-foreground mt-1">SIRET : {quote.client.siret}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Lines table */}
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
              {quote.lines.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{line.description}</p>
                    {line.prestation && (
                      <Badge variant="outline" className="mt-1 text-xs">{line.prestation.nom}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{Number(line.quantite)}</TableCell>
                  <TableCell>{line.unite}</TableCell>
                  <TableCell className="text-right">
                    <Currency amount={Number(line.prixUnitaire)} />
                  </TableCell>
                  {hasTva && (
                    <TableCell className="text-right">{Number(line.tauxTva)}%</TableCell>
                  )}
                  <TableCell className="text-right font-medium">
                    <Currency amount={Number(line.totalHT)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total HT</span>
                <Currency amount={Number(quote.totalHT)} className="font-medium" />
              </div>
              {hasTva && (
                <div className="flex justify-between text-sm">
                  <span>TVA</span>
                  <Currency amount={Number(quote.totalTVA)} />
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total TTC</span>
                <Currency amount={Number(quote.totalTTC)} />
              </div>
              {quote.acompteRequis && quote.acompteMontant && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Acompte ({Number(quote.acomptePourcent)}%)</span>
                  <Currency amount={Number(quote.acompteMontant)} />
                </div>
              )}
            </div>
          </div>

          {/* Conditions */}
          {quote.conditions && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-1">Conditions</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.conditions}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer le devis par email</DialogTitle>
            <DialogDescription>
              Le devis sera envoyé à <strong>{quote.client.email}</strong>
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
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
