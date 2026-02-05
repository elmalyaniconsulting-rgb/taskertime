export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  dateEcheance: z.string().transform((s) => new Date(s)).optional(),
  conditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  mentionsLegales: z.string().optional().nullable(),
  statut: z.enum(['BROUILLON', 'ENVOYEE', 'VUE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE', 'AVOIR']).optional(),
});

interface Params {
  params: { id: string };
}

// GET /api/invoices/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: {
        client: true,
        lines: { orderBy: { ordre: 'asc' }, include: { prestation: { select: { nom: true } } } },
        payments: { orderBy: { datePaiement: 'desc' } },
        documents: true,
      },
    });

    if (!invoice) return notFound('Facture introuvable');
    return success(invoice);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/invoices/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.invoice.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Facture introuvable');

    const body = await request.json();
    const data = updateSchema.parse(body);

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data,
      include: { client: true, lines: { orderBy: { ordre: 'asc' } }, payments: true },
    });

    return success(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: { _count: { select: { payments: true } } },
    });
    if (!existing) return notFound('Facture introuvable');

    if (existing._count.payments > 0) {
      return badRequest('Impossible de supprimer une facture avec des paiements enregistrés');
    }

    if (!['BROUILLON', 'ANNULEE'].includes(existing.statut)) {
      return badRequest('Seules les factures en brouillon ou annulées peuvent être supprimées');
    }

    await prisma.invoice.delete({ where: { id: params.id } });
    return success({ message: 'Facture supprimée' });
  } catch (error) {
    return serverError(error);
  }
}
