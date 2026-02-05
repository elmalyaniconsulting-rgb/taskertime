export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  activite: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  siren: z.string().optional().nullable(),
  tvaIntracom: z.string().optional().nullable(),
  rcs: z.string().optional().nullable(),
  capitalSocial: z.number().optional().nullable(),
  formeJuridique: z.string().optional().nullable(),
  adresseRue: z.string().optional().nullable(),
  adresseCP: z.string().optional().nullable(),
  adresseVille: z.string().optional().nullable(),
  tauxHoraireDefaut: z.number().optional(),
  tvaApplicable: z.boolean().optional(),
  tauxTva: z.number().optional(),
  mentionTvaExo: z.string().optional().nullable(),
  prefixeFacture: z.string().optional(),
  prefixeDevis: z.string().optional(),
  iban: z.string().optional().nullable(),
  bic: z.string().optional().nullable(),
  banque: z.string().optional().nullable(),
  numeroNda: z.string().optional().nullable(),
  certifQualiopi: z.boolean().optional(),
});

// GET /api/settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true, lastName: true, email: true, phone: true, activite: true,
        siret: true, siren: true, tvaIntracom: true, rcs: true,
        capitalSocial: true, formeJuridique: true,
        adresseRue: true, adresseCP: true, adresseVille: true, adressePays: true,
        tauxHoraireDefaut: true, tvaApplicable: true, tauxTva: true, mentionTvaExo: true,
        prefixeFacture: true, prefixeDevis: true,
        iban: true, bic: true, banque: true,
        numeroNda: true, certifQualiopi: true, dateQualiopi: true,
        stripeAccountId: true, stripeOnboarded: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Convert Decimal to number for JSON
    return NextResponse.json({
      ...user,
      capitalSocial: user.capitalSocial ? Number(user.capitalSocial) : null,
      tauxHoraireDefaut: Number(user.tauxHoraireDefaut),
      tauxTva: Number(user.tauxTva),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const data = settingsSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...data,
        capitalSocial: data.capitalSocial !== undefined ? data.capitalSocial : undefined,
        tauxHoraireDefaut: data.tauxHoraireDefaut !== undefined ? data.tauxHoraireDefaut : undefined,
        tauxTva: data.tauxTva !== undefined ? data.tauxTva : undefined,
      },
    });

    return NextResponse.json({ message: 'Paramètres sauvegardés' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
