'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Calendar, Clock, User, Mail, ExternalLink, 
  Copy, Check, X, Loader2, Link as LinkIcon, Trash2,
  Eye, Share2, Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Slot {
  id: string;
  dateDebut: string;
  dateFin: string;
  isBooked: boolean;
}

interface Booking {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  message?: string;
}

interface BookingLink {
  id: string;
  slug: string;
  nom: string;
  description?: string;
  dureeMinutes: number;
  isActive: boolean;
  createdAt: string;
  slots: Slot[];
  bookings: Booking[];
  _count: { slots: number; bookings: number };
}

const STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-800 border-amber-300',
  CONFIRME: 'bg-green-100 text-green-800 border-green-300',
  ANNULE_CLIENT: 'bg-gray-100 text-gray-600 border-gray-300',
  ANNULE_PRO: 'bg-gray-100 text-gray-600 border-gray-300',
  REALISE: 'bg-purple-100 text-purple-800 border-purple-300',
  NO_SHOW: 'bg-red-100 text-red-800 border-red-300',
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
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Lien copié !' });
  };

  const toggleActive = async (linkId: string, isActive: boolean) => {
    try {
      await fetch(`/api/booking-links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      fetchLinks();
    } catch {}
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
        toast({ title: 'Réservation confirmée', description: 'Événement créé dans le calendrier.', variant: 'success' });
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
        toast({ title: 'Réservation refusée' });
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

  // Gather all bookings
  const allBookings = links.flatMap(l => 
    l.bookings.map(b => ({ ...b, linkNom: l.nom, linkId: l.id, slug: l.slug }))
  );
  const pendingBookings = allBookings.filter(b => b.statut === 'EN_ATTENTE');
  const confirmedBookings = allBookings.filter(b => b.statut === 'CONFIRME');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Réservations"
        description="Gérez vos créneaux disponibles et les réservations de vos clients"
        action={
          <Button onClick={() => router.push('/bookings/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Créneau disponible
          </Button>
        }
      />

      {/* CRÉNEAUX ACTIFS */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          Créneaux actifs
        </h2>
        
        {links.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Aucun créneau créé</h3>
              <p className="text-muted-foreground mb-4">
                Créez des créneaux disponibles pour permettre à vos clients de réserver.
              </p>
              <Button onClick={() => router.push('/bookings/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un créneau
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {links.map((link) => {
              const availableSlots = link.slots.filter(s => !s.isBooked && new Date(s.dateDebut) > new Date()).length;
              const totalSlots = link.slots.length;
              const bookingsCount = link.bookings.length;
              
              return (
                <Card key={link.id} className={cn(!link.isActive && 'opacity-60')}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold truncate">{link.nom}</h3>
                          <Badge variant="outline" className="shrink-0">
                            {availableSlots}/{totalSlots} créneaux
                          </Badge>
                          {bookingsCount > 0 && (
                            <Badge className="bg-primary/10 text-primary shrink-0">
                              {bookingsCount} réservation(s)
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {link.dureeMinutes} min
                          </span>
                          <span className="truncate">/book/{link.slug}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={link.isActive}
                          onCheckedChange={(v) => toggleActive(link.id, v)}
                        />
                        <Button size="icon" variant="ghost" onClick={() => copyLink(link.slug)} title="Copier le lien">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" asChild title="Voir la page">
                          <a href={`/book/${link.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteLink(link.id)} title="Supprimer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* RÉSERVATIONS REÇUES */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Réservations reçues
          {pendingBookings.length > 0 && (
            <Badge className="bg-amber-500 text-white">{pendingBookings.length} en attente</Badge>
          )}
        </h2>

        {allBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucune réservation pour le moment
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* En attente d'abord */}
            {pendingBookings.map((booking) => (
              <Card key={booking.id} className="border-l-4 border-l-amber-500">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-600">⏳</span>
                        <span className="font-semibold">{booking.prenom} {booking.nom}</span>
                        <Badge className={STATUS_COLORS[booking.statut]}>
                          {STATUS_LABELS[booking.statut]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {booking.linkNom}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(booking.dateDebut).toLocaleDateString('fr-FR', {
                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {booking.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleConfirm(booking.id)}
                        disabled={actionLoading === booking.id}
                      >
                        {actionLoading === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Confirmer
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCancel(booking.id)}
                        disabled={actionLoading === booking.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Confirmées ensuite */}
            {confirmedBookings.map((booking) => (
              <Card key={booking.id} className="border-l-4 border-l-green-500">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-600">✓</span>
                        <span className="font-semibold">{booking.prenom} {booking.nom}</span>
                        <Badge className={STATUS_COLORS[booking.statut]}>
                          {STATUS_LABELS[booking.statut]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {booking.linkNom}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(booking.dateDebut).toLocaleDateString('fr-FR', {
                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {booking.email}
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCancel(booking.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
