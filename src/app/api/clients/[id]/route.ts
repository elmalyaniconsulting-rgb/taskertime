import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  type: z.enum(['PARTICULIER', 'ENTREPRISE', 'ASSOCIATION', 'ETABLISSEMENT_PUBLIC']).optional(),
  raisonSociale: z.string().optional().nullable(),
  nom: z.string().min(1).optional(),
  prenom: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  tvaIntracom: z.string().optional().nullable(),
  email: z.string().email().optional(),
  telephone: z.string().optional().nullable(),
  adresseRue: z.string().optional().nullable(),
  adresseCP: z.string().optional().nullable(),
  adresseVille: z.string().optional().nullable(),
  adressePays: z.string().optional(),
  isChorusPro: z.boolean().optional(),
  codeService: z.string().optional().nullable(),
  numeroEngagement: z.string().optional().nullable(),
  tauxHoraireClient: z.number().optional().nullable(),
  delaiPaiement: z.number().optional(),
  modePaiement: z.enum(['VIREMENT', 'CHEQUE', 'CB', 'ESPECES', 'PRELEVEMENT', 'STRIPE']).optional(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isArchived: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

// GET /api/clients/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const client = await prisma.client.findFirst({
      where: { id: params.id, userId },
      include: {
        interactions: { orderBy: { date: 'desc' }, take: 10 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, numero: true, totalTTC: true, statut: true, dateEmission: true } },
        quotes: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, numero: true, totalTTC: true, statut: true, dateEmission: true } },
        events: { orderBy: { dateDebut: 'desc' }, take: 10, select: { id: true, titre: true, dateDebut: true, dateFin: true, statut: true } },
        _count: { select: { invoices: true, quotes: true, events: true, contracts: true } },
      },
    });

    if (!client) return notFound('Client introuvable');

    return success(client);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/clients/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound('Client introuvable');

    const body = await request.json();
    const data = updateSchema.parse(body);

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...data,
        tauxHoraireClient: data.tauxHoraireClient ?? undefined,
      },
    });

    return success(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Données invalides', error.errors);
    }
    return serverError(error);
  }
}

// DELETE /api/clients/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return notFound('Client introuvable');

    await prisma.client.delete({ where: { id: params.id } });

    return success({ message: 'Client supprimé' });
  } catch (error) {
    return serverError(error);
  }
}
