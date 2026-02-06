export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, appointmentReminderTemplate } from '@/lib/email';

// Vercel Cron: runs every hour
// Config in vercel.json: { "path": "/api/cron/rappels-rdv", "schedule": "0 * * * *" }

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const now = new Date();
  const results = { sent24h: 0, sent1h: 0, errors: 0 };

  try {
    // ================================================================
    // RAPPELS J-1 (24h avant)
    // ================================================================
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    const bookings24h = await prisma.booking.findMany({
      where: {
        statut: 'CONFIRME',
        dateDebut: { gte: tomorrowStart, lte: tomorrowEnd },
        reminderSent24h: { not: true },
      },
      include: {
        availabilityLink: {
          select: {
            nom: true,
            dureeMinutes: true,
            disponibilites: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                settings: { select: { rappelRdv24h: true } },
              },
            },
          },
        },
      },
    });

    for (const booking of bookings24h) {
      try {
        const settings = booking.availabilityLink.user.settings;
        if (!settings?.rappelRdv24h) continue;

        const proName = `${booking.availabilityLink.user.firstName} ${booking.availabilityLink.user.lastName}`;
        const disponibilites = booking.availabilityLink.disponibilites as any;
        const dt = new Date(booking.dateDebut);
        const dateStr = dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        const emailResult = await sendEmail({
          to: booking.email,
          subject: `Rappel — Votre RDV demain avec ${proName}`,
          html: appointmentReminderTemplate({
            clientName: `${booking.prenom} ${booking.nom}`,
            proName,
            eventTitle: booking.availabilityLink.nom,
            dateTime: dateStr,
            duration: `${booking.availabilityLink.dureeMinutes} min`,
            location: disponibilites?.lieu,
            timeframe: '24h',
          }),
        });

        if (emailResult.success) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent24h: true },
          });
          results.sent24h++;
        }
      } catch (err) {
        console.error(`Error sending 24h reminder for booking ${booking.id}:`, err);
        results.errors++;
      }
    }

    // ================================================================
    // RAPPELS H-1 (1h avant)
    // ================================================================
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const bookings1h = await prisma.booking.findMany({
      where: {
        statut: 'CONFIRME',
        dateDebut: { gte: in1h, lte: in2h },
        reminderSent1h: { not: true },
      },
      include: {
        availabilityLink: {
          select: {
            nom: true,
            dureeMinutes: true,
            disponibilites: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                settings: { select: { rappelRdv1h: true } },
              },
            },
          },
        },
      },
    });

    for (const booking of bookings1h) {
      try {
        const settings = booking.availabilityLink.user.settings;
        if (!settings?.rappelRdv1h) continue;

        const proName = `${booking.availabilityLink.user.firstName} ${booking.availabilityLink.user.lastName}`;
        const disponibilites = booking.availabilityLink.disponibilites as any;
        const dt = new Date(booking.dateDebut);
        const dateStr = dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        const emailResult = await sendEmail({
          to: booking.email,
          subject: `Rappel — Votre RDV dans 1h avec ${proName}`,
          html: appointmentReminderTemplate({
            clientName: `${booking.prenom} ${booking.nom}`,
            proName,
            eventTitle: booking.availabilityLink.nom,
            dateTime: dateStr,
            duration: `${booking.availabilityLink.dureeMinutes} min`,
            location: disponibilites?.lieu,
            timeframe: '1h',
          }),
        });

        if (emailResult.success) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent1h: true },
          });
          results.sent1h++;
        }
      } catch (err) {
        console.error(`Error sending 1h reminder for booking ${booking.id}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error: any) {
    console.error('Cron rappels-rdv error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
