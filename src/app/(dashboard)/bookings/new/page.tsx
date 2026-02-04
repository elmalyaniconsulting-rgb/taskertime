'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePrestations } from '@/hooks/use-api';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Calendar, 
  Clock, MapPin, Loader2, Copy, Mail, MessageCircle, Phone, Check
} from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';

interface SelectedSlot {
  date: string; // YYYY-MM-DD
  hour: number;
}

export default function NewBookingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: prestations } = usePrestations();

  // Step management
  const [step, setStep] = useState(1);

  // Step 1: Calendar selection
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  // Step 2: Configuration
  const [form, setForm] = useState({
    nom: '',
    description: '',
    prestationId: '',
    dureeMinutes: '60',
    lieu: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ slug: string; url: string } | null>(null);

  // Navigation
  const navigate = (delta: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + delta);
    else if (viewMode === 'week') d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  // Get week start
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const days = [];
    const d = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [weekStart]);

  // Hours
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h - 19h

  // Toggle slot selection
  const toggleSlot = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    const key = `${dateStr}-${hour}`;
    const exists = selectedSlots.find(s => `${s.date}-${s.hour}` === key);
    
    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => `${s.date}-${s.hour}` !== key));
    } else {
      setSelectedSlots([...selectedSlots, { date: dateStr, hour }]);
    }
  };

  const isSlotSelected = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedSlots.some(s => s.date === dateStr && s.hour === hour);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const isPast = (date: Date, hour: number) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < new Date();
  };

  // View title
  const viewTitle = useMemo(() => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    } else if (viewMode === 'week') {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  }, [currentDate, viewMode, weekStart]);

  // Create booking link
  const handleCreate = async () => {
    if (!form.nom) {
      toast({ title: 'Erreur', description: 'Le titre est requis', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const duree = parseInt(form.dureeMinutes);
      const slots = selectedSlots.map(s => {
        const start = new Date(`${s.date}T${String(s.hour).padStart(2, '0')}:00:00`);
        const end = new Date(start.getTime() + duree * 60000);
        return {
          dateDebut: start.toISOString(),
          dateFin: end.toISOString(),
        };
      });

      const res = await fetch('/api/booking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom,
          description: form.description || null,
          prestationId: form.prestationId || null,
          dureeMinutes: duree,
          lieu: form.lieu || null,
          slots,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const data = await res.json();
      const url = `${window.location.origin}/book/${data.slug}`;
      setCreatedLink({ slug: data.slug, url });
      setStep(3);
      toast({ title: 'Créneau créé !', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsCreating(false);
  };

  // Share functions
  const copyLink = async () => {
    if (createdLink) {
      await navigator.clipboard.writeText(createdLink.url);
      toast({ title: 'Lien copié !' });
    }
  };

  const shareEmail = () => {
    if (createdLink) {
      const subject = encodeURIComponent(`Réservez un créneau : ${form.nom}`);
      const body = encodeURIComponent(`Bonjour,\n\nVoici le lien pour réserver un créneau :\n${createdLink.url}\n\nCordialement`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  const shareWhatsApp = () => {
    if (createdLink) {
      const text = encodeURIComponent(`Réservez un créneau "${form.nom}" : ${createdLink.url}`);
      window.open(`https://wa.me/?text=${text}`);
    }
  };

  const shareSMS = () => {
    if (createdLink) {
      const text = encodeURIComponent(`Réservez votre créneau : ${createdLink.url}`);
      window.open(`sms:?body=${text}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/bookings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title="Créer un créneau disponible"
          description={step === 1 ? 'Sélectionnez vos disponibilités' : step === 2 ? 'Configurez votre créneau' : 'Partagez le lien'}
        />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              'flex-1 h-2 rounded-full transition-colors',
              s <= step ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* STEP 1: Calendar Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold capitalize">{viewTitle}</h3>
                <Button variant="outline" size="icon" onClick={() => navigate(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="day">Jour</TabsTrigger>
                  <TabsTrigger value="week">Semaine</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              Cliquez sur les créneaux pour les sélectionner. {selectedSlots.length} créneau(x) sélectionné(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            {viewMode === 'week' && (
              <div className="min-w-[600px]">
                {/* Header */}
                <div className="flex border-b sticky top-0 bg-background z-10">
                  <div className="w-16 shrink-0 border-r" />
                  {weekDays.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 py-2 px-1 text-center border-r',
                        isToday(day) && 'bg-primary/10'
                      )}
                    >
                      <div className="text-xs text-muted-foreground">
                        {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className={cn('text-lg font-semibold', isToday(day) && 'text-primary')}>
                        {day.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Hours grid */}
                {hours.map((hour) => (
                  <div key={hour} className="flex border-b">
                    <div className="w-16 py-2 px-2 text-xs text-muted-foreground border-r shrink-0">
                      {`${hour}:00`}
                    </div>
                    {weekDays.map((day, i) => {
                      const selected = isSlotSelected(day, hour);
                      const past = isPast(day, hour);
                      return (
                        <div
                          key={i}
                          onClick={() => !past && toggleSlot(day, hour)}
                          className={cn(
                            'flex-1 min-h-[40px] border-r cursor-pointer transition-colors flex items-center justify-center',
                            past && 'bg-muted/30 cursor-not-allowed',
                            !past && !selected && 'hover:bg-primary/10',
                            selected && 'bg-primary text-primary-foreground'
                          )}
                        >
                          {selected && <Check className="h-4 w-4" />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'day' && (
              <div className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {hours.map((hour) => {
                    const selected = isSlotSelected(currentDate, hour);
                    const past = isPast(currentDate, hour);
                    return (
                      <Button
                        key={hour}
                        variant={selected ? 'default' : 'outline'}
                        disabled={past}
                        onClick={() => !past && toggleSlot(currentDate, hour)}
                        className="h-12"
                      >
                        {`${hour}:00`}
                        {selected && <Check className="h-4 w-4 ml-2" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t flex justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedSlots.length} créneau(x) sélectionné(s)
            </div>
            <Button onClick={() => setStep(2)} disabled={selectedSlots.length === 0}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Configuration */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              {selectedSlots.length} créneau(x) sélectionné(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Consultation découverte, Formation..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Détails sur le rendez-vous..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prestation</Label>
                <Select value={form.prestationId} onValueChange={(v) => setForm({ ...form, prestationId: v === '_none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucune</SelectItem>
                    {(prestations || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durée</Label>
                <Select value={form.dureeMinutes} onValueChange={(v) => setForm({ ...form, dureeMinutes: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                value={form.lieu}
                onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                placeholder="Adresse ou Visio"
              />
            </div>
          </CardContent>
          <div className="p-4 border-t flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le créneau
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Share */}
      {step === 3 && createdLink && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Créneau créé !
            </CardTitle>
            <CardDescription>
              Partagez ce lien avec vos clients pour qu&apos;ils puissent réserver.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Link display */}
            <div className="p-4 bg-muted rounded-lg flex items-center gap-2">
              <Input value={createdLink.url} readOnly className="flex-1 bg-background" />
              <Button onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
            </div>

            {/* Share options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={shareEmail}>
                <Mail className="h-6 w-6" />
                <span>Email</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={shareWhatsApp}>
                <MessageCircle className="h-6 w-6" />
                <span>WhatsApp</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={shareSMS}>
                <Phone className="h-6 w-6" />
                <span>SMS</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={copyLink}>
                <Copy className="h-6 w-6" />
                <span>Copier</span>
              </Button>
            </div>
          </CardContent>
          <div className="p-4 border-t flex justify-end">
            <Button onClick={() => router.push('/bookings')}>
              Terminé
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
