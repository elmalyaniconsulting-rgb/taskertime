import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  dateValidite: z.string().transform((s) => new Date(s)).optional(),
  conditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  statut: z.enum(['BROUILLON', 'ENVOYE', 'VU', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'CONVERTI']).optional(),
  acompteRequis: z.boolean().optional(),
  acomptePourcent: z.number().optional().nullable(),
});

interface Params {
  params: { id: string };
}

// GET /api/quotes/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const quote = await prisma.quote.findFirst({
      where: { id: params.id, userId },
      include: {
        client: true,
        lines: { orderBy: { ordre: 'asc' }, include: { prestation: { select: { nom: true } } } },
        documents: true,
      },
    });

    if (!quote) return notFound('Devis introuvable');
    return success(quote);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/quotes/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.quote.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Devis introuvable');

    const body = await request.json();
    const data = updateSchema.parse(body);

    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: {
        ...data,
        acomptePourcent: data.acomptePourcent ?? undefined,
      },
      include: { client: true, lines: { orderBy: { ordre: 'asc' } } },
    });

    return success(quote);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}

// DELETE /api/quotes/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.quote.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Devis introuvable');

    if (!['BROUILLON', 'REFUSE', 'EXPIRE'].includes(existing.statut)) {
      return badRequest('Impossible de supprimer un devis envoyé ou accepté');
    }

    await prisma.quote.delete({ where: { id: params.id } });
    return success({ message: 'Devis supprimé' });
  } catch (error) {
    return serverError(error);
  }
}
