import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const contractSchema = z.object({
  clientId: z.string().optional().nullable(),
  nom: z.string().min(1, 'Nom requis'),
  description: z.string().optional().nullable(),
});

// GET /api/contracts
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const statut = searchParams.get('statut');

    const where: any = { userId };
    if (clientId) where.clientId = clientId;
    if (statut) where.statut = statut;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: { select: { id: true, nom: true, prenom: true, raisonSociale: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(contracts);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/contracts
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const data = contractSchema.parse(body);

    const contract = await prisma.contract.create({
      data: {
        userId,
        clientId: data.clientId,
        nom: data.nom,
        description: data.description,
        statut: 'BROUILLON',
      },
      include: { client: { select: { nom: true, raisonSociale: true } } },
    });

    return success(contract, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}
