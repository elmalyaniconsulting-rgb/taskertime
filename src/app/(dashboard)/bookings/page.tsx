'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Calendar, Clock, User, Mail, ExternalLink, 
  Copy, Check, X, Loader2, Link as LinkIcon, Trash2
} from 'lucide-react';

interface BookingLink {
  id: string;
  slug: string;
  nom: string;
  description?: string;
  dureeMinutes: number;
  isActive: boolean;
  createdAt: string;
  slots: { id: string; dateDebut: string; dateFin: string; isBooked: boolean }[];
  bookings: { id: string; nom: string; prenom: string; email: string; dateDebut: string; statut: string }[];
  _count: { slots: number; bookings: number };
}

const STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-500/20 text-amber-700 border-amber-500',
  CONFIRME: 'bg-green-500/20 text-green-700 border-green-500',
  ANNULE_CLIENT: 'bg-gray-500/20 text-gray-500 border-gray-400',
  ANNULE_PRO: 'bg-gray-500/20 text-gray-500 border-gray-400',
  REALISE: 'bg-purple-500/20 text-purple-700 border-purple-500',
  NO_SHOW: 'bg-red-500/20 text-red-700 border-red-500',
};

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE_CLIENT: 'Annulé (client)',
  ANNULE_PRO: 'Annulé',
  REALISE: 'Réalisé',
  NO_SHOW: 'Absent',
};

export default function BookingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/booking-links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch {}
    setIsLoading(false);
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Lien copié !' });
  };

  const handleConfirm = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      if (res.ok) {
        toast({ title: 'Réservation confirmée', description: 'Un événement a été créé dans votre calendrier.', variant: 'success' });
        fetchLinks();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setActionLoading(null);
  };

  const handleCancel = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (res.ok) {
        toast({ title: 'Réservation annulée' });
        fetchLinks();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setActionLoading(null);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Supprimer ce créneau et toutes ses réservations ?')) return;
    try {
      const res = await fetch(`/api/booking-links/${linkId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Créneau supprimé' });
        fetchLinks();
      }
    } catch {}
  };

  const allBookings = links.flatMap(l => 
    l.bookings.map(b => ({ ...b, linkNom: l.nom, linkId: l.id }))
  ).sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());

  const pendingBookings = allBookings.filter(b => b.statut === 'EN_ATTENTE');
  const confirmedBookings = allBookings.filter(b => b.statut === 'CONFIRME');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réservations"
        description="Gérez vos créneaux disponibles et réservations clients"
        action={
          <Button onClick={() => router.push('/bookings/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Créneau disponible
          </Button>
        }
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            En attente
            {pendingBookings.length > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-amber-500">
                {pendingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmées</TabsTrigger>
          <TabsTrigger value="links">Créneaux actifs</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune réservation en attente
              </CardContent>
            </Card>
          ) : (
            pendingBookings.map((booking) => (
              <Card key={booking.id} className="border-l-4 border-l-amber-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{booking.prenom} {booking.nom}</span>
                        <Badge className={STATUS_COLORS[booking.statut]}>{STATUS_LABELS[booking.statut]}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.dateDebut).toLocaleDateString('fr-FR', {
                          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {booking.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{booking.linkNom}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleConfirm(booking.id)} disabled={actionLoading === booking.id}>
                        {actionLoading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                        Confirmer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCancel(booking.id)} disabled={actionLoading === booking.id}>
                        <X className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="mt-6 space-y-4">
          {confirmedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune réservation confirmée
              </CardContent>
            </Card>
          ) : (
            confirmedBookings.map((booking) => (
              <Card key={booking.id} className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{booking.prenom} {booking.nom}</span>
                        <Badge className={STATUS_COLORS[booking.statut]}>{STATUS_LABELS[booking.statut]}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.dateDebut).toLocaleDateString('fr-FR', {
                          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {booking.email}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleCancel(booking.id)} disabled={actionLoading === booking.id} className="text-destructive hover:text-destructive">
                      <X className="h-4 w-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="links" className="mt-6 space-y-4">
          {links.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">Aucun créneau disponible créé</p>
                <Button onClick={() => router.push('/bookings/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un créneau
                </Button>
              </CardContent>
            </Card>
          ) : (
            links.map((link) => {
              const availableSlots = link.slots.filter(s => !s.isBooked && new Date(s.dateDebut) > new Date()).length;
              return (
                <Card key={link.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{link.nom}</span>
                          {!link.isActive && <Badge variant="outline">Inactif</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {link.dureeMinutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {availableSlots} dispo
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {link._count.bookings} résa
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyLink(link.slug)}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copier
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/book/${link.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteLink(link.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
