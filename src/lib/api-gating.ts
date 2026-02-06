import { NextResponse } from 'next/server';
import { checkResourceLimit, checkFeatureAccess, type ResourceType } from '@/lib/plans';
import type { PlanLimits } from '@/types';

/**
 * Check resource limit before creating a new resource.
 * Returns null if allowed, or a NextResponse with 403 if blocked.
 */
export async function requireResourceLimit(
  userId: string,
  resource: ResourceType
): Promise<NextResponse | null> {
  const check = await checkResourceLimit(userId, resource);

  if (!check.allowed) {
    const resourceLabels: Record<ResourceType, string> = {
      clients: 'clients',
      factures: 'factures ce mois',
      devis: 'devis ce mois',
      prestations: 'prestations',
    };

    return NextResponse.json(
      {
        error: 'Limite du plan atteinte',
        code: 'PLAN_LIMIT_REACHED',
        resource,
        current: check.current,
        limit: check.limit,
        message: `Votre plan ${check.planSlug === 'free' ? 'Gratuit' : check.planSlug} est limité à ${check.limit} ${resourceLabels[resource]}. Passez au plan supérieur pour continuer.`,
        upgradeUrl: '/pricing',
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Check feature access before using a premium feature.
 * Returns null if allowed, or a NextResponse with 403 if blocked.
 */
export async function requireFeature(
  userId: string,
  feature: keyof PlanLimits,
  featureLabel: string
): Promise<NextResponse | null> {
  const check = await checkFeatureAccess(userId, feature);

  if (!check.allowed) {
    return NextResponse.json(
      {
        error: 'Fonctionnalité non disponible',
        code: 'FEATURE_NOT_AVAILABLE',
        feature,
        message: `La fonctionnalité "${featureLabel}" n'est pas incluse dans votre plan ${check.planSlug === 'free' ? 'Gratuit' : check.planSlug}. Passez au plan supérieur.`,
        upgradeUrl: '/pricing',
      },
      { status: 403 }
    );
  }

  return null;
}
