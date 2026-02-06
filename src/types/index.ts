// Types communs pour TaskerTime

export type ClientType = 'PARTICULIER' | 'ENTREPRISE' | 'ASSOCIATION' | 'ETABLISSEMENT_PUBLIC';

export type ModePaiement = 'VIREMENT' | 'CHEQUE' | 'CB' | 'ESPECES' | 'PRELEVEMENT' | 'STRIPE';

export type TypeTarif = 'HORAIRE' | 'FORFAIT' | 'JOURNALIER';

export type EventType = 'PRESTATION' | 'REUNION' | 'PERSONNEL' | 'AUTRE';

export type EventStatus = 'PLANIFIE' | 'CONFIRME' | 'EN_COURS' | 'REALISE' | 'ANNULE' | 'REPORTE';

export type QuoteStatus = 'BROUILLON' | 'ENVOYE' | 'VU' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE' | 'CONVERTI';

export type InvoiceStatus = 'BROUILLON' | 'ENVOYEE' | 'VUE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE' | 'AVOIR';

export type ContractStatus = 'BROUILLON' | 'ENVOYE' | 'VU' | 'SIGNE' | 'REFUSE' | 'EXPIRE';

export type BookingStatus = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE_CLIENT' | 'ANNULE_PRO' | 'REALISE' | 'NO_SHOW';

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'UNPAID' | 'INCOMPLETE';

export type PlanSlug = 'free' | 'pro' | 'business';

export interface PlanLimits {
  maxClients: number;
  maxFactures: number;
  maxDevis: number;
  maxPrestations: number;
  stripeConnect: boolean;
  reservationEnLigne: boolean;
  contrats: boolean;
  signatureElec: boolean;
  relancesAuto: boolean;
  statsAvancees: boolean;
  crmComplet: boolean;
  branding: boolean;
  iaAssistant: boolean;
  whatsapp: boolean;
  googleCalSync: boolean;
  espaceClient: boolean;
  apiAccess: boolean;
  multiDevise: boolean;
  exportFec: boolean;
  supportPrio: boolean;
}

export interface UserPlan {
  slug: PlanSlug;
  nom: string;
  limits: PlanLimits;
  status: SubscriptionStatus;
  periodeType: 'MENSUEL' | 'ANNUEL';
  cancelAtPeriodEnd: boolean;
  dateFin?: string;
  trialEnd?: string;
}

export interface Disponibilite {
  debut: string; // "09:00"
  fin: string;   // "18:00"
}

export interface DisponibilitesHebdo {
  lundi?: Disponibilite[];
  mardi?: Disponibilite[];
  mercredi?: Disponibilite[];
  jeudi?: Disponibilite[];
  vendredi?: Disponibilite[];
  samedi?: Disponibilite[];
  dimanche?: Disponibilite[];
}

export interface StatsDashboard {
  caRealise: number;
  caPrevu: number;
  facturesEnAttente: number;
  facturesEnRetard: number;
  devisEnAttente: number;
  tauxConversion: number;
  heuresTravaillees: number;
  nombreClients: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface MonthlyRevenue {
  mois: string;
  ca: number;
  objectif?: number;
}
