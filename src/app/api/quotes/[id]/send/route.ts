export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/quotes/[id]/send
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

    const userName = `${quote.user.firstName} ${quote.user.lastName}`;
    const clientName = quote.client.raisonSociale || `${quote.client.prenom || ''} ${quote.client.nom}`;
    const totalTTC = Number(quote.totalTTC);
    const formattedTotal = totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';

    const emailSubject = `Devis ${quote.numero} — ${userName}`;
    const emailBody = [
      `Bonjour ${clientName},`,
      '',
      `Veuillez trouver ci-joint le devis ${quote.numero} d'un montant de ${formattedTotal}.`,
      '',
      customMessage ? customMessage + '\n' : '',
      `Vous pouvez consulter ce devis via le lien suivant :`,
      `${baseUrl}/api/quotes/${quote.id}/pdf`,
      '',
      `Cordialement,`,
      userName,
    ].filter(Boolean).join('\n');

    // Try Resend if configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey !== '' && resendKey !== 'placeholder') {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${userName} <onboarding@resend.dev>`,
            reply_to: quote.user.email,
            to: [quote.client.email],
            subject: emailSubject,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:#3b82f6;">Devis ${quote.numero}</h2>
                <p>Bonjour ${clientName},</p>
                <p>Veuillez trouver votre devis d'un montant de <strong>${formattedTotal}</strong>.</p>
                ${customMessage ? `<p>${customMessage}</p>` : ''}
                <div style="margin:20px 0;padding:16px;background:#f8fafc;border-radius:8px;">
                  <p style="margin:0;"><strong>Numéro :</strong> ${quote.numero}</p>
                  <p style="margin:4px 0 0;"><strong>Montant TTC :</strong> ${formattedTotal}</p>
                  <p style="margin:4px 0 0;"><strong>Valide jusqu'au :</strong> ${new Date(quote.dateValidite).toLocaleDateString('fr-FR')}</p>
                </div>
                <a href="${baseUrl}/api/quotes/${quote.id}/pdf" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;margin-top:10px;">Voir le devis</a>
                <p style="margin-top:20px;">Cordialement,<br>${userName}</p>
              </div>
            `,
          }),
        });

        if (res.ok) {
          // Update status to ENVOYE
          await prisma.quote.update({
            where: { id: params.id },
            data: { statut: 'ENVOYE' },
          });
          return NextResponse.json({ message: 'Email envoyé avec succès' });
        }
        
        // Resend failed, fall through to mailto
      } catch {
        // Resend error, fall through to mailto
      }
    }

    // Fallback: mailto (always works)
    // Update status to ENVOYE anyway
    await prisma.quote.update({
      where: { id: params.id },
      data: { statut: 'ENVOYE' },
    });

    return NextResponse.json({
      fallback: 'mailto',
      to: quote.client.email,
      subject: emailSubject,
      body: emailBody,
      pdfUrl: `${baseUrl}/api/quotes/${quote.id}/pdf`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
