import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/booking-links/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const link = await prisma.availabilityLink.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        slots: { orderBy: { dateDebut: 'asc' } },
        bookings: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 });
    }

    return NextResponse.json(link);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/booking-links/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const existing = await prisma.availabilityLink.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 });
    }

    const body = await request.json();

    const link = await prisma.availabilityLink.update({
      where: { id: params.id },
      data: {
        nom: body.nom,
        description: body.description,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(link);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/booking-links/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const existing = await prisma.availabilityLink.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 });
    }

    await prisma.availabilityLink.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Supprimé' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
