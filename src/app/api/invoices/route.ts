export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { requireResourceLimit } from '@/lib/api-gating';
import { generateInvoiceNumber } from '@/lib/utils';
import { z } from 'zod';

const lineSchema = z.object({
  prestationId: z.string().optional().nullable(),
  description: z.string().min(1),
  quantite: z.number().min(0),
  unite: z.string().default('heure'),
  prixUnitaire: z.number().min(0),
  tauxTva: z.number().default(0),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  dateEcheance: z.string().transform((s) => new Date(s)),
  conditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  mentionsLegales: z.string().optional().nullable(),
  lines: z.array(lineSchema).min(1, 'Au moins une ligne requise'),
});

// GET /api/invoices
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { userId };
    if (statut) where.statut = statut;
    if (clientId) where.clientId = clientId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, nom: true, prenom: true, raisonSociale: true, email: true } },
          lines: { orderBy: { ordre: 'asc' } },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return success({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/invoices
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const data = invoiceSchema.parse(body);

    // Vérifier limite du plan
    const limitBlock = await requireResourceLimit(userId, 'factures');
    if (limitBlock) return limitBlock;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { prefixeFacture: true, prochainNumFacture: true, mentionTvaExo: true },
    });
    if (!user) return unauthorized();

    const client = await prisma.client.findFirst({
      where: { id: data.clientId, userId },
    });
    if (!client) return badRequest('Client introuvable');

    const numero = generateInvoiceNumber(user.prefixeFacture, user.prochainNumFacture);

    // Calculer les totaux par ligne
    const lines = data.lines.map((line, index) => {
      const totalHT = line.quantite * line.prixUnitaire;
      const totalTVA = totalHT * (line.tauxTva / 100);
      const totalTTC = totalHT + totalTVA;
      return {
        ...line,
        totalHT,
        totalTVA,
        totalTTC,
        ordre: index,
        prestationId: line.prestationId || undefined,
      };
    });

    const totalHT = lines.reduce((sum, l) => sum + l.totalHT, 0);
    const totalTVA = lines.reduce((sum, l) => sum + l.totalTVA, 0);
    const totalTTC = lines.reduce((sum, l) => sum + l.totalTTC, 0);

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        clientId: data.clientId,
        numero,
        dateEcheance: data.dateEcheance,
        totalHT,
        totalTVA,
        totalTTC,
        resteAPayer: totalTTC,
        statut: 'BROUILLON',
        conditions: data.conditions,
        notes: data.notes,
        mentionsLegales: data.mentionsLegales || user.mentionTvaExo,
        isChorusPro: client.isChorusPro,
        lines: { create: lines },
      },
      include: { client: true, lines: { orderBy: { ordre: 'asc' } } },
    });

    // Incrémenter le compteur
    await prisma.user.update({
      where: { id: userId },
      data: { prochainNumFacture: { increment: 1 } },
    });

    return success(invoice, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}
