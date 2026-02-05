export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  activite: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    let data;
    try {
      data = registerSchema.parse(body);
    } catch (zodErr) {
      if (zodErr instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Données invalides', details: zodErr.errors },
          { status: 400 }
        );
      }
      throw zodErr;
    }

    // Vérifier si l'email existe déjà
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
    } catch (dbErr: any) {
      return NextResponse.json(
        { error: 'Erreur DB findUnique', detail: dbErr.message },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Créer l'utilisateur
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          activite: data.activite || null,
          mentionTvaExo: 'TVA non applicable, art. 293 B du CGI',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });
    } catch (createErr: any) {
      return NextResponse.json(
        { error: 'Erreur DB create user', detail: createErr.message },
        { status: 500 }
      );
    }

    // Créer les paramètres par défaut (non bloquant)
    try {
      await prisma.userSettings.create({
        data: {
          userId: user.id,
        },
      });
    } catch (settingsErr: any) {
      console.error('Settings creation error:', settingsErr.message);
    }

    return NextResponse.json(
      { message: 'Compte créé avec succès', user },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur interne', detail: error.message },
      { status: 500 }
    );
  }
}
