export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

// GET /api/integrations/google-calendar - Check sync status
export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        googleCalendarSync: true,
        googleCalendarId: true,
      },
    });

    return NextResponse.json({
      enabled: settings?.googleCalendarSync || false,
      calendarId: settings?.googleCalendarId || null,
      // TODO: Check if Google OAuth token is valid
      tokenValid: false,
      message: 'Google Calendar sync sera disponible dans la prochaine version. Configurez votre Google OAuth pour activer la synchronisation bidirectionnelle.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/google-calendar - Initialize OAuth flow
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action } = await req.json();

    if (action === 'connect') {
      // TODO: Generate Google OAuth URL
      // const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      // const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-calendar/callback`;
      // const scopes = 'https://www.googleapis.com/auth/calendar';
      // const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?...`;

      return NextResponse.json({
        status: 'pending',
        message: 'Google Calendar sync sera disponible avec la prochaine mise à jour. Les fonctionnalités prévues incluent : synchronisation bidirectionnelle des événements, création automatique dans Google Calendar lors d\'une réservation confirmée, et import des événements Google dans TaskerTime.',
      });
    }

    if (action === 'disconnect') {
      await prisma.userSettings.update({
        where: { userId },
        data: {
          googleCalendarSync: false,
          googleCalendarId: null,
          googleRefreshToken: null,
        },
      });

      return NextResponse.json({ status: 'disconnected' });
    }

    if (action === 'sync') {
      // TODO: Perform actual sync
      // 1. Fetch events from Google Calendar API
      // 2. Compare with local events
      // 3. Push local events to Google
      // 4. Pull Google events locally

      return NextResponse.json({
        status: 'pending',
        message: 'Synchronisation manuelle sera disponible après la connexion OAuth.',
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
