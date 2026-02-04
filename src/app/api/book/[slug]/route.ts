import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: { slug: string };
}

// GET /api/book/[slug] - Public: Get available slots
export async function GET(request: NextRequest, { params }: Params) {
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

    // Parse lieu from disponibilites JSON
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
      slots: link.slots.map(s => ({
        id: s.id,
        dateDebut: s.dateDebut,
        dateFin: s.dateFin,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/book/[slug] - Public: Create a booking
export async function POST(request: NextRequest, { params }: Params) {
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

    // Check slot availability
    const slot = await prisma.availabilitySlot.findFirst({
      where: { id: slotId, availabilityLinkId: link.id, isBooked: false },
    });

    if (!slot) {
      return NextResponse.json({ error: 'Créneau non disponible' }, { status: 400 });
    }

    // Create booking and mark slot as booked
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

    // Create notification for pro
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

    return NextResponse.json({ 
      success: true, 
      booking: {
        id: booking.id,
        dateDebut: booking.dateDebut,
        dateFin: booking.dateFin,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
