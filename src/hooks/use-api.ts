import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Generic fetch helper ───
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || `Erreur ${res.status}`);
  }
  return res.json();
}

// ─── CLIENTS ───
export function useClients(params?: { search?: string; type?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.type) query.set('type', params.type);
  if (params?.page) query.set('page', params.page.toString());

  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => apiFetch<any>(`/api/clients?${query}`),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => apiFetch<any>(`/api/clients/${id}`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['client', vars.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/clients/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

// ─── PRESTATIONS ───
export function usePrestations(activeOnly = true) {
  return useQuery({
    queryKey: ['prestations', activeOnly],
    queryFn: () => apiFetch<any>(`/api/prestations?active=${activeOnly}`),
  });
}

export function useCreatePrestation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/prestations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prestations'] }),
  });
}

export function useUpdatePrestation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/prestations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prestations'] }),
  });
}

export function useDeletePrestation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/prestations/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prestations'] }),
  });
}

// ─── EVENTS ───
export function useEvents(params?: { start?: string; end?: string; clientId?: string }) {
  const query = new URLSearchParams();
  if (params?.start) query.set('start', params.start);
  if (params?.end) query.set('end', params.end);
  if (params?.clientId) query.set('clientId', params.clientId);

  return useQuery({
    queryKey: ['events', params],
    queryFn: () => apiFetch<any>(`/api/events?${query}`),
    enabled: !!(params?.start && params?.end),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/events', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

// ─── QUOTES ───
export function useQuotes(params?: { statut?: string; clientId?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.statut) query.set('statut', params.statut);
  if (params?.clientId) query.set('clientId', params.clientId);
  if (params?.page) query.set('page', params.page.toString());

  return useQuery({
    queryKey: ['quotes', params],
    queryFn: () => apiFetch<any>(`/api/quotes?${query}`),
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: () => apiFetch<any>(`/api/quotes/${id}`),
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/quotes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['quote', vars.id] });
    },
  });
}

export function useConvertQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/quotes/${id}/convert`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// ─── INVOICES ───
export function useInvoices(params?: { statut?: string; clientId?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.statut) query.set('statut', params.statut);
  if (params?.clientId) query.set('clientId', params.clientId);
  if (params?.page) query.set('page', params.page.toString());

  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => apiFetch<any>(`/api/invoices?${query}`),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => apiFetch<any>(`/api/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/invoices', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', vars.id] });
    },
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: any }) =>
      apiFetch(`/api/invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', vars.invoiceId] });
    },
  });
}

// ─── CONTRACTS ───
export function useContracts(params?: { clientId?: string; statut?: string }) {
  const query = new URLSearchParams();
  if (params?.clientId) query.set('clientId', params.clientId);
  if (params?.statut) query.set('statut', params.statut);

  return useQuery({
    queryKey: ['contracts', params],
    queryFn: () => apiFetch<any>(`/api/contracts?${query}`),
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/contracts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

// ─── AVAILABILITY LINKS ───
export function useAvailabilityLinks() {
  return useQuery({
    queryKey: ['availability-links'],
    queryFn: () => apiFetch<any>('/api/availability-links'),
  });
}

export function useCreateAvailabilityLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/availability-links', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability-links'] }),
  });
}

export function useUpdateAvailabilityLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/availability-links/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability-links'] }),
  });
}

// ─── STATS ───
export function useStats(year?: number) {
  return useQuery({
    queryKey: ['stats', year],
    queryFn: () => apiFetch<any>(`/api/stats?year=${year || new Date().getFullYear()}`),
  });
}
