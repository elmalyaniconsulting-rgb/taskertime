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
      return NextResponse.json({ error: 'Le client n\'a pas d\'adresse email' }, { status: 400 });
    }

    const userName = `${quote.user.firstName} ${quote.user.lastName}`;
    const clientName = quote.client.raisonSociale || `${quote.client.prenom || ''} ${quote.client.nom}`;
    const totalTTC = Number(quote.totalTTC);

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      // Fallback: open mailto link (return the data for client-side mailto)
      return NextResponse.json({
        fallback: 'mailto',
        to: quote.client.email,
        subject: `Devis ${quote.numero} — ${userName}`,
        body: `Bonjour ${clientName},\n\nVeuillez trouver ci-joint le devis ${quote.numero} d'un montant de ${totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}.\n\n${customMessage ? customMessage + '\n\n' : ''}Vous pouvez consulter ce devis en ligne via le lien suivant :\n${process.env.NEXTAUTH_URL}/quotes/${quote.id}/view\n\nCordialement,\n${userName}`,
      });
    }

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${userName} <noreply@taskertime.app>`,
        reply_to: quote.user.email,
        to: [quote.client.email],
        subject: `Devis ${quote.numero} — ${userName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#3b82f6;">Devis ${quote.numero}</h2>
            <p>Bonjour ${clientName},</p>
            <p>Veuillez trouver ci-dessous votre devis d'un montant de <strong>${totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>.</p>
            ${customMessage ? `<p>${customMessage}</p>` : ''}
            <div style="margin:20px 0;padding:16px;background:#f8fafc;border-radius:8px;">
              <p style="margin:0;"><strong>Numéro :</strong> ${quote.numero}</p>
              <p style="margin:4px 0 0;"><strong>Montant TTC :</strong> ${totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              <p style="margin:4px 0 0;"><strong>Valide jusqu'au :</strong> ${new Date(quote.dateValidite).toLocaleDateString('fr-FR')}</p>
            </div>
            <p>Cordialement,<br>${userName}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: 'Erreur envoi email', detail: err }, { status: 500 });
    }

    // Update quote status to ENVOYE
    await prisma.quote.update({
      where: { id: params.id },
      data: { statut: 'ENVOYE' },
    });

    return NextResponse.json({ message: 'Email envoyé avec succès' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
