export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  clientId: z.string().optional().nullable(),
  prestationId: z.string().optional().nullable(),
  titre: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  lieu: z.string().optional().nullable(),
  isDistanciel: z.boolean().optional(),
  lienVisio: z.string().optional().nullable(),
  dateDebut: z.string().transform((s) => new Date(s)).optional(),
  dateFin: z.string().transform((s) => new Date(s)).optional(),
  isAllDay: z.boolean().optional(),
  type: z.enum(['PRESTATION', 'REUNION', 'PERSONNEL', 'AUTRE']).optional(),
  tauxHoraire: z.number().optional().nullable(),
  montantFixe: z.number().optional().nullable(),
  statut: z.enum(['PLANIFIE', 'CONFIRME', 'EN_COURS', 'REALISE', 'ANNULE', 'REPORTE']).optional(),
});

interface Params {
  params: { id: string };
}

// GET /api/events/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const event = await prisma.event.findFirst({
      where: { id: params.id, userId },
      include: {
        client: true,
        prestation: true,
      },
    });

    if (!event) return notFound('Événement introuvable');
    return success(event);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/events/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.event.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Événement introuvable');

    const body = await request.json();
    const data = updateSchema.parse(body);

    // Recalculer durée et montant si dates changent
    const dateDebut = data.dateDebut || existing.dateDebut;
    const dateFin = data.dateFin || existing.dateFin;
    const dureeHeures = (dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60);

    let montantCalcule = Number(existing.montantCalcule);
    const tauxHoraire = data.tauxHoraire !== undefined ? data.tauxHoraire : Number(existing.tauxHoraire);
    const montantFixe = data.montantFixe !== undefined ? data.montantFixe : Number(existing.montantFixe);

    if (montantFixe) {
      montantCalcule = montantFixe;
    } else if (tauxHoraire) {
      montantCalcule = tauxHoraire * dureeHeures;
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...data,
        tauxHoraire: data.tauxHoraire ?? undefined,
        montantFixe: data.montantFixe ?? undefined,
        dureeHeures,
        montantCalcule,
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true } },
        prestation: { select: { id: true, nom: true, couleur: true } },
      },
    });

    return success(event);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}

// DELETE /api/events/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const existing = await prisma.event.findFirst({ where: { id: params.id, userId } });
    if (!existing) return notFound('Événement introuvable');

    await prisma.event.delete({ where: { id: params.id } });
    return success({ message: 'Événement supprimé' });
  } catch (error) {
    return serverError(error);
  }
}
