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

// GET /api/quotes/[id]/pdf
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        lines: { include: { prestation: true }, orderBy: { ordre: 'asc' } },
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

    if (!quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    const user = quote.user;
    const client = quote.client;
    const clientName = client.raisonSociale || `${client.prenom || ''} ${client.nom}`;
    const userName = `${user.firstName} ${user.lastName}`;
    const hasTva = Number(quote.totalTVA) > 0;

    const linesHtml = quote.lines.map((line: any) => `
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
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .doc-title { font-size: 28px; font-weight: 700; color: #3b82f6; margin-bottom: 4px; }
    .doc-number { font-size: 16px; color: #666; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e2e8f0; }
    .totals { margin-left: auto; width: 280px; margin-top: 20px; }
    .totals td { padding: 6px 8px; font-size: 14px; }
    .total-ttc { font-size: 18px; font-weight: 700; border-top: 2px solid #1a1a1a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #888; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="doc-title">DEVIS</div>
      <div class="doc-number">${escapeHtml(quote.numero)}</div>
      <div style="margin-top:16px;font-size:13px;color:#666;">
        Date : ${formatDate(quote.dateEmission)}<br>
        Valide jusqu'au : ${formatDate(quote.dateValidite)}
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
    <div style="font-size:12px;text-transform:uppercase;color:#888;margin-bottom:4px;">Client</div>
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
      <td style="text-align:right;font-weight:600;">${formatCurrency(Number(quote.totalHT))}</td>
    </tr>
    ${hasTva ? `
    <tr>
      <td>TVA</td>
      <td style="text-align:right;">${formatCurrency(Number(quote.totalTVA))}</td>
    </tr>
    ` : ''}
    <tr class="total-ttc">
      <td>Total TTC</td>
      <td style="text-align:right;">${formatCurrency(Number(quote.totalTTC))}</td>
    </tr>
    ${quote.acompteRequis && quote.acompteMontant ? `
    <tr>
      <td style="color:#3b82f6;">Acompte (${Number(quote.acomptePourcent)}%)</td>
      <td style="text-align:right;color:#3b82f6;font-weight:600;">${formatCurrency(Number(quote.acompteMontant))}</td>
    </tr>
    ` : ''}
  </table>

  ${quote.conditions ? `
  <div style="margin-top:30px;">
    <div style="font-weight:600;font-size:13px;margin-bottom:4px;">Conditions</div>
    <div style="font-size:12px;color:#666;white-space:pre-wrap;">${escapeHtml(quote.conditions)}</div>
  </div>
  ` : ''}

  <div class="footer">
    ${escapeHtml(userName)}${user.formeJuridique ? ` — ${escapeHtml(user.formeJuridique)}` : ''}
    ${user.siret ? ` — SIRET ${escapeHtml(user.siret)}` : ''}
    ${!user.tvaApplicable && user.mentionTvaExo ? `<br>${escapeHtml(user.mentionTvaExo)}` : ''}
    ${user.iban ? `<br>IBAN : ${escapeHtml(user.iban)}${user.bic ? ` — BIC : ${escapeHtml(user.bic)}` : ''}` : ''}
  </div>

  <div style="text-align:center;margin-top:30px;padding:16px;background:#f0f9ff;border-radius:8px;">
    <div style="font-size:13px;color:#666;">Bon pour accord — Date et signature du client :</div>
    <div style="height:60px;"></div>
  </div>
</body>
</html>`;

    // Return HTML that the browser can print as PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
