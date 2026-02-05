export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        lines: { include: { prestation: true }, orderBy: { ordre: 'asc' } },
        payments: { orderBy: { datePaiement: 'desc' } },
        user: {
          select: {
            firstName: true, lastName: true, email: true, phone: true,
            siret: true, siren: true, tvaIntracom: true, rcs: true,
            formeJuridique: true, capitalSocial: true,
            adresseRue: true, adresseCP: true, adresseVille: true,
            tvaApplicable: true, mentionTvaExo: true,
            iban: true, bic: true, banque: true, activite: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    const user = invoice.user;
    const client = invoice.client;
    const clientName = client.raisonSociale || `${client.prenom || ''} ${client.nom}`;
    const userName = `${user.firstName} ${user.lastName}`;
    const hasTva = Number(invoice.totalTVA) > 0;
    const isPaid = invoice.statut === 'PAYEE';
    const isOverdue = !['PAYEE', 'ANNULEE', 'AVOIR'].includes(invoice.statut) && new Date(invoice.dateEcheance) < new Date();

    const linesHtml = invoice.lines.map((line: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${escapeHtml(line.description)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${Number(line.quantite)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${line.unite}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${formatCurrency(Number(line.prixUnitaire))}</td>
        ${hasTva ? `<td style="padding:8px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${Number(line.tauxTva)}%</td>` : ''}
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:600;">${formatCurrency(Number(line.totalHT))}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; line-height: 1.5; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e2e8f0; }
    .totals { margin-left: auto; width: 280px; margin-top: 20px; }
    .totals td { padding: 6px 8px; font-size: 14px; }
    .total-ttc { font-size: 18px; font-weight: 700; border-top: 2px solid #1a1a1a; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;margin-bottom:40px;">
    <div>
      <div style="font-size:28px;font-weight:700;color:#3b82f6;">FACTURE</div>
      <div style="font-size:16px;color:#666;">${escapeHtml(invoice.numero)}</div>
      ${isPaid ? '<div style="display:inline-block;margin-top:8px;padding:4px 12px;background:#22c55e;color:white;border-radius:4px;font-size:12px;font-weight:600;">PAYÉE</div>' : ''}
      ${isOverdue ? '<div style="display:inline-block;margin-top:8px;padding:4px 12px;background:#ef4444;color:white;border-radius:4px;font-size:12px;font-weight:600;">EN RETARD</div>' : ''}
      <div style="margin-top:16px;font-size:13px;color:#666;">
        Date d'émission : ${formatDate(invoice.dateEmission)}<br>
        Date d'échéance : ${formatDate(invoice.dateEcheance)}
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-weight:600;">${escapeHtml(userName)}</div>
      ${user.activite ? `<div style="font-size:13px;color:#666;">${escapeHtml(user.activite)}</div>` : ''}
      ${user.adresseRue ? `<div style="font-size:13px;">${escapeHtml(user.adresseRue)}</div>` : ''}
      ${user.adresseCP || user.adresseVille ? `<div style="font-size:13px;">${escapeHtml((user.adresseCP || '') + ' ' + (user.adresseVille || ''))}</div>` : ''}
      ${user.siret ? `<div style="font-size:12px;color:#888;margin-top:4px;">SIRET : ${escapeHtml(user.siret)}</div>` : ''}
      ${user.tvaIntracom ? `<div style="font-size:12px;color:#888;">TVA : ${escapeHtml(user.tvaIntracom)}</div>` : ''}
    </div>
  </div>

  <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:30px;">
    <div style="font-size:12px;text-transform:uppercase;color:#888;margin-bottom:4px;">Facturé à</div>
    <div style="font-weight:600;">${escapeHtml(clientName)}</div>
    ${client.adresseRue ? `<div style="font-size:13px;">${escapeHtml(client.adresseRue)}</div>` : ''}
    ${client.adresseCP || client.adresseVille ? `<div style="font-size:13px;">${escapeHtml((client.adresseCP || '') + ' ' + (client.adresseVille || ''))}</div>` : ''}
    <div style="font-size:13px;color:#666;">${escapeHtml(client.email)}</div>
    ${client.siret ? `<div style="font-size:12px;color:#888;">SIRET : ${escapeHtml(client.siret)}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40%;">Description</th>
        <th style="text-align:center;">Qté</th>
        <th style="text-align:center;">Unité</th>
        <th style="text-align:right;">PU HT</th>
        ${hasTva ? '<th style="text-align:center;">TVA</th>' : ''}
        <th style="text-align:right;">Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${linesHtml}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td>Total HT</td>
      <td style="text-align:right;font-weight:600;">${formatCurrency(Number(invoice.totalHT))}</td>
    </tr>
    ${hasTva ? `
    <tr>
      <td>TVA</td>
      <td style="text-align:right;">${formatCurrency(Number(invoice.totalTVA))}</td>
    </tr>
    ` : ''}
    <tr class="total-ttc">
      <td>Total TTC</td>
      <td style="text-align:right;">${formatCurrency(Number(invoice.totalTTC))}</td>
    </tr>
    ${Number(invoice.montantPaye) > 0 ? `
    <tr>
      <td>Déjà payé</td>
      <td style="text-align:right;color:#22c55e;">- ${formatCurrency(Number(invoice.montantPaye))}</td>
    </tr>
    <tr>
      <td style="font-weight:600;">Reste à payer</td>
      <td style="text-align:right;font-weight:600;color:#ef4444;">${formatCurrency(Number(invoice.resteAPayer))}</td>
    </tr>
    ` : ''}
  </table>

  ${user.iban ? `
  <div style="margin-top:30px;padding:16px;background:#f0f9ff;border-radius:8px;">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Coordonnées bancaires</div>
    <div style="font-size:13px;">IBAN : ${escapeHtml(user.iban)}</div>
    ${user.bic ? `<div style="font-size:13px;">BIC : ${escapeHtml(user.bic)}</div>` : ''}
    ${user.banque ? `<div style="font-size:13px;">Banque : ${escapeHtml(user.banque)}</div>` : ''}
  </div>
  ` : ''}

  <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#888;">
    ${escapeHtml(userName)}${user.formeJuridique ? ` — ${escapeHtml(user.formeJuridique)}` : ''}
    ${user.siret ? ` — SIRET ${escapeHtml(user.siret)}` : ''}
    ${!user.tvaApplicable && user.mentionTvaExo ? `<br>${escapeHtml(user.mentionTvaExo)}` : ''}
    ${invoice.conditions ? `<br><br>${escapeHtml(invoice.conditions)}` : ''}
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
