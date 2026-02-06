export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { requireResourceLimit } from '@/lib/api-gating';
import { z } from 'zod';

const clientSchema = z.object({
  type: z.enum(['PARTICULIER', 'ENTREPRISE', 'ASSOCIATION', 'ETABLISSEMENT_PUBLIC']).default('PARTICULIER'),
  raisonSociale: z.string().optional().nullable(),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  tvaIntracom: z.string().optional().nullable(),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional().nullable(),
  adresseRue: z.string().optional().nullable(),
  adresseCP: z.string().optional().nullable(),
  adresseVille: z.string().optional().nullable(),
  adressePays: z.string().default('FR'),
  isChorusPro: z.boolean().default(false),
  codeService: z.string().optional().nullable(),
  numeroEngagement: z.string().optional().nullable(),
  tauxHoraireClient: z.number().optional().nullable(),
  delaiPaiement: z.number().default(30),
  modePaiement: z.enum(['VIREMENT', 'CHEQUE', 'CB', 'ESPECES', 'PRELEVEMENT', 'STRIPE']).default('VIREMENT'),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

// GET /api/clients - Liste des clients
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const archived = searchParams.get('archived') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isArchived: archived,
    };

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { raisonSociale: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { nom: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { invoices: true, quotes: true, events: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return success({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/clients - Créer un client
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const data = clientSchema.parse(body);

    // Vérifier limite du plan
    const limitBlock = await requireResourceLimit(userId, 'clients');
    if (limitBlock) return limitBlock;

    const client = await prisma.client.create({
      data: {
        userId,
        ...data,
        tauxHoraireClient: data.tauxHoraireClient ?? undefined,
      },
    });

    return success(client, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('Données invalides', error.errors);
    }
    return serverError(error);
  }
}
