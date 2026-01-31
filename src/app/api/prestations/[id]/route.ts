import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  typeTarif: z.enum(['HORAIRE', 'FORFAIT', 'JOURNALIER']).optional(),
  tauxHoraire: z.number().optional().nullable(),
  prixForfait: z.number().optional().nullable(),
  dureeMinutes: z.number().optional(),
  tauxTvaSpecifique: z.number().optional().nullable(),
  categorie: z.string().optional().nullable(),
  couleur: z.string().optional(),
  isActive: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

// GET /api/prestations/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const prestation = await prisma.prestation.findFirst({
      where: { id: params.id, userId },
      include: {
        _count: { select: { events: true, invoiceLines: true, quoteLines: true } },
      },
    });

    if (!prestation) return notFound('Prestation introuvable');
    return success(prestation);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/prestations/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.prestation.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound('Prestation introuvable');

    const body = await request.json();
    const data = updateSchema.parse(body);

    const prestation = await prisma.prestation.update({
      where: { id: params.id },
      data: {
        ...data,
        tauxHoraire: data.tauxHoraire ?? undefined,
        prixForfait: data.prixForfait ?? undefined,
        tauxTvaSpecifique: data.tauxTvaSpecifique ?? undefined,
      },
    });

    return success(prestation);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}

// DELETE /api/prestations/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.prestation.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound('Prestation introuvable');

    await prisma.prestation.delete({ where: { id: params.id } });
    return success({ message: 'Prestation supprimée' });
  } catch (error) {
    return serverError(error);
  }
}
