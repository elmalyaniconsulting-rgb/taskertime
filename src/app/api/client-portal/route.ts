export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/client-portal - Client login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { email, passwordHash: { not: null } },
    });

    if (!client || !client.passwordHash) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, client.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    // Update last login
    await prisma.client.update({
      where: { id: client.id },
      data: { lastLogin: new Date() },
    });

    // Return client data (no JWT for now, session-based)
    return NextResponse.json({
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      raisonSociale: client.raisonSociale,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/client-portal?clientId=xxx - Get client documents
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID requis' }, { status: 400 });
  }

  try {
    const [invoices, quotes, contracts, bookings] = await Promise.all([
      prisma.invoice.findMany({
        where: { clientId },
        orderBy: { dateEmission: 'desc' },
        take: 20,
        select: {
          id: true,
          numero: true,
          dateEmission: true,
          dateEcheance: true,
          totalTTC: true,
          resteAPayer: true,
          statut: true,
          stripePaymentUrl: true,
        },
      }),
      prisma.quote.findMany({
        where: { clientId },
        orderBy: { dateEmission: 'desc' },
        take: 20,
        select: {
          id: true,
          numero: true,
          dateEmission: true,
          dateValidite: true,
          totalTTC: true,
          statut: true,
        },
      }),
      prisma.contract.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          nom: true,
          statut: true,
          dateEnvoi: true,
          signedAt: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          availabilityLink: {
            user: { clients: { some: { id: clientId } } },
          },
          email: (await prisma.client.findUnique({ where: { id: clientId }, select: { email: true } }))?.email || '',
        },
        orderBy: { dateDebut: 'desc' },
        take: 10,
        select: {
          id: true,
          dateDebut: true,
          dateFin: true,
          statut: true,
        },
      }),
    ]);

    return NextResponse.json({ invoices, quotes, contracts, bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
