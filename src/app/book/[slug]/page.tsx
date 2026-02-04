'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin, User, Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface Slot {
  id: string;
  dateDebut: string;
  dateFin: string;
}

interface BookingData {
  id: string;
  nom: string;
  description?: string;
  dureeMinutes: number;
  lieu?: string;
  pro: {
    nom: string;
    activite?: string;
  };
  slots: Slot[];
}

export default function PublicBookingPage() {
  const params = useParams();
  const [data, setData] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<{ dateDebut: string } | null>(null);

  // Pagination for dates
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/book/${params.slug}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Lien invalide');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [params.slug]);

  // Group slots by day
  const slotsByDay = useMemo(() => {
    if (!data) return {};
    const map: Record<string, Slot[]> = {};
    data.slots.forEach((slot) => {
      const day = new Date(slot.dateDebut).toISOString().split('T')[0];
      if (!map[day]) map[day] = [];
      map[day].push(slot);
    });
    // Sort slots within each day
    Object.keys(map).forEach((day) => {
      map[day].sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
    });
    return map;
  }, [data]);

  // Get days for current week view
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const d = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [currentWeekStart]);

  const navigateWeek = (delta: number) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + delta * 7);
    setCurrentWeekStart(d);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/book/${params.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone || null,
          message: form.message || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const result = await res.json();
      setBookedSlot({ dateDebut: selectedSlot.dateDebut });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Skeleton className="h-12 w-48 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">😕</div>
            <h2 className="text-xl font-semibold mb-2">Oups !</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess && bookedSlot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Réservation envoyée !</h2>
            <p className="text-muted-foreground mb-4">
              Votre demande de réservation a été envoyée à {data?.pro.nom}.<br />
              Vous recevrez une confirmation par email.
            </p>
            <div className="bg-muted rounded-lg p-4 text-left">
              <p className="font-semibold">{data?.nom}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(bookedSlot.dateDebut).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-3xl mx-auto pt-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{data.pro.nom}</h1>
          {data.pro.activite && (
            <p className="text-muted-foreground">{data.pro.activite}</p>
          )}
        </div>

        {/* Booking card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{data.nom}</CardTitle>
            {data.description && (
              <CardDescription>{data.description}</CardDescription>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {data.dureeMinutes} min
              </span>
              {data.lieu && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {data.lieu}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Slot selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Choisissez un créneau</Label>
                
                {/* Week navigation */}
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    {' — '}
                    {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Slots grid by day */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {weekDays.map((day) => {
                    const dayStr = day.toISOString().split('T')[0];
                    const daySlots = slotsByDay[dayStr] || [];
                    const isToday = new Date().toISOString().split('T')[0] === dayStr;

                    return (
                      <div key={dayStr} className="space-y-2">
                        <div className={cn(
                          'text-center text-sm font-medium py-1 rounded',
                          isToday && 'bg-primary/10 text-primary'
                        )}>
                          {day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                        </div>
                        {daySlots.length === 0 ? (
                          <div className="text-xs text-muted-foreground text-center py-2">—</div>
                        ) : (
                          <div className="space-y-1">
                            {daySlots.map((slot) => {
                              const time = new Date(slot.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                              const isSelected = selectedSlot?.id === slot.id;
                              return (
                                <Button
                                  key={slot.id}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  {time}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {data.slots.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Aucun créneau disponible pour le moment.
                  </p>
                )}
              </div>

              {/* Contact form */}
              {selectedSlot && (
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-semibold">Vos informations</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom *</Label>
                      <Input
                        value={form.prenom}
                        onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input
                        value={form.nom}
                        onChange={(e) => setForm({ ...form, nom: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Message (optionnel)</Label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={2}
                      placeholder="Précisions sur votre demande..."
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Confirmer la réservation'
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Propulsé par TaskerTime
        </p>
      </div>
    </div>
  );
}
