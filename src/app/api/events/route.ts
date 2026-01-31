import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const eventSchema = z.object({
  clientId: z.string().optional().nullable(),
  prestationId: z.string().optional().nullable(),
  titre: z.string().min(1, 'Titre requis'),
  description: z.string().optional().nullable(),
  lieu: z.string().optional().nullable(),
  isDistanciel: z.boolean().default(false),
  lienVisio: z.string().optional().nullable(),
  dateDebut: z.string().transform((s) => new Date(s)),
  dateFin: z.string().transform((s) => new Date(s)),
  isAllDay: z.boolean().default(false),
  type: z.enum(['PRESTATION', 'REUNION', 'PERSONNEL', 'AUTRE']).default('PRESTATION'),
  tauxHoraire: z.number().optional().nullable(),
  montantFixe: z.number().optional().nullable(),
  statut: z.enum(['PLANIFIE', 'CONFIRME', 'EN_COURS', 'REALISE', 'ANNULE', 'REPORTE']).default('PLANIFIE'),
});

// GET /api/events
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const clientId = searchParams.get('clientId');

    const where: any = { userId };

    if (start && end) {
      where.dateDebut = { gte: new Date(start) };
      where.dateFin = { lte: new Date(end) };
    }

    if (clientId) where.clientId = clientId;

    const events = await prisma.event.findMany({
      where,
      include: {
        client: { select: { id: true, nom: true, prenom: true, raisonSociale: true } },
        prestation: { select: { id: true, nom: true, couleur: true } },
      },
      orderBy: { dateDebut: 'asc' },
    });

    return success(events);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/events
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const data = eventSchema.parse(body);

    // Calculer la durée et le montant
    const dureeMs = data.dateFin.getTime() - data.dateDebut.getTime();
    const dureeHeures = dureeMs / (1000 * 60 * 60);
    let montantCalcule = 0;

    if (data.montantFixe) {
      montantCalcule = data.montantFixe;
    } else if (data.tauxHoraire) {
      montantCalcule = data.tauxHoraire * dureeHeures;
    } else if (data.prestationId) {
      const prestation = await prisma.prestation.findUnique({
        where: { id: data.prestationId },
      });
      if (prestation) {
        if (prestation.typeTarif === 'FORFAIT' && prestation.prixForfait) {
          montantCalcule = Number(prestation.prixForfait);
        } else if (prestation.tauxHoraire) {
          montantCalcule = Number(prestation.tauxHoraire) * dureeHeures;
        }
      }
    }

    const event = await prisma.event.create({
      data: {
        userId,
        clientId: data.clientId,
        prestationId: data.prestationId,
        titre: data.titre,
        description: data.description,
        lieu: data.lieu,
        isDistanciel: data.isDistanciel,
        lienVisio: data.lienVisio,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        isAllDay: data.isAllDay,
        type: data.type,
        tauxHoraire: data.tauxHoraire ?? undefined,
        montantFixe: data.montantFixe ?? undefined,
        dureeHeures,
        montantCalcule,
        statut: data.statut,
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true } },
        prestation: { select: { id: true, nom: true, couleur: true } },
      },
    });

    return success(event, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}
