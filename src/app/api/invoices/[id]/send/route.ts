export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    const userName = `${invoice.user.firstName} ${invoice.user.lastName}`;
    const clientName = invoice.client.raisonSociale || `${invoice.client.prenom || ''} ${invoice.client.nom}`;
    const totalTTC = Number(invoice.totalTTC);
    const resteAPayer = Number(invoice.resteAPayer);
    const formattedTotal = totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const formattedReste = resteAPayer.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const baseUrl = process.env.NEXTAUTH_URL || 'https://taskertime.vercel.app';

    const emailSubject = `Facture ${invoice.numero} — ${userName}`;
    const emailBody = [
      `Bonjour ${clientName},`,
      '',
      `Veuillez trouver ci-joint la facture ${invoice.numero} d'un montant de ${formattedTotal}.`,
      resteAPayer < totalTTC ? `Reste à payer : ${formattedReste}` : '',
      '',
      customMessage ? customMessage + '\n' : '',
      `Date d'échéance : ${new Date(invoice.dateEcheance).toLocaleDateString('fr-FR')}`,
      '',
      `Vous pouvez consulter cette facture via le lien suivant :`,
      `${baseUrl}/api/invoices/${invoice.id}/pdf`,
      '',
      `Cordialement,`,
      userName,
    ].filter(Boolean).join('\n');

    // Update status to ENVOYEE
    if (invoice.statut === 'BROUILLON') {
      await prisma.invoice.update({
        where: { id: params.id },
        data: { statut: 'ENVOYEE' },
      });
    }

    // Return mailto fallback
    return NextResponse.json({
      fallback: 'mailto',
      to: invoice.client.email,
      subject: emailSubject,
      body: emailBody,
      pdfUrl: `${baseUrl}/api/invoices/${invoice.id}/pdf`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
