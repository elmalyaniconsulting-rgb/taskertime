export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { generateInvoiceNumber } from '@/lib/utils';

interface Params {
  params: { id: string };
}

// POST /api/quotes/[id]/convert - Convertir un devis en facture
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const quote = await prisma.quote.findFirst({
      where: { id: params.id, userId },
      include: { lines: true, client: true },
    });

    if (!quote) return notFound('Devis introuvable');
    if (quote.statut !== 'ACCEPTE') {
      return badRequest('Seuls les devis acceptés peuvent être convertis en facture');
    }
    if (quote.invoiceId) {
      return badRequest('Ce devis a déjà été converti en facture');
    }

    // Récupérer le user pour le numéro de facture
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { prefixeFacture: true, prochainNumFacture: true, mentionTvaExo: true },
    });
    if (!user) return unauthorized();

    const numero = generateInvoiceNumber(user.prefixeFacture, user.prochainNumFacture);
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + (quote.client.delaiPaiement || 30));

    // Créer la facture depuis le devis
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        clientId: quote.clientId,
        numero,
        dateEcheance,
        totalHT: quote.totalHT,
        totalTVA: quote.totalTVA,
        totalTTC: quote.totalTTC,
        resteAPayer: quote.totalTTC,
        statut: 'BROUILLON',
        mentionsLegales: user.mentionTvaExo,
        isChorusPro: quote.client.isChorusPro,
        conditions: quote.conditions,
        notes: quote.notes,
        lines: {
          create: quote.lines.map((line: any) => ({
            prestationId: line.prestationId,
            description: line.description,
            quantite: line.quantite,
            unite: line.unite,
            prixUnitaire: line.prixUnitaire,
            tauxTva: line.tauxTva,
            totalHT: line.totalHT,
            totalTVA: line.totalTVA,
            totalTTC: line.totalTTC,
            ordre: line.ordre,
          })),
        },
      },
      include: { client: true, lines: true },
    });

    // Mettre à jour le devis
    await prisma.quote.update({
      where: { id: params.id },
      data: { statut: 'CONVERTI', invoiceId: invoice.id },
    });

    // Incrémenter le compteur
    await prisma.user.update({
      where: { id: userId },
      data: { prochainNumFacture: { increment: 1 } },
    });

    return success(invoice, 201);
  } catch (error) {
    return serverError(error);
  }
}
