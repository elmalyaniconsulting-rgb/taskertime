export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserId, unauthorized, notFound, badRequest, serverError, success } from '@/lib/api-helpers';
import { z } from 'zod';

const paymentSchema = z.object({
  montant: z.number().min(0.01, 'Montant minimum 0,01 €'),
  mode: z.enum(['VIREMENT', 'CHEQUE', 'CB', 'ESPECES', 'PRELEVEMENT', 'STRIPE']),
  reference: z.string().optional().nullable(),
  datePaiement: z.string().transform((s) => new Date(s)),
  notes: z.string().optional().nullable(),
});

interface Params {
  params: { id: string };
}

// GET /api/invoices/[id]/payments
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
    });
    if (!invoice) return notFound('Facture introuvable');

    const payments = await prisma.payment.findMany({
      where: { invoiceId: params.id },
      orderBy: { datePaiement: 'desc' },
    });

    return success(payments);
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/invoices/[id]/payments - Enregistrer un paiement
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
    });
    if (!invoice) return notFound('Facture introuvable');

    if (['PAYEE', 'ANNULEE', 'AVOIR'].includes(invoice.statut)) {
      return badRequest('Impossible d\'ajouter un paiement à cette facture');
    }

    const body = await request.json();
    const data = paymentSchema.parse(body);

    const resteAPayer = Number(invoice.resteAPayer);
    if (data.montant > resteAPayer) {
      return badRequest(`Le montant dépasse le reste à payer (${resteAPayer.toFixed(2)} €)`);
    }

    // Créer le paiement
    const payment = await prisma.payment.create({
      data: {
        invoiceId: params.id,
        montant: data.montant,
        mode: data.mode,
        reference: data.reference,
        datePaiement: data.datePaiement,
        notes: data.notes,
      },
    });

    // Mettre à jour la facture
    const newMontantPaye = Number(invoice.montantPaye) + data.montant;
    const newResteAPayer = Number(invoice.totalTTC) - newMontantPaye;
    const newStatut = newResteAPayer <= 0 ? 'PAYEE' : 'PARTIELLEMENT_PAYEE';

    await prisma.invoice.update({
      where: { id: params.id },
      data: {
        montantPaye: newMontantPaye,
        resteAPayer: Math.max(0, newResteAPayer),
        statut: newStatut,
      },
    });

    return success(payment, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest('Données invalides', error.errors);
    return serverError(error);
  }
}
