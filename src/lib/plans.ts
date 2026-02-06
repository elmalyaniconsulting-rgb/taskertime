import prisma from '@/lib/prisma';
import type { PlanSlug, PlanLimits, UserPlan } from '@/types';

// ============================================================================
// DEFAULT PLAN (Free)
// ============================================================================

const FREE_PLAN_LIMITS: PlanLimits = {
  maxClients: 3,
  maxFactures: 5,
  maxDevis: 5,
  maxPrestations: 1,
  stripeConnect: false,
  reservationEnLigne: false,
  contrats: false,
  signatureElec: false,
  relancesAuto: false,
  statsAvancees: false,
  crmComplet: false,
  branding: true,
  iaAssistant: false,
  whatsapp: false,
  googleCalSync: false,
  espaceClient: false,
  apiAccess: false,
  multiDevise: false,
  exportFec: false,
  supportPrio: false,
};

// ============================================================================
// GET USER PLAN
// ============================================================================

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription || subscription.statut === 'CANCELLED') {
    return {
      slug: 'free' as PlanSlug,
      nom: 'Gratuit',
      limits: FREE_PLAN_LIMITS,
      status: 'ACTIVE',
      periodeType: 'MENSUEL',
      cancelAtPeriodEnd: false,
    };
  }

  const plan = subscription.plan;

  return {
    slug: plan.slug as PlanSlug,
    nom: plan.nom,
    limits: {
      maxClients: plan.maxClients,
      maxFactures: plan.maxFactures,
      maxDevis: plan.maxDevis,
      maxPrestations: plan.maxPrestations,
      stripeConnect: plan.stripeConnect,
      reservationEnLigne: plan.reservationEnLigne,
      contrats: plan.contrats,
      signatureElec: plan.signatureElec,
      relancesAuto: plan.relancesAuto,
      statsAvancees: plan.statsAvancees,
      crmComplet: plan.crmComplet,
      branding: plan.branding,
      iaAssistant: plan.iaAssistant,
      whatsapp: plan.whatsapp,
      googleCalSync: plan.googleCalSync,
      espaceClient: plan.espaceClient,
      apiAccess: plan.apiAccess,
      multiDevise: plan.multiDevise,
      exportFec: plan.exportFec,
      supportPrio: plan.supportPrio,
    },
    status: subscription.statut,
    periodeType: subscription.periodeType,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    dateFin: subscription.dateFin?.toISOString(),
    trialEnd: subscription.trialEnd?.toISOString(),
  };
}

// ============================================================================
// USAGE CHECKING
// ============================================================================

export type ResourceType = 'clients' | 'factures' | 'devis' | 'prestations';

interface UsageCount {
  clients: number;
  factures: number;
  devis: number;
  prestations: number;
}

export async function getUserUsage(userId: string): Promise<UsageCount> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [clients, factures, devis, prestations] = await Promise.all([
    prisma.client.count({ where: { userId, isArchived: false } }),
    prisma.invoice.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        statut: { not: 'ANNULEE' },
      },
    }),
    prisma.quote.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.prestation.count({ where: { userId, isActive: true } }),
  ]);

  return { clients, factures, devis, prestations };
}

export async function checkResourceLimit(
  userId: string,
  resource: ResourceType
): Promise<{ allowed: boolean; current: number; limit: number; planSlug: PlanSlug }> {
  const [userPlan, usage] = await Promise.all([
    getUserPlan(userId),
    getUserUsage(userId),
  ]);

  const limitKey = {
    clients: 'maxClients',
    factures: 'maxFactures',
    devis: 'maxDevis',
    prestations: 'maxPrestations',
  }[resource] as keyof PlanLimits;

  const limit = userPlan.limits[limitKey] as number;
  const current = usage[resource];

  // -1 = illimité
  const allowed = limit === -1 || current < limit;

  return {
    allowed,
    current,
    limit,
    planSlug: userPlan.slug,
  };
}

export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanLimits
): Promise<{ allowed: boolean; planSlug: PlanSlug }> {
  const userPlan = await getUserPlan(userId);
  const value = userPlan.limits[feature];

  return {
    allowed: typeof value === 'boolean' ? value : true,
    planSlug: userPlan.slug,
  };
}
