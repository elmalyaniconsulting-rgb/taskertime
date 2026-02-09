export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

// Middleware: check admin
async function checkAdmin() {
  const userId = await getAuthUserId();
  if (!userId) return { error: 'Non authentifié', status: 401 };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'admin') return { error: 'Accès réservé aux administrateurs', status: 403 };
  return { userId };
}

// GET /api/admin/users - List all users
export async function GET() {
  const auth = await checkAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        phone: true,
        siret: true,
        formeJuridique: true,
        activite: true,
        _count: {
          select: { clients: true, invoices: true, quotes: true, events: true },
        },
        subscription: {
          select: {
            statut: true,
            plan: { select: { slug: true, nom: true } },
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/users - Toggle admin role
export async function PATCH(req: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { userId } = await req.json();
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!targetUser) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });

    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    await prisma.user.update({ where: { id: userId }, data: { role: newRole } });

    return NextResponse.json({ success: true, role: newRole });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(req: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { userId } = await req.json();

    // Prevent self-deletion
    if (userId === auth.userId) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    // CASCADE will handle related records
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
