'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuotes, useUpdateQuote, useConvertQuote } from '@/hooks/use-api';
import { PageHeader, StatusBadge, EmptyState, TableLoading, Currency } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, MoreHorizontal, Eye, Send, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'BROUILLON', label: 'Brouillons' },
  { value: 'ENVOYE', label: 'Envoyés' },
  { value: 'ACCEPTE', label: 'Acceptés' },
  { value: 'REFUSE', label: 'Refusés' },
  { value: 'CONVERTI', label: 'Convertis' },
  { value: 'EXPIRE', label: 'Expirés' },
];

export default function QuotesPage() {
  const { toast } = useToast();
  const [statutFilter, setStatutFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuotes({ statut: statutFilter, page });
  const updateQuote = useUpdateQuote();
  const convertQuote = useConvertQuote();

  const handleStatusChange = async (id: string, statut: string) => {
    try {
      await updateQuote.mutateAsync({ id, data: { statut } });
      toast({ title: `Devis ${statut === 'ENVOYE' ? 'marqué comme envoyé' : statut === 'ACCEPTE' ? 'accepté' : 'refusé'}`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleConvert = async (id: string) => {
    try {
      await convertQuote.mutateAsync(id);
      toast({ title: 'Devis converti en facture', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const quotes = data?.quotes || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devis"
        description={`${pagination?.total || 0} devis`}
        action={
          <Link href="/quotes/new">
            <Button><Plus className="h-4 w-4 mr-2" />Nouveau devis</Button>
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
        <TableLoading rows={8} cols={5} />
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6 text-muted-foreground" />}
          title="Aucun devis"
          description="Créez votre premier devis pour l'envoyer à un client."
          actionLabel="Nouveau devis"
          onAction={() => window.location.href = '/quotes/new'}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Validité</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q: any) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Link href={`/quotes/${q.id}`} className="font-medium hover:underline">{q.numero}</Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {q.client.raisonSociale || `${q.client.prenom || ''} ${q.client.nom}`}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(q.dateEmission)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(q.dateValidite)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Currency amount={Number(q.totalTTC)} className="font-medium" />
                    </TableCell>
                    <TableCell><StatusBadge status={q.statut} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/quotes/${q.id}`}><Eye className="h-4 w-4 mr-2" />Voir</Link>
                          </DropdownMenuItem>
                          {q.statut === 'BROUILLON' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'ENVOYE')}>
                              <Send className="h-4 w-4 mr-2" />Marquer envoyé
                            </DropdownMenuItem>
                          )}
                          {['ENVOYE', 'VU'].includes(q.statut) && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'ACCEPTE')}>
                                <CheckCircle className="h-4 w-4 mr-2" />Accepter
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'REFUSE')}>
                                <XCircle className="h-4 w-4 mr-2" />Refuser
                              </DropdownMenuItem>
                            </>
                          )}
                          {q.statut === 'ACCEPTE' && !q.invoiceId && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleConvert(q.id)}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />Convertir en facture
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
