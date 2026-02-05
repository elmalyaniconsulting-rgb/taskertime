export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { badRequest, notFound, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const bookingSchema = z.object({
  slug: z.string().min(1),
  dateDebut: z.string().transform((s) => new Date(s)),
  dateFin: z.string().transform((s) => new Date(s)),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional().nullable(),
  entreprise: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

// GET /api/bookings/public?slug=xxx - Récupérer les infos d'un lien + créneaux
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) return badRequest('Slug requis');

    const link = await prisma.availabilityLink.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            activite: true,
            avatar: true,
          },
        },
      },
    });

    if (!link || !link.isActive) return notFound('Lien de réservation introuvable');

    // Récupérer les créneaux déjà réservés pour bloquer
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + link.delaiMaxReservation);

    const existingBookings = await prisma.booking.findMany({
      where: {
        availabilityLinkId: link.id,
        statut: { in: ['EN_ATTENTE', 'CONFIRME'] },
        dateDebut: { gte: now, lte: maxDate },
      },
      select: { dateDebut: true, dateFin: true },
    });

    const existingEvents = await prisma.event.findMany({
      where: {
        userId: link.userId,
        dateDebut: { gte: now, lte: maxDate },
        statut: { in: ['PLANIFIE', 'CONFIRME', 'EN_COURS'] },
      },
      select: { dateDebut: true, dateFin: true },
    });

    return success({
      link: {
        nom: link.nom,
        description: link.description,
        dureeMinutes: link.dureeMinutes,
        disponibilites: link.disponibilites,
        delaiMinReservation: link.delaiMinReservation,
        delaiMaxReservation: link.delaiMaxReservation,
        bufferAvant: link.bufferAvant,
        bufferApres: link.bufferApres,
        afficherTarif: link.afficherTarif,
        tarifAffiche: link.tarifAffiche,
        acompteRequis: link.acompteRequis,
        couleur: link.couleur,
      },
      pro: link.user,
      busy: [...existingBookings, ...existingEvents],
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/bookings/public - Créer une réservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    const link = await prisma.availabilityLink.findUnique({
      where: { slug: data.slug },
    });

    if (!link || !link.isActive) return notFound('Lien de réservation introuvable');

    // Vérifier que le créneau n'est pas déjà pris
    const conflict = await prisma.booking.findFirst({
      where: {
        availabilityLinkId: link.id,
        statut: { in: ['EN_ATTENTE', 'CONFIRME'] },
        OR: [
          {
            dateDebut: { lt: data.dateFin },
            dateFin: { gt: data.dateDebut },
          },
        ],
      },
    });

    if (conflict) {
      return badRequest('Ce créneau n\'est plus disponible');
    }

    const booking = await prisma.booking.create({
      data: {
        availabilityLinkId: link.id,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        entreprise: data.entreprise,
        message: data.message,
        statut: 'EN_ATTENTE',
      },
    });

    // Créer une notification pour le pro
    await prisma.notification.create({
      data: {
        userId: link.userId,
        type: 'NOUVELLE_RESERVATION',
        titre: 'Nouvelle réservation',
        message: `${data.prenom} ${data.nom} a réservé un créneau le ${data.dateDebut.toLocaleDateString('fr-FR')}`,
        entityType: 'booking',
        entityId: booking.id,
      },
    });

    return success({
      message: 'Réservation enregistrée',
      booking: {
        id: booking.id,
        token: booking.token,
        dateDebut: booking.dateDebut,
        dateFin: booking.dateFin,
      },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}
