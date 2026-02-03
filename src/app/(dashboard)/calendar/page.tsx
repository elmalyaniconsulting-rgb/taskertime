'use client';

import { useState, useMemo, useEffect } from 'react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useClients, useCreateClient, usePrestations, useCreatePrestation } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, 
  UserPlus, Briefcase, Clock, MapPin, Video, X, FileText, Receipt, 
  Bell, Trash2, Edit3, Check, AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Couleurs par statut
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PLANIFIE: { bg: 'bg-blue-500/20', text: 'text-blue-700', border: 'border-blue-500' },
  CONFIRME: { bg: 'bg-emerald-500/20', text: 'text-emerald-700', border: 'border-emerald-500' },
  EN_COURS: { bg: 'bg-amber-500/20', text: 'text-amber-700', border: 'border-amber-500' },
  REALISE: { bg: 'bg-purple-500/20', text: 'text-purple-700', border: 'border-purple-500' },
  ANNULE: { bg: 'bg-gray-500/20', text: 'text-gray-500', border: 'border-gray-400' },
  REPORTE: { bg: 'bg-orange-500/20', text: 'text-orange-700', border: 'border-orange-500' },
  // Extended statuses for billing
  FACTURE_ENVOYEE: { bg: 'bg-indigo-500/20', text: 'text-indigo-700', border: 'border-indigo-500' },
  FACTURE_PAYEE: { bg: 'bg-green-600/20', text: 'text-green-700', border: 'border-green-600' },
};

const STATUS_LABELS: Record<string, string> = {
  PLANIFIE: 'Planifié',
  CONFIRME: 'Confirmé',
  EN_COURS: 'En cours',
  REALISE: 'Réalisé',
  ANNULE: 'Annulé',
  REPORTE: 'Reporté',
};

type ViewMode = 'day' | 'week' | 'month';

export default function CalendarPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showPrestationForm, setShowPrestationForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour?: number } | null>(null);

  // Responsive: day view on mobile
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768 && viewMode === 'week') {
        setViewMode('day');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [viewMode]);

  // Date ranges based on view
  const { start, end } = useMemo(() => {
    const s = new Date(currentDate);
    const e = new Date(currentDate);
    
    if (viewMode === 'day') {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      const day = s.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      s.setDate(s.getDate() + diff);
      s.setHours(0, 0, 0, 0);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
    } else {
      s.setDate(1);
      s.setHours(0, 0, 0, 0);
      e.setMonth(e.getMonth() + 1, 0);
      e.setHours(23, 59, 59, 999);
    }
    return { start: s, end: e };
  }, [currentDate, viewMode]);

  const { data: events, isLoading, refetch } = useEvents({
    start: start.toISOString(),
    end: end.toISOString(),
  });
  const { data: clientsData, refetch: refetchClients } = useClients({ page: 1 });
  const { data: prestationsData, refetch: refetchPrestations } = usePrestations();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createClient = useCreateClient();
  const createPrestation = useCreatePrestation();

  const clients = clientsData?.clients || [];
  const prestations = prestationsData || [];

  // Form state
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
    sendConfirmation: false,
  });

  // Client quick form
  const [clientForm, setClientForm] = useState({
    type: 'PARTICULIER', nom: '', prenom: '', email: '', telephone: '',
  });

  // Prestation quick form
  const [prestationForm, setPrestationForm] = useState({
    nom: '', typeTarif: 'HORAIRE', tauxHoraire: '', dureeMinutes: '60', couleur: '#3B82F6',
  });

  // Navigation
  const navigate = (delta: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + delta);
    else if (viewMode === 'week') d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  // Open create modal
  const openCreate = (date?: Date, hour?: number) => {
    const d = date || new Date();
    const h = hour ?? 9;
    setForm({
      titre: '',
      clientId: '',
      prestationId: '',
      type: 'PRESTATION',
      dateDebut: d.toISOString().split('T')[0],
      heureDebut: `${String(h).padStart(2, '0')}:00`,
      heureFin: `${String(h + 1).padStart(2, '0')}:00`,
      lieu: '',
      isDistanciel: false,
      lienVisio: '',
      description: '',
      sendConfirmation: false,
    });
    setSelectedSlot({ date: d, hour: h });
    setShowCreate(true);
  };

  // Open detail panel
  const openDetail = (event: any) => {
    setSelectedEvent(event);
    setShowDetail(true);
  };

  // Auto-fill from prestation
  const handlePrestationChange = (prestationId: string) => {
    if (prestationId === '_none') {
      setForm({ ...form, prestationId: '' });
      return;
    }
    const presta = prestations.find((p: any) => p.id === prestationId);
    if (presta) {
      const dureeMinutes = presta.dureeMinutes || 60;
      const [h, m] = form.heureDebut.split(':').map(Number);
      const endMinutes = h * 60 + m + dureeMinutes;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      setForm({
        ...form,
        prestationId,
        titre: form.titre || presta.nom,
        heureFin: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      });
    }
  };

  // Create event
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

      toast({ title: 'RDV créé', variant: 'success' });
      setShowCreate(false);
      refetch();

      if (form.sendConfirmation && form.clientId) {
        toast({ title: 'Confirmation', description: 'Envoi de confirmation à implémenter', variant: 'default' });
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  // Update status
  const handleStatusChange = async (status: string) => {
    if (!selectedEvent) return;
    try {
      await updateEvent.mutateAsync({ id: selectedEvent.id, data: { statut: status } });
      toast({ title: 'Statut mis à jour', variant: 'success' });
      refetch();
      setShowDetail(false);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  // Delete event
  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      await deleteEvent.mutateAsync(selectedEvent.id);
      toast({ title: 'RDV supprimé' });
      refetch();
      setShowDetail(false);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  // Quick create client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newClient: any = await createClient.mutateAsync(clientForm);
      toast({ title: 'Client créé', variant: 'success' });
      setShowClientForm(false);
      setClientForm({ type: 'PARTICULIER', nom: '', prenom: '', email: '', telephone: '' });
      await refetchClients();
      setForm((prev) => ({ ...prev, clientId: newClient.id }));
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  // Quick create prestation
  const handleCreatePrestation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPresta: any = await createPrestation.mutateAsync({
        nom: prestationForm.nom,
        typeTarif: prestationForm.typeTarif,
        tauxHoraire: prestationForm.tauxHoraire ? parseFloat(prestationForm.tauxHoraire) : null,
        dureeMinutes: parseInt(prestationForm.dureeMinutes),
        couleur: prestationForm.couleur,
      });
      toast({ title: 'Prestation créée', variant: 'success' });
      setShowPrestationForm(false);
      setPrestationForm({ nom: '', typeTarif: 'HORAIRE', tauxHoraire: '', dureeMinutes: '60', couleur: '#3B82F6' });
      await refetchPrestations();
      handlePrestationChange(newPresta.id);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  // Create quote/invoice from event
  const createDocument = (type: 'quote' | 'invoice') => {
    if (!selectedEvent) return;
    const params = new URLSearchParams();
    if (selectedEvent.clientId) params.set('clientId', selectedEvent.clientId);
    if (selectedEvent.prestationId) params.set('prestationId', selectedEvent.prestationId);
    router.push(`/${type === 'quote' ? 'quotes' : 'invoices'}/new?${params.toString()}`);
  };

  // View title
  const viewTitle = useMemo(() => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const weekStart = new Date(start);
      const weekEnd = new Date(end);
      return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  }, [currentDate, viewMode, start, end]);

  // Hours for day/week view
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7h - 20h

  // Week days
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const days = [];
    const d = new Date(start);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [start, viewMode]);

  // Month days
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return [];
    const days: (Date | null)[] = [];
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentDate, viewMode]);

  // Events grouped
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (events || []).forEach((e: any) => {
      const key = new Date(e.dateDebut).toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const getEventStyle = (event: any) => {
    const colors = STATUS_COLORS[event.statut] || STATUS_COLORS.PLANIFIE;
    return colors;
  };

  // Render event card
  const EventCard = ({ event, compact = false }: { event: any; compact?: boolean }) => {
    const style = getEventStyle(event);
    const time = new Date(event.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const clientName = event.client?.raisonSociale || `${event.client?.prenom || ''} ${event.client?.nom || ''}`.trim();

    if (compact) {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); openDetail(event); }}
          className={cn(
            'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer border-l-2',
            style.bg, style.text, style.border
          )}
        >
          {event.titre}
        </div>
      );
    }

    return (
      <div
        onClick={(e) => { e.stopPropagation(); openDetail(event); }}
        className={cn(
          'p-2 rounded-lg cursor-pointer border-l-4 transition-all hover:shadow-md',
          style.bg, style.border
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-medium text-sm truncate', style.text)}>{event.titre}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
        </div>
        {clientName && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate">👤 {clientName}</div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Aujourd'hui
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="text-lg font-semibold capitalize">{viewTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Jour</TabsTrigger>
              <TabsTrigger value="week" className="hidden sm:inline-flex">Semaine</TabsTrigger>
              <TabsTrigger value="month">Mois</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nouveau RDV</span>
            <span className="sm:hidden">RDV</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full overflow-auto">
          {/* Day View */}
          {viewMode === 'day' && (
            <div className="min-h-full">
              {hours.map((hour) => {
                const dateKey = currentDate.toISOString().split('T')[0];
                const hourEvents = (eventsByDate[dateKey] || []).filter((e: any) => {
                  const h = new Date(e.dateDebut).getHours();
                  return h === hour;
                });
                return (
                  <div
                    key={hour}
                    className="flex border-b hover:bg-muted/30 cursor-pointer min-h-[60px]"
                    onClick={() => openCreate(currentDate, hour)}
                  >
                    <div className="w-16 py-2 px-2 text-xs text-muted-foreground border-r shrink-0">
                      {`${hour}:00`}
                    </div>
                    <div className="flex-1 p-1 space-y-1">
                      {hourEvents.map((e: any) => <EventCard key={e.id} event={e} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="min-h-full">
              {/* Header row */}
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
                    <div className={cn(
                      'text-lg font-semibold',
                      isToday(day) && 'text-primary'
                    )}>
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              {/* Hours */}
              {hours.map((hour) => (
                <div key={hour} className="flex border-b min-h-[50px]">
                  <div className="w-16 py-1 px-2 text-xs text-muted-foreground border-r shrink-0">
                    {`${hour}:00`}
                  </div>
                  {weekDays.map((day, i) => {
                    const dateKey = day.toISOString().split('T')[0];
                    const hourEvents = (eventsByDate[dateKey] || []).filter((e: any) => {
                      const h = new Date(e.dateDebut).getHours();
                      return h === hour;
                    });
                    return (
                      <div
                        key={i}
                        className="flex-1 border-r p-0.5 hover:bg-muted/30 cursor-pointer"
                        onClick={() => openCreate(day, hour)}
                      >
                        {hourEvents.map((e: any) => (
                          <EventCard key={e.id} event={e} compact />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Month View */}
          {viewMode === 'month' && (
            <div>
              {/* Header */}
              <div className="grid grid-cols-7 border-b">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              {/* Days */}
              <div className="grid grid-cols-7">
                {monthDays.map((day, i) => {
                  const dateKey = day?.toISOString().split('T')[0] || '';
                  const dayEvents = eventsByDate[dateKey] || [];
                  return (
                    <div
                      key={i}
                      className={cn(
                        'min-h-[80px] md:min-h-[100px] p-1 border-b border-r cursor-pointer hover:bg-muted/30',
                        !day && 'bg-muted/20 cursor-default',
                        day && isToday(day) && 'bg-primary/5'
                      )}
                      onClick={() => day && openCreate(day)}
                    >
                      {day && (
                        <>
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                            isToday(day) && 'bg-primary text-primary-foreground'
                          )}>
                            {day.getDate()}
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {dayEvents.slice(0, 3).map((e: any) => (
                              <EventCard key={e.id} event={e} compact />
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-[10px] text-muted-foreground text-center">
                                +{dayEvents.length - 3} autre(s)
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Nouveau rendez-vous
            </DialogTitle>
            {selectedSlot && (
              <DialogDescription>
                {selectedSlot.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Client */}
            <div className="space-y-2">
              <Label>Client</Label>
              <div className="flex gap-2">
                <Select value={form.clientId || '_none'} onValueChange={(v) => setForm({ ...form, clientId: v === '_none' ? '' : v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucun client</SelectItem>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.raisonSociale || `${c.prenom || ''} ${c.nom}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowClientForm(true)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Prestation */}
            <div className="space-y-2">
              <Label>Prestation</Label>
              <div className="flex gap-2">
                <Select value={form.prestationId || '_none'} onValueChange={handlePrestationChange}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucune prestation</SelectItem>
                    {prestations.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.couleur }} />
                          {p.nom}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowPrestationForm(true)}>
                  <Briefcase className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Titre */}
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Formation Management" />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-3 gap-3">
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

            {/* Location */}
            <div className="space-y-2">
              <Label>Lieu</Label>
              <div className="flex gap-2">
                <Input value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} placeholder="Adresse ou salle" className="flex-1" />
                <Button
                  type="button"
                  variant={form.isDistanciel ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setForm({ ...form, isDistanciel: !form.isDistanciel })}
                  title="À distance"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {form.isDistanciel && (
              <div className="space-y-2">
                <Label>Lien visio</Label>
                <Input value={form.lienVisio} onChange={(e) => setForm({ ...form, lienVisio: e.target.value })} placeholder="https://meet.google.com/..." />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Notes internes..." />
            </div>

            {/* Send confirmation */}
            {form.clientId && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Switch checked={form.sendConfirmation} onCheckedChange={(v) => setForm({ ...form, sendConfirmation: v })} />
                <Label className="cursor-pointer">Envoyer une confirmation au client</Label>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer le RDV
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL PANEL */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedEvent.titre}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {new Date(selectedEvent.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {' • '}
                      {new Date(selectedEvent.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(selectedEvent.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </DialogDescription>
                  </div>
                  <Badge className={cn(STATUS_COLORS[selectedEvent.statut]?.bg, STATUS_COLORS[selectedEvent.statut]?.text)}>
                    {STATUS_LABELS[selectedEvent.statut]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Client & Prestation */}
                {selectedEvent.client && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.client.raisonSociale || `${selectedEvent.client.prenom || ''} ${selectedEvent.client.nom}`}</span>
                  </div>
                )}
                {selectedEvent.prestation && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEvent.prestation.couleur }} />
                      {selectedEvent.prestation.nom}
                    </div>
                  </div>
                )}
                {selectedEvent.lieu && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.lieu}</span>
                  </div>
                )}
                {selectedEvent.isDistanciel && selectedEvent.lienVisio && (
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <a href={selectedEvent.lienVisio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {selectedEvent.lienVisio}
                    </a>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    {selectedEvent.description}
                  </div>
                )}

                <Separator />

                {/* Status change */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Changer le statut</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <Button
                        key={key}
                        variant={selectedEvent.statut === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(key)}
                        className="text-xs"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Quick actions */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Actions rapides</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => createDocument('quote')} className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Créer un devis
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => createDocument('invoice')} className="justify-start">
                      <Receipt className="h-4 w-4 mr-2" />
                      Créer une facture
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      Envoyer rappel
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="justify-start text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce RDV ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rendez-vous sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QUICK CLIENT FORM */}
      <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={clientForm.nom} onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={clientForm.prenom} onChange={(e) => setClientForm({ ...clientForm, prenom: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={clientForm.telephone} onChange={(e) => setClientForm({ ...clientForm, telephone: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowClientForm(false)}>Annuler</Button>
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QUICK PRESTATION FORM */}
      <Dialog open={showPrestationForm} onOpenChange={setShowPrestationForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouvelle prestation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePrestation} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={prestationForm.nom} onChange={(e) => setPrestationForm({ ...prestationForm, nom: e.target.value })} required placeholder="Formation, Coaching..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Taux horaire (€)</Label>
                <Input type="number" value={prestationForm.tauxHoraire} onChange={(e) => setPrestationForm({ ...prestationForm, tauxHoraire: e.target.value })} placeholder="75" />
              </div>
              <div className="space-y-2">
                <Label>Durée (min)</Label>
                <Input type="number" value={prestationForm.dureeMinutes} onChange={(e) => setPrestationForm({ ...prestationForm, dureeMinutes: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn('w-8 h-8 rounded-full border-2', prestationForm.couleur === c ? 'border-foreground' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                    onClick={() => setPrestationForm({ ...prestationForm, couleur: c })}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPrestationForm(false)}>Annuler</Button>
              <Button type="submit" disabled={createPrestation.isPending}>
                {createPrestation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
