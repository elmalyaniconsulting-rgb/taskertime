export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail, invoiceEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const customMessage = body.message || '';

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    if (!invoice.client.email) {
      return NextResponse.json({ error: "Le client n'a pas d'adresse email" }, { status: 400 });
    }

    const senderName = `${invoice.user.firstName} ${invoice.user.lastName}`;
    const clientName = invoice.client.raisonSociale || `${invoice.client.prenom || ''} ${invoice.client.nom}`.trim();
    const totalTTC = Number(invoice.totalTTC).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const resteAPayer = Number(invoice.resteAPayer);
    const resteAPayerFormatted = resteAPayer < Number(invoice.totalTTC) 
      ? resteAPayer.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
      : undefined;
    const dateEcheance = new Date(invoice.dateEcheance).toLocaleDateString('fr-FR');
    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';
    const pdfUrl = `${baseUrl}/api/invoices/${invoice.id}/pdf`;

    // Generate email HTML
    const html = invoiceEmailTemplate({
      clientName,
      invoiceNumber: invoice.numero,
      totalTTC,
      resteAPayer: resteAPayerFormatted,
      dateEcheance,
      pdfUrl,
      senderName,
      customMessage,
    });

    // Try to send via Resend
    const result = await sendEmail({
      to: invoice.client.email,
      subject: `Facture ${invoice.numero} — ${senderName}`,
      html,
    });

    // Update status to ENVOYEE
    if (invoice.statut === 'BROUILLON') {
      await prisma.invoice.update({
        where: { id: params.id },
        data: { statut: 'ENVOYEE' },
      });
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Facture envoyée par email',
        messageId: result.messageId,
      });
    } else if (result.fallback) {
      // Fallback to mailto if Resend not configured
      const emailSubject = encodeURIComponent(`Facture ${invoice.numero} — ${senderName}`);
      const emailBody = encodeURIComponent(
        `Bonjour ${clientName},\n\nVeuillez trouver ci-joint la facture ${invoice.numero} d'un montant de ${totalTTC}.\n\n` +
        `Date d'échéance : ${dateEcheance}\n\n` +
        `Lien vers la facture : ${pdfUrl}\n\n` +
        (customMessage ? `${customMessage}\n\n` : '') +
        `Cordialement,\n${senderName}`
      );

      return NextResponse.json({
        success: true,
        fallback: 'mailto',
        mailtoUrl: `mailto:${invoice.client.email}?subject=${emailSubject}&body=${emailBody}`,
        to: invoice.client.email,
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
    console.error('Invoice send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
