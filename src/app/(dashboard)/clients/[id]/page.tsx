'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClient, useUpdateClient } from '@/hooks/use-api';
import { PageHeader, StatusBadge, Currency, TableLoading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, FileText,
  Receipt, Calendar, MessageSquare, Hash,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: client, isLoading } = useClient(params.id as string);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/clients')}>
          Retour aux clients
        </Button>
      </div>
    );
  }

  const displayName = client.raisonSociale || `${client.prenom || ''} ${client.nom}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={displayName}
          description={client.type.replace('_', ' ')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
              </div>
            )}
            {client.telephone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.telephone}`} className="hover:underline">{client.telephone}</a>
              </div>
            )}
            {client.adresseRue && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{client.adresseRue}</p>
                  <p>{client.adresseCP} {client.adresseVille}</p>
                </div>
              </div>
            )}
            {client.siret && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>SIRET: {client.siret}</span>
              </div>
            )}
            {client.isChorusPro && (
              <Badge variant="outline" className="mt-2">Chorus Pro</Badge>
            )}
            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {client.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Factures</span>
                <span className="font-medium">{client._count.invoices}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Devis</span>
                <span className="font-medium">{client._count.quotes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">RDV</span>
                <span className="font-medium">{client._count.events}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contrats</span>
                <span className="font-medium">{client._count.contracts}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="invoices">
            <TabsList>
              <TabsTrigger value="invoices">
                <Receipt className="h-4 w-4 mr-1" />
                Factures
              </TabsTrigger>
              <TabsTrigger value="quotes">
                <FileText className="h-4 w-4 mr-1" />
                Devis
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="h-4 w-4 mr-1" />
                RDV
              </TabsTrigger>
              <TabsTrigger value="notes">
                <MessageSquare className="h-4 w-4 mr-1" />
                Notes CRM
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="mt-4">
              {client.invoices?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune facture</p>
              ) : (
                <div className="space-y-2">
                  {client.invoices?.map((inv: any) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{inv.numero}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(inv.dateEmission)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Currency amount={Number(inv.totalTTC)} className="text-sm font-medium" />
                        <StatusBadge status={inv.statut} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="quotes" className="mt-4">
              {client.quotes?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun devis</p>
              ) : (
                <div className="space-y-2">
                  {client.quotes?.map((q: any) => (
                    <Link
                      key={q.id}
                      href={`/quotes/${q.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{q.numero}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(q.dateEmission)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Currency amount={Number(q.totalTTC)} className="text-sm font-medium" />
                        <StatusBadge status={q.statut} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              {client.events?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun rendez-vous</p>
              ) : (
                <div className="space-y-2">
                  {client.events?.map((evt: any) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">{evt.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(evt.dateDebut)} — {new Date(evt.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <StatusBadge status={evt.statut} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              {client.interactions?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune interaction enregistrée</p>
              ) : (
                <div className="space-y-3">
                  {client.interactions?.map((inter: any) => (
                    <div key={inter.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{inter.type}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(inter.date)}</span>
                      </div>
                      {inter.sujet && <p className="font-medium text-sm">{inter.sujet}</p>}
                      {inter.contenu && <p className="text-sm text-muted-foreground">{inter.contenu}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
