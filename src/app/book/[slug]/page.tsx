'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingData {
  link: any;
  pro: any;
  busy: { dateDebut: string; dateFin: string }[];
}

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'date' | 'time' | 'form' | 'done'>('date');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', entreprise: '', message: '',
  });

  useEffect(() => {
    fetch(`/api/bookings/public?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Impossible de charger la page'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Generate available time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || !data) return [];

    const slots: string[] = [];
    const duration = data.link.dureeMinutes;
    const buffer = data.link.bufferApres || 0;
    const dateStr = selectedDate.toISOString().split('T')[0];

    // Default 9h-18h if no custom availability
    for (let h = 9; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const start = new Date(`${dateStr}T${startTime}:00`);
        const end = new Date(start.getTime() + (duration + buffer) * 60000);

        if (end.getHours() > 18 || (end.getHours() === 18 && end.getMinutes() > 0)) continue;

        // Check conflicts with busy slots
        const hasConflict = data.busy.some((b) => {
          const bStart = new Date(b.dateDebut);
          const bEnd = new Date(b.dateFin);
          return start < bEnd && end > bStart;
        });

        // Check min delay
        const minDelay = data.link.delaiMinReservation || 24;
        const minTime = new Date(Date.now() + minDelay * 3600000);
        if (start < minTime) continue;

        if (!hasConflict) slots.push(startTime);
      }
    }

    return slots;
  }, [selectedDate, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !data) return;

    setSubmitting(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dateDebut = new Date(`${dateStr}T${selectedSlot}:00`);
    const dateFin = new Date(dateDebut.getTime() + data.link.dureeMinutes * 60000);

    try {
      const res = await fetch('/api/bookings/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          dateDebut: dateDebut.toISOString(),
          dateFin: dateFin.toISOString(),
          ...form,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [startDay, daysInMonth]);

  const maxDate = data ? new Date(Date.now() + (data.link.delaiMaxReservation || 30) * 86400000) : new Date();

  const isDayAvailable = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    if (d < today) return false;
    if (d > maxDate) return false;
    if (d.getDay() === 0 || d.getDay() === 6) return false; // Weekend
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{data.pro.firstName} {data.pro.lastName}</h1>
                {data.pro.activite && <p className="text-sm text-muted-foreground">{data.pro.activite}</p>}
              </div>
            </div>
            <div className="mt-4" style={{ borderLeft: `3px solid ${data.link.couleur}`, paddingLeft: 12 }}>
              <h2 className="font-semibold">{data.link.nom}</h2>
              {data.link.description && <p className="text-sm text-muted-foreground mt-1">{data.link.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{data.link.dureeMinutes} min</span>
                {data.link.afficherTarif && data.link.tarifAffiche && (
                  <span>{Number(data.link.tarifAffiche).toFixed(0)} €</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {step === 'done' ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Réservation confirmée !</h2>
              <p className="text-muted-foreground">
                Vous recevrez un email de confirmation à {form.email}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Date selection */}
            {(step === 'date' || step === 'time') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Choisissez une date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium capitalize">
                      {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
                      <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                    ))}
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={i} />;
                      const available = isDayAvailable(day);
                      const isSelected = selectedDate &&
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === month &&
                        selectedDate.getFullYear() === year;

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={!available}
                          onClick={() => {
                            setSelectedDate(new Date(year, month, day));
                            setSelectedSlot(null);
                            setStep('time');
                          }}
                          className={cn(
                            'h-10 w-full rounded-md text-sm transition-colors',
                            available ? 'hover:bg-primary/10 cursor-pointer' : 'text-muted-foreground/30 cursor-not-allowed',
                            isSelected && 'bg-primary text-primary-foreground hover:bg-primary'
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Time selection */}
            {step === 'time' && selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Créneaux du {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun créneau disponible ce jour. Essayez un autre jour.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant={selectedSlot === slot ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setStep('form');
                          }}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => { setStep('date'); setSelectedDate(null); }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />Changer de date
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Contact form */}
            {step === 'form' && selectedDate && selectedSlot && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vos coordonnées</CardTitle>
                  <CardDescription>
                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedSlot} — {data.link.dureeMinutes} min
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prénom *</Label>
                        <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Nom *</Label>
                        <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Entreprise</Label>
                      <Input value={form.entreprise} onChange={(e) => setForm({ ...form, entreprise: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep('time')}>
                        <ChevronLeft className="h-4 w-4 mr-1" />Retour
                      </Button>
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                        Confirmer la réservation
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
