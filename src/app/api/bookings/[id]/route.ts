export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/bookings/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const booking = await prisma.booking.findFirst({
      where: { 
        id: params.id,
        availabilityLink: { userId: session.user.id },
      },
      include: {
        availabilityLink: { select: { nom: true, dureeMinutes: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/bookings/[id] - Confirm or cancel
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const booking = await prisma.booking.findFirst({
      where: { 
        id: params.id,
        availabilityLink: { userId: session.user.id },
      },
      include: {
        availabilityLink: { select: { id: true, nom: true, disponibilites: true, userId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'confirm') {
      const disponibilites = booking.availabilityLink.disponibilites as any;
      
      const event = await prisma.event.create({
        data: {
          userId: session.user.id,
          titre: `${booking.availabilityLink.nom} — ${booking.prenom} ${booking.nom}`,
          dateDebut: booking.dateDebut,
          dateFin: booking.dateFin,
          type: 'PRESTATION',
          statut: 'CONFIRME',
          lieu: disponibilites?.lieu || null,
          description: `Réservation de ${booking.prenom} ${booking.nom}\nEmail: ${booking.email}${booking.telephone ? `\nTél: ${booking.telephone}` : ''}${booking.message ? `\nMessage: ${booking.message}` : ''}`,
        },
      });

      await prisma.booking.update({
        where: { id: params.id },
        data: { 
          statut: 'CONFIRME',
          confirmedAt: new Date(),
          eventId: event.id,
        },
      });

      return NextResponse.json({ message: 'Réservation confirmée', eventId: event.id });
    } else if (action === 'cancel') {
      const slot = await prisma.availabilitySlot.findFirst({
        where: {
          availabilityLinkId: booking.availabilityLink.id,
          dateDebut: booking.dateDebut,
          isBooked: true,
        },
      });

      if (slot) {
        await prisma.availabilitySlot.update({
          where: { id: slot.id },
          data: { isBooked: false },
        });
      }

      await prisma.booking.update({
        where: { id: params.id },
        data: { 
          statut: 'ANNULE_PRO',
          cancelledAt: new Date(),
          cancelReason: body.reason || null,
        },
      });

      return NextResponse.json({ message: 'Réservation annulée' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    console.error('PUT booking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
