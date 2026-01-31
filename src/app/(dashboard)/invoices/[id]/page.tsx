'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInvoice, useUpdateInvoice } from '@/hooks/use-api';
import { PageHeader, StatusBadge, Currency } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Printer, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: invoice, isLoading } = useInvoice(params.id as string);
  const updateInvoice = useUpdateInvoice();

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
              <p className="text-sm text-muted-foreground mt-2">
                Reste à payer : <Currency amount={resteAPayer} className="font-medium text-destructive" />
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {invoice.statut === 'BROUILLON' && (
          <Button variant="outline" onClick={() => handleStatus('ENVOYEE')}>
            <Send className="h-4 w-4 mr-2" />Marquer envoyée
          </Button>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />Imprimer
        </Button>
      </div>

      {/* Invoice preview */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">FACTURE</h2>
              <p className="text-lg font-semibold text-primary">{invoice.numero}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Date d'émission : {formatDate(invoice.dateEmission)}
              </p>
              <p className="text-sm text-muted-foreground">
                Échéance : {formatDate(invoice.dateEcheance)}
              </p>
              {invoice.isChorusPro && (
                <Badge variant="outline" className="mt-2">Chorus Pro</Badge>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold">{clientName}</p>
              {invoice.client.adresseRue && <p className="text-sm">{invoice.client.adresseRue}</p>}
              {(invoice.client.adresseCP || invoice.client.adresseVille) && (
                <p className="text-sm">{invoice.client.adresseCP} {invoice.client.adresseVille}</p>
              )}
              <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
              {invoice.client.siret && (
                <p className="text-xs text-muted-foreground mt-1">SIRET : {invoice.client.siret}</p>
              )}
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
                {Number(invoice.totalTVA) > 0 && <TableHead className="text-right">TVA</TableHead>}
                <TableHead className="text-right">Total HT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{line.description}</p>
                  </TableCell>
                  <TableCell className="text-right">{Number(line.quantite)}</TableCell>
                  <TableCell>{line.unite}</TableCell>
                  <TableCell className="text-right"><Currency amount={Number(line.prixUnitaire)} /></TableCell>
                  {Number(invoice.totalTVA) > 0 && (
                    <TableCell className="text-right">{Number(line.tauxTva)}%</TableCell>
                  )}
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
              {Number(invoice.totalTVA) > 0 && (
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

          {/* Mentions */}
          {invoice.mentionsLegales && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">{invoice.mentionsLegales}</p>
            </>
          )}
          {invoice.conditions && (
            <p className="text-xs text-muted-foreground">{invoice.conditions}</p>
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
    </div>
  );
}
