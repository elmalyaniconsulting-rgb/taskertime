import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId } from '@/lib/api-helpers';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { formatDate } from '@/lib/utils';

interface Params {
  params: { id: string };
}

// GET /api/invoices/[id]/pdf
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: {
        client: true,
        lines: { orderBy: { ordre: 'asc' } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true, lastName: true, phone: true, email: true,
        siret: true, tvaIntracom: true,
        adresseRue: true, adresseCP: true, adresseVille: true,
        iban: true, bic: true, banque: true,
        mentionTvaExo: true, numeroNda: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const pdfBytes = await generateInvoicePDF({
      emetteur: {
        nom: `${user.firstName} ${user.lastName}`,
        siret: user.siret || undefined,
        tvaIntracom: user.tvaIntracom || undefined,
        adresse: [user.adresseRue, `${user.adresseCP || ''} ${user.adresseVille || ''}`].filter(Boolean).join(', '),
        email: user.email,
        phone: user.phone || undefined,
        iban: user.iban || undefined,
        bic: user.bic || undefined,
        banque: user.banque || undefined,
        mentionTvaExo: user.mentionTvaExo || undefined,
        numeroNda: user.numeroNda || undefined,
      },
      client: {
        nom: invoice.client.raisonSociale || `${invoice.client.prenom || ''} ${invoice.client.nom}`,
        siret: invoice.client.siret || undefined,
        adresse: [
          invoice.client.adresseRue,
          `${invoice.client.adresseCP || ''} ${invoice.client.adresseVille || ''}`,
        ].filter(Boolean).join(', '),
        email: invoice.client.email,
      },
      numero: invoice.numero,
      dateEmission: formatDate(invoice.dateEmission),
      dateEcheance: formatDate(invoice.dateEcheance),
      lines: invoice.lines.map((l) => ({
        description: l.description,
        quantite: Number(l.quantite),
        unite: l.unite,
        prixUnitaire: Number(l.prixUnitaire),
        tauxTva: Number(l.tauxTva),
        totalHT: Number(l.totalHT),
      })),
      totalHT: Number(invoice.totalHT),
      totalTVA: Number(invoice.totalTVA),
      totalTTC: Number(invoice.totalTTC),
      mentionsLegales: invoice.mentionsLegales || undefined,
      conditions: invoice.conditions || undefined,
    });

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.numero}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
