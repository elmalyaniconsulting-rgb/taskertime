'use client';

import { useState, useMemo } from 'react';
import { useEvents, useCreateEvent, useClients, usePrestations } from '@/hooks/use-api';
import { PageHeader, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export default function CalendarPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const { data: events, isLoading } = useEvents({
    start: start.toISOString(),
    end: end.toISOString(),
  });
  const { data: clientsData } = useClients({ page: 1 });
  const { data: prestationsData } = usePrestations();
  const createEvent = useCreateEvent();

  const clients = clientsData?.clients || [];
  const prestations = prestationsData || [];

  const [form, setForm] = useState({
    titre: '',
    clientId: '',
    prestationId: '',
    type: 'PRESTATION',
    dateDebut: '',
    heureDebut: '09:00',
    heureFin: '10:00',
    lieu: '',
    isDistanciel: false,
    lienVisio: '',
    description: '',
  });

  // Calendar grid
  const daysInMonth = end.getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday start

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [startDay, daysInMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    if (events) {
      events.forEach((e: any) => {
        const day = new Date(e.dateDebut).getDate();
        if (!map[day]) map[day] = [];
        map[day].push(e);
      });
    }
    return map;
  }, [events]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const openCreate = (day?: number) => {
    const d = day ? new Date(year, month, day) : new Date();
    const dateStr = d.toISOString().split('T')[0];
    setForm({ ...form, dateDebut: dateStr, titre: '', clientId: '', prestationId: '', description: '', lieu: '' });
    setSelectedDate(d);
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateDebut = new Date(`${form.dateDebut}T${form.heureDebut}:00`);
      const dateFin = new Date(`${form.dateDebut}T${form.heureFin}:00`);

      await createEvent.mutateAsync({
        titre: form.titre,
        clientId: form.clientId || null,
        prestationId: form.prestationId || null,
        type: form.type,
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
        lieu: form.lieu || null,
        isDistanciel: form.isDistanciel,
        lienVisio: form.lienVisio || null,
        description: form.description || null,
      });
      toast({ title: 'Événement créé', variant: 'success' });
      setShowCreate(false);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const monthLabel = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendrier"
        action={
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau RDV
          </Button>
        }
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
                {day}
              </div>
            ))}
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  'min-h-[80px] md:min-h-[100px] p-1 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors',
                  !day && 'bg-muted/20 cursor-default',
                  i % 7 === 5 || i % 7 === 6 ? 'bg-muted/10' : '',
                )}
                onClick={() => day && openCreate(day)}
              >
                {day && (
                  <>
                    <span className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                      isToday(day) && 'bg-primary text-primary-foreground'
                    )}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {(eventsByDay[day] || []).slice(0, 3).map((evt: any) => (
                        <div
                          key={evt.id}
                          className="text-[10px] md:text-xs px-1 py-0.5 rounded truncate text-white"
                          style={{ backgroundColor: evt.prestation?.couleur || '#3B82F6' }}
                          title={`${evt.titre} — ${new Date(evt.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                        >
                          {evt.titre}
                        </div>
                      ))}
                      {(eventsByDay[day] || []).length > 3 && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{eventsByDay[day].length - 3}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Nouveau rendez-vous — {selectedDate?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v === '_none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucun</SelectItem>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.raisonSociale || `${c.prenom || ''} ${c.nom}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prestation</Label>
                <Select value={form.prestationId} onValueChange={(v) => setForm({ ...form, prestationId: v === '_none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucune</SelectItem>
                    {prestations.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Début</Label>
                <Input type="time" value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="time" value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESTATION">Prestation</SelectItem>
                  <SelectItem value="REUNION">Réunion</SelectItem>
                  <SelectItem value="PERSONNEL">Personnel</SelectItem>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} placeholder="Adresse ou salle" />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isDistanciel} onCheckedChange={(v) => setForm({ ...form, isDistanciel: v })} />
              <Label>À distance</Label>
            </div>

            {form.isDistanciel && (
              <div className="space-y-2">
                <Label>Lien visio</Label>
                <Input value={form.lienVisio} onChange={(e) => setForm({ ...form, lienVisio: e.target.value })} placeholder="https://meet.google.com/..." />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
