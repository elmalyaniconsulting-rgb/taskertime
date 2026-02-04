import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

// GET /api/booking-links - List all booking links
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/booking-links - Create booking link with slots
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { nom, description, prestationId, dureeMinutes, lieu, slots } = body;

    if (!nom || !slots || slots.length === 0) {
      return NextResponse.json({ error: 'Nom et créneaux requis' }, { status: 400 });
    }

    // Generate unique slug
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
    console.error('Create booking link error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
