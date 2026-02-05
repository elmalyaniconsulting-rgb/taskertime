export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail, quoteEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const customMessage = body.message || '';

    const quote = await prisma.quote.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    if (!quote.client.email) {
      return NextResponse.json({ error: "Le client n'a pas d'adresse email" }, { status: 400 });
    }

    const senderName = `${quote.user.firstName} ${quote.user.lastName}`;
    const clientName = quote.client.raisonSociale || `${quote.client.prenom || ''} ${quote.client.nom}`.trim();
    const totalTTC = Number(quote.totalTTC).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const validiteDate = new Date(quote.dateValidite).toLocaleDateString('fr-FR');
    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';
    const pdfUrl = `${baseUrl}/api/quotes/${quote.id}/pdf`;

    // Generate email HTML
    const html = quoteEmailTemplate({
      clientName,
      quoteNumber: quote.numero,
      totalTTC,
      validiteDate,
      pdfUrl,
      senderName,
      customMessage,
    });

    // Try to send via Resend
    const result = await sendEmail({
      to: quote.client.email,
      subject: `Devis ${quote.numero} — ${senderName}`,
      html,
    });

    // Update status to ENVOYE
    if (quote.statut === 'BROUILLON') {
      await prisma.quote.update({
        where: { id: params.id },
        data: { statut: 'ENVOYE' },
      });
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Devis envoyé par email',
        messageId: result.messageId,
      });
    } else if (result.fallback) {
      // Fallback to mailto if Resend not configured
      const emailSubject = encodeURIComponent(`Devis ${quote.numero} — ${senderName}`);
      const emailBody = encodeURIComponent(
        `Bonjour ${clientName},\n\nVeuillez trouver ci-joint notre proposition commerciale.\n\n` +
        `Devis n° ${quote.numero}\n` +
        `Montant TTC : ${totalTTC}\n` +
        `Valide jusqu'au : ${validiteDate}\n\n` +
        `Lien vers le devis : ${pdfUrl}\n\n` +
        (customMessage ? `${customMessage}\n\n` : '') +
        `Cordialement,\n${senderName}`
      );

      return NextResponse.json({
        success: true,
        fallback: 'mailto',
        mailtoUrl: `mailto:${quote.client.email}?subject=${emailSubject}&body=${emailBody}`,
        to: quote.client.email,
        pdfUrl,
        message: 'Email non configuré. Utilisez le lien mailto.',
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || "Échec de l'envoi",
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Quote send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
