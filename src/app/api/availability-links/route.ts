import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, badRequest, serverError, success } from '@/lib/api-helpers';
import { slugify } from '@/lib/utils';
import { z } from 'zod';

const linkSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  description: z.string().optional().nullable(),
  dureeMinutes: z.number().default(60),
  prestationId: z.string().optional().nullable(),
  disponibilites: z.any().optional(),
  delaiMinReservation: z.number().default(24),
  delaiMaxReservation: z.number().default(30),
  bufferAvant: z.number().default(0),
  bufferApres: z.number().default(15),
  afficherTarif: z.boolean().default(false),
  tarifAffiche: z.number().optional().nullable(),
  acompteRequis: z.boolean().default(false),
  acomptePourcent: z.number().optional().nullable(),
  couleur: z.string().default('#10B981'),
});

// GET /api/availability-links
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const links = await prisma.availabilityLink.findMany({
      where: { userId },
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return success(links);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/availability-links
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const data = linkSchema.parse(body);

    // Générer un slug unique
    let slug = slugify(data.nom);
    const existingSlug = await prisma.availabilityLink.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const link = await prisma.availabilityLink.create({
      data: {
        userId,
        slug,
        nom: data.nom,
        description: data.description,
        dureeMinutes: data.dureeMinutes,
        prestationId: data.prestationId,
        disponibilites: data.disponibilites,
        delaiMinReservation: data.delaiMinReservation,
        delaiMaxReservation: data.delaiMaxReservation,
        bufferAvant: data.bufferAvant,
        bufferApres: data.bufferApres,
        afficherTarif: data.afficherTarif,
        tarifAffiche: data.tarifAffiche ?? undefined,
        acompteRequis: data.acompteRequis,
        acomptePourcent: data.acomptePourcent ?? undefined,
        couleur: data.couleur,
      },
    });

    return success(link, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}
