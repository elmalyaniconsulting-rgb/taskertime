import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { generateInvoiceNumber } from '@/lib/utils';
import { z } from 'zod';

const lineSchema = z.object({
  prestationId: z.string().optional().nullable(),
  description: z.string().min(1, 'Description requise'),
  quantite: z.number().min(0),
  unite: z.string().default('heure'),
  prixUnitaire: z.number().min(0),
  tauxTva: z.number().default(0),
});

const quoteSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  dateValidite: z.string().transform((s) => new Date(s)),
  conditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  acompteRequis: z.boolean().default(false),
  acomptePourcent: z.number().optional().nullable(),
  lines: z.array(lineSchema).min(1, 'Au moins une ligne requise'),
});

// GET /api/quotes
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

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          client: { select: { id: true, nom: true, prenom: true, raisonSociale: true, email: true } },
          lines: { orderBy: { ordre: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return success({
      quotes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/quotes
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const data = quoteSchema.parse(body);

    // Récupérer le user pour le numéro de devis
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { prefixeDevis: true, prochainNumDevis: true, tvaApplicable: true, tauxTva: true },
    });
    if (!user) return unauthorized();

    // Générer le numéro
    const numero = generateInvoiceNumber(user.prefixeDevis, user.prochainNumDevis);

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
    const acompteMontant = data.acompteRequis && data.acomptePourcent
      ? totalTTC * (data.acomptePourcent / 100)
      : null;

    // Créer le devis avec ses lignes
    const quote = await prisma.quote.create({
      data: {
        userId,
        clientId: data.clientId,
        numero,
        dateValidite: data.dateValidite,
        totalHT,
        totalTVA,
        totalTTC,
        acompteRequis: data.acompteRequis,
        acomptePourcent: data.acomptePourcent ?? undefined,
        acompteMontant: acompteMontant ?? undefined,
        conditions: data.conditions,
        notes: data.notes,
        statut: 'BROUILLON',
        lines: {
          create: lines,
        },
      },
      include: {
        client: true,
        lines: { orderBy: { ordre: 'asc' } },
      },
    });

    // Incrémenter le compteur
    await prisma.user.update({
      where: { id: userId },
      data: { prochainNumDevis: { increment: 1 } },
    });

    return success(quote, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}
