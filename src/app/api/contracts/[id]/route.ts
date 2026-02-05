export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  clientId: z.string().optional().nullable(),
  nom: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  statut: z.enum(['BROUILLON', 'ENVOYE', 'VU', 'SIGNE', 'REFUSE', 'EXPIRE']).optional(),
});

interface Params {
  params: { id: string };
}

// GET /api/contracts/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const contract = await prisma.contract.findFirst({
      where: { id: params.id, userId },
      include: { client: true },
    });

    if (!contract) return notFound('Contrat introuvable');
    return success(contract);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/contracts/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.contract.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Contrat introuvable');

    const body = await request.json();
    const data = updateSchema.parse(body);

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data,
      include: { client: true },
    });

    return success(contract);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}

// DELETE /api/contracts/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.contract.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Contrat introuvable');

    await prisma.contract.delete({ where: { id: params.id } });
    return success({ message: 'Contrat supprimé' });
  } catch (error) {
    return serverError(error);
  }
}
