export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, invoiceReminderTemplate } from '@/lib/email';
import { checkFeatureAccess } from '@/lib/plans';

// Vercel Cron: runs daily at 8:00 AM Paris time
// Config in vercel.json: { "path": "/api/cron/relances", "schedule": "0 7 * * *" }

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const now = new Date();
  const results = { sent: 0, skipped: 0, errors: 0 };

  try {
    // Find all overdue invoices that haven't been fully paid
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        statut: { in: ['ENVOYEE', 'VUE', 'EN_RETARD', 'PARTIELLEMENT_PAYEE'] },
        dateEcheance: { lt: now },
        nombreRelances: { lt: 4 }, // Max 4 relances
      },
      include: {
        client: {
          select: { nom: true, prenom: true, email: true },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            stripeAccountId: true,
            stripeOnboarded: true,
            settings: {
              select: {
                relanceAuto: true,
                relanceJ1: true,
                relanceJ7: true,
                relanceJ15: true,
                relanceJ30: true,
              },
            },
          },
        },
      },
    });

    for (const invoice of overdueInvoices) {
      try {
        const settings = invoice.user.settings;
        
        // Skip if user disabled auto-relance
        if (!settings?.relanceAuto) {
          results.skipped++;
          continue;
        }

        // Check if user's plan allows relances auto
        const access = await checkFeatureAccess(invoice.user.id, 'relancesAuto');
        if (!access.allowed) {
          results.skipped++;
          continue;
        }

        const echeance = new Date(invoice.dateEcheance);
        const joursRetard = Math.floor((now.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24));
        const derniereRelance = invoice.derniereRelance ? new Date(invoice.derniereRelance) : null;
        const joursDepuisDerniereRelance = derniereRelance
          ? Math.floor((now.getTime() - derniereRelance.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        // Determine if we should send based on settings and timing
        let shouldSend = false;
        let relanceNum = invoice.nombreRelances + 1;

        if (relanceNum === 1 && joursRetard >= 1 && settings.relanceJ1) {
          shouldSend = true;
        } else if (relanceNum === 2 && joursRetard >= 7 && joursDepuisDerniereRelance >= 5 && settings.relanceJ7) {
          shouldSend = true;
        } else if (relanceNum === 3 && joursRetard >= 15 && joursDepuisDerniereRelance >= 7 && settings.relanceJ15) {
          shouldSend = true;
        } else if (relanceNum === 4 && joursRetard >= 30 && joursDepuisDerniereRelance >= 10 && settings.relanceJ30) {
          shouldSend = true;
        }

        if (!shouldSend) {
          results.skipped++;
          continue;
        }

        const clientName = invoice.client.prenom
          ? `${invoice.client.prenom} ${invoice.client.nom}`
          : invoice.client.nom;

        const senderName = `${invoice.user.firstName} ${invoice.user.lastName}`;
        const totalTTC = Number(invoice.totalTTC).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
        const resteAPayer = Number(invoice.resteAPayer).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
        const dateEcheance = echeance.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const emailResult = await sendEmail({
          to: invoice.client.email,
          subject: `${relanceNum >= 3 ? 'URGENT — ' : ''}Relance facture ${invoice.numero}`,
          html: invoiceReminderTemplate({
            clientName,
            invoiceNumber: invoice.numero,
            totalTTC,
            resteAPayer,
            dateEcheance,
            joursRetard,
            relanceNum,
            senderName,
          }),
        });

        if (emailResult.success) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              nombreRelances: relanceNum,
              derniereRelance: now,
              statut: 'EN_RETARD',
            },
          });

          // Create notification for the pro
          await prisma.notification.create({
            data: {
              userId: invoice.user.id,
              type: 'FACTURE_EN_RETARD',
              titre: `Relance n°${relanceNum} envoyée — ${invoice.numero}`,
              message: `Relance automatique envoyée à ${clientName} (${joursRetard}j de retard)`,
              entityType: 'invoice',
              entityId: invoice.id,
            },
          });

          results.sent++;
        } else {
          results.errors++;
        }
      } catch (err) {
        console.error(`Error processing invoice ${invoice.id}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
      total: overdueInvoices.length,
    });
  } catch (error: any) {
    console.error('Cron relances error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
