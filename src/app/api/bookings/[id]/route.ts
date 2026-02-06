export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail, bookingConfirmedToClientTemplate, bookingCancellationTemplate } from '@/lib/email';
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

      // Email de confirmation au client
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, lastName: true },
      });
      const proName = `${user?.firstName} ${user?.lastName}`;
      const dt = new Date(booking.dateDebut);
      const dateStr = dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const duree = Math.round((new Date(booking.dateFin).getTime() - dt.getTime()) / 60000);

      sendEmail({
        to: booking.email,
        subject: `Réservation confirmée — ${booking.availabilityLink.nom}`,
        html: bookingConfirmedToClientTemplate({
          clientName: `${booking.prenom} ${booking.nom}`,
          proName,
          bookingTitle: booking.availabilityLink.nom,
          dateTime: dateStr,
          duration: `${duree} min`,
          location: disponibilites?.lieu,
        }),
      }).catch(console.error);

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

      // Email d'annulation au client
      const cancelUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, lastName: true },
      });
      const cancelProName = `${cancelUser?.firstName} ${cancelUser?.lastName}`;
      const cancelDt = new Date(booking.dateDebut);
      const cancelDateStr = cancelDt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      sendEmail({
        to: booking.email,
        subject: `Réservation annulée — ${booking.availabilityLink.nom}`,
        html: bookingCancellationTemplate({
          clientName: `${booking.prenom} ${booking.nom}`,
          proName: cancelProName,
          bookingTitle: booking.availabilityLink.nom,
          dateTime: cancelDateStr,
          reason: body.reason,
        }),
      }).catch(console.error);

      return NextResponse.json({ message: 'Réservation annulée' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    console.error('PUT booking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
