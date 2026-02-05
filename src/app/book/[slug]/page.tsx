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
  pro: { nom: string; activite?: string };
  slots: Slot[];
}

export default function PublicBookingPage() {
  const params = useParams();
  const [data, setData] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookedDate, setBookedDate] = useState<string | null>(null);

  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/book/${params.slug}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Lien invalide');
        }
        setData(await res.json());
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
    Object.keys(map).forEach((day) => {
      map[day].sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
    });
    return map;
  }, [data]);

  // Week days for current offset
  const weekDays = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff + weekOffset * 7);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekOffset]);

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

      setBookedDate(selectedSlot.dateDebut);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto pt-12">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-64 mt-8" />
        </div>
      </div>
    );
  }

  if (error && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold mb-2">Oups !</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess && bookedDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Réservation envoyée !</h2>
            <p className="text-muted-foreground mb-6">
              Votre demande a été transmise à {data?.pro.nom}.<br />
              Vous recevrez une confirmation par email.
            </p>
            <div className="bg-white rounded-lg p-4 text-left border">
              <p className="font-semibold text-lg">{data?.nom}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4" />
                {new Date(bookedDate).toLocaleDateString('fr-FR', {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{data.pro.nom}</h1>
          {data.pro.activite && <p className="text-muted-foreground">{data.pro.activite}</p>}
        </div>

        {/* Booking Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-xl">{data.nom}</CardTitle>
            {data.description && <CardDescription>{data.description}</CardDescription>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
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

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Slot Selection */}
              <div>
                <Label className="text-base font-semibold mb-4 block">Choisissez un créneau</Label>
                
                {/* Week navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                  </Button>
                  <span className="text-sm font-medium">
                    {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    {' — '}
                    {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
                    Suivant <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {/* Slots grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {weekDays.map((day) => {
                    const dayStr = day.toISOString().split('T')[0];
                    const daySlots = slotsByDay[dayStr] || [];
                    const isToday = new Date().toISOString().split('T')[0] === dayStr;

                    return (
                      <div key={dayStr} className="space-y-2">
                        <div className={cn(
                          'text-center text-sm font-medium py-2 rounded-lg',
                          isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                          <div className="text-xs opacity-80">
                            {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </div>
                          <div>{day.getDate()}</div>
                        </div>
                        
                        {daySlots.length === 0 ? (
                          <div className="text-xs text-muted-foreground text-center py-3">—</div>
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
                                  className="w-full text-xs"
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
                  <p className="text-center text-muted-foreground py-8">
                    Aucun créneau disponible pour le moment.
                  </p>
                )}
              </div>

              {/* Contact Form */}
              {selectedSlot && (
                <div className="space-y-4 pt-6 border-t">
                  <Label className="text-base font-semibold">Vos informations</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom *</Label>
                      <Input
                        value={form.prenom}
                        onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                        required
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input
                        value={form.nom}
                        onChange={(e) => setForm({ ...form, nom: e.target.value })}
                        required
                        placeholder="Dupont"
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
                      placeholder="jean.dupont@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      placeholder="06 12 34 56 78"
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

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg mt-4" 
                    disabled={isSubmitting || !form.nom || !form.prenom || !form.email}
                  >
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

        <p className="text-center text-xs text-muted-foreground mt-8">
          Propulsé par <strong>TaskerTime</strong>
        </p>
      </div>
    </div>
  );
}
