export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const prestationSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  description: z.string().optional().nullable(),
  typeTarif: z.enum(['HORAIRE', 'FORFAIT', 'JOURNALIER']).default('HORAIRE'),
  tauxHoraire: z.number().optional().nullable(),
  prixForfait: z.number().optional().nullable(),
  dureeMinutes: z.number().default(60),
  tauxTvaSpecifique: z.number().optional().nullable(),
  categorie: z.string().optional().nullable(),
  couleur: z.string().default('#3B82F6'),
  isActive: z.boolean().default(true),
});

// GET /api/prestations
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const where: any = { userId };
    if (activeOnly) where.isActive = true;

    const prestations = await prisma.prestation.findMany({
      where,
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { events: true, invoiceLines: true, quoteLines: true } },
      },
    });

    return success(prestations);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/prestations
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const data = prestationSchema.parse(body);

    const prestation = await prisma.prestation.create({
      data: {
        userId,
        nom: data.nom,
        description: data.description,
        typeTarif: data.typeTarif,
        tauxHoraire: data.tauxHoraire ?? undefined,
        prixForfait: data.prixForfait ?? undefined,
        dureeMinutes: data.dureeMinutes,
        tauxTvaSpecifique: data.tauxTvaSpecifique ?? undefined,
        categorie: data.categorie,
        couleur: data.couleur,
        isActive: data.isActive,
      },
    });

    return success(prestation, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Données invalides', error.errors);
    }
    return serverError(error);
  }
}
