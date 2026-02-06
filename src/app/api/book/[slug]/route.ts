export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, bookingConfirmationTemplate, newBookingNotificationTemplate } from '@/lib/email';

// GET /api/book/[slug] - Public: Get available slots
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const link = await prisma.availabilityLink.findUnique({
      where: { slug: params.slug },
      include: {
        user: {
          select: { firstName: true, lastName: true, activite: true },
        },
        slots: {
          where: { 
            isBooked: false,
            dateDebut: { gte: new Date() },
          },
          orderBy: { dateDebut: 'asc' },
        },
      },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 });
    }

    const disponibilites = link.disponibilites as any;

    return NextResponse.json({
      id: link.id,
      nom: link.nom,
      description: link.description,
      dureeMinutes: link.dureeMinutes,
      lieu: disponibilites?.lieu || null,
      pro: {
        nom: `${link.user.firstName} ${link.user.lastName}`,
        activite: link.user.activite,
      },
      slots: link.slots.map((s: any) => ({
        id: s.id,
        dateDebut: s.dateDebut,
        dateFin: s.dateFin,
      })),
    });
  } catch (error: any) {
    console.error('GET book error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/book/[slug] - Public: Create a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const { slotId, nom, prenom, email, telephone, message } = body;

    if (!slotId || !nom || !prenom || !email) {
      return NextResponse.json({ error: 'Informations manquantes' }, { status: 400 });
    }

    const link = await prisma.availabilityLink.findUnique({
      where: { slug: params.slug },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
    }

    const slot = await prisma.availabilitySlot.findFirst({
      where: { id: slotId, availabilityLinkId: link.id, isBooked: false },
    });

    if (!slot) {
      return NextResponse.json({ error: 'Créneau non disponible' }, { status: 400 });
    }

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          availabilityLinkId: link.id,
          dateDebut: slot.dateDebut,
          dateFin: slot.dateFin,
          nom,
          prenom,
          email,
          telephone: telephone || null,
          message: message || null,
          statut: 'EN_ATTENTE',
        },
      }),
      prisma.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      }),
    ]);

    await prisma.notification.create({
      data: {
        userId: link.user.id,
        type: 'RESERVATION',
        titre: `Nouvelle réservation de ${prenom} ${nom}`,
        message: `${link.nom} — ${new Date(slot.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
        entityType: 'booking',
        entityId: booking.id,
      },
    });

    // Emails asynchrones (ne bloquent pas la réponse)
    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';
    const proName = `${link.user.firstName} ${link.user.lastName}`;
    const dtStr = new Date(slot.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dureeMin = Math.round((slot.dateFin.getTime() - slot.dateDebut.getTime()) / 60000);
    const disponibilites = link.disponibilites as any;

    // 1. Confirmation au client
    sendEmail({
      to: email,
      subject: `Réservation envoyée — ${link.nom}`,
      html: bookingConfirmationTemplate({
        clientName: `${prenom} ${nom}`,
        proName,
        bookingTitle: link.nom,
        dateTime: dtStr,
        duration: `${dureeMin} min`,
        location: disponibilites?.lieu,
      }),
    }).catch(console.error);

    // 2. Notification au professionnel
    const proUser = await prisma.user.findUnique({
      where: { id: link.user.id },
      select: { email: true },
    });
    if (proUser?.email) {
      sendEmail({
        to: proUser.email,
        subject: `Nouvelle réservation : ${prenom} ${nom}`,
        html: newBookingNotificationTemplate({
          proName,
          clientName: `${prenom} ${nom}`,
          clientEmail: email,
          bookingTitle: link.nom,
          dateTime: dtStr,
          message,
          dashboardUrl: `${baseUrl}/bookings`,
        }),
      }).catch(console.error);
    }

    return NextResponse.json({ 
      success: true, 
      booking: {
        id: booking.id,
        dateDebut: booking.dateDebut,
        dateFin: booking.dateFin,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST book error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
