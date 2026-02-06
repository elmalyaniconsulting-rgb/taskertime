export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/plans - List all active plans
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { ordre: 'asc' },
      select: {
        id: true,
        slug: true,
        nom: true,
        description: true,
        prixMensuel: true,
        prixAnnuel: true,
        maxClients: true,
        maxFactures: true,
        maxDevis: true,
        maxPrestations: true,
        stripeConnect: true,
        reservationEnLigne: true,
        contrats: true,
        signatureElec: true,
        relancesAuto: true,
        statsAvancees: true,
        crmComplet: true,
        branding: true,
        iaAssistant: true,
        whatsapp: true,
        googleCalSync: true,
        espaceClient: true,
        apiAccess: true,
        multiDevise: true,
        exportFec: true,
        supportPrio: true,
      },
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
