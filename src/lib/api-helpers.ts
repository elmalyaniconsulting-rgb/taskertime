import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message: string = 'Ressource introuvable') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(error: unknown) {
  console.error('Erreur serveur:', error);
  return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
}

export function success(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}
