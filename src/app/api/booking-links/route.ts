export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { requireFeature } from '@/lib/api-gating';

// GET /api/booking-links
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const links = await prisma.availabilityLink.findMany({
      where: { userId: session.user.id },
      include: {
        slots: {
          select: { id: true, dateDebut: true, dateFin: true, isBooked: true },
          orderBy: { dateDebut: 'asc' },
        },
        bookings: {
          select: { id: true, nom: true, prenom: true, email: true, dateDebut: true, statut: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { slots: true, bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(links);
  } catch (error: any) {
    console.error('GET booking-links error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/booking-links
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { nom, description, prestationId, dureeMinutes, lieu, slots } = body;

    // Réservation en ligne = fonctionnalité Pro
    const featureBlock = await requireFeature(session.user.id, 'reservationEnLigne', 'Réservation en ligne');
    if (featureBlock) return featureBlock;

    if (!nom || !slots || slots.length === 0) {
      return NextResponse.json({ error: 'Nom et créneaux requis' }, { status: 400 });
    }

    const slug = nanoid(10);

    const link = await prisma.availabilityLink.create({
      data: {
        userId: session.user.id,
        slug,
        nom,
        description: description || null,
        prestationId: prestationId || null,
        dureeMinutes: dureeMinutes || 60,
        disponibilites: { lieu: lieu || null },
        slots: {
          create: slots.map((s: { dateDebut: string; dateFin: string }) => ({
            dateDebut: new Date(s.dateDebut),
            dateFin: new Date(s.dateFin),
          })),
        },
      },
      include: {
        slots: true,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error: any) {
    console.error('POST booking-links error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
