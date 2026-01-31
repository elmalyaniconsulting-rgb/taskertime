import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  dureeMinutes: z.number().optional(),
  prestationId: z.string().optional().nullable(),
  disponibilites: z.any().optional(),
  delaiMinReservation: z.number().optional(),
  delaiMaxReservation: z.number().optional(),
  bufferAvant: z.number().optional(),
  bufferApres: z.number().optional(),
  afficherTarif: z.boolean().optional(),
  tarifAffiche: z.number().optional().nullable(),
  acompteRequis: z.boolean().optional(),
  acomptePourcent: z.number().optional().nullable(),
  couleur: z.string().optional(),
  isActive: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

// GET /api/availability-links/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const link = await prisma.availabilityLink.findFirst({
      where: { id: params.id, userId },
      include: {
        bookings: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { bookings: true } },
      },
    });

    if (!link) return notFound('Lien introuvable');
    return success(link);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/availability-links/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.availabilityLink.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Lien introuvable');

    const body = await request.json();
    const data = updateSchema.parse(body);

    const link = await prisma.availabilityLink.update({
      where: { id: params.id },
      data: {
        ...data,
        tarifAffiche: data.tarifAffiche ?? undefined,
        acomptePourcent: data.acomptePourcent ?? undefined,
      },
    });

    return success(link);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}

// DELETE /api/availability-links/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.availabilityLink.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Lien introuvable');

    await prisma.availabilityLink.delete({ where: { id: params.id } });
    return success({ message: 'Lien supprimé' });
  } catch (error) {
    return serverError(error);
  }
}
