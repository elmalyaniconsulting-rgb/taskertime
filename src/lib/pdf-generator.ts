import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface InvoicePDFData {
  // Emetteur
  emetteur: {
    nom: string;
    siret?: string;
    tvaIntracom?: string;
    adresse: string;
    email: string;
    phone?: string;
    iban?: string;
    bic?: string;
    banque?: string;
    mentionTvaExo?: string;
    numeroNda?: string;
  };
  // Client
  client: {
    nom: string;
    siret?: string;
    adresse: string;
    email: string;
  };
  // Facture
  numero: string;
  dateEmission: string;
  dateEcheance: string;
  // Lignes
  lines: {
    description: string;
    quantite: number;
    unite: string;
    prixUnitaire: number;
    tauxTva: number;
    totalHT: number;
  }[];
  // Totaux
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  mentionsLegales?: string;
  conditions?: string;
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const primary = rgb(0.23, 0.51, 0.96);
  const lightGray = rgb(0.95, 0.95, 0.95);

  // Helper
  const drawText = (text: string, x: number, yPos: number, options?: { size?: number; font?: any; color?: any }) => {
    page.drawText(text, {
      x,
      y: yPos,
      size: options?.size || 10,
      font: options?.font || font,
      color: options?.color || black,
    });
  };

  // ─── HEADER ───
  drawText('FACTURE', margin, y, { size: 24, font: fontBold, color: primary });
  drawText(data.numero, margin, y - 28, { size: 14, font: fontBold });
  y -= 60;

  // ─── EMETTEUR (gauche) & CLIENT (droite) ───
  const colLeft = margin;
  const colRight = width / 2 + 20;

  drawText('Émetteur', colLeft, y, { size: 8, color: gray });
  y -= 14;
  drawText(data.emetteur.nom, colLeft, y, { size: 10, font: fontBold });
  y -= 14;
  if (data.emetteur.adresse) { drawText(data.emetteur.adresse, colLeft, y, { size: 9, color: gray }); y -= 12; }
  if (data.emetteur.email) { drawText(data.emetteur.email, colLeft, y, { size: 9, color: gray }); y -= 12; }
  if (data.emetteur.phone) { drawText(`Tél: ${data.emetteur.phone}`, colLeft, y, { size: 9, color: gray }); y -= 12; }
  if (data.emetteur.siret) { drawText(`SIRET: ${data.emetteur.siret}`, colLeft, y, { size: 8, color: gray }); y -= 12; }
  if (data.emetteur.tvaIntracom) { drawText(`TVA: ${data.emetteur.tvaIntracom}`, colLeft, y, { size: 8, color: gray }); y -= 12; }
  if (data.emetteur.numeroNda) { drawText(`NDA: ${data.emetteur.numeroNda}`, colLeft, y, { size: 8, color: gray }); y -= 12; }

  let yClient = height - margin - 60;
  drawText('Client', colRight, yClient, { size: 8, color: gray });
  yClient -= 14;
  drawText(data.client.nom, colRight, yClient, { size: 10, font: fontBold });
  yClient -= 14;
  if (data.client.adresse) { drawText(data.client.adresse, colRight, yClient, { size: 9, color: gray }); yClient -= 12; }
  if (data.client.email) { drawText(data.client.email, colRight, yClient, { size: 9, color: gray }); yClient -= 12; }
  if (data.client.siret) { drawText(`SIRET: ${data.client.siret}`, colRight, yClient, { size: 8, color: gray }); yClient -= 12; }

  // ─── DATES ───
  y = Math.min(y, yClient) - 20;
  drawText(`Date d'émission : ${data.dateEmission}`, colLeft, y, { size: 9 });
  drawText(`Date d'échéance : ${data.dateEcheance}`, colRight, y, { size: 9 });
  y -= 25;

  // ─── LINE separator ───
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: gray });
  y -= 20;

  // ─── TABLE HEADER ───
  const cols = [margin, margin + 220, margin + 270, margin + 330, margin + 400, margin + 460];
  const colWidths = ['Description', 'Qté', 'Unité', 'PU HT', 'TVA', 'Total HT'];

  page.drawRectangle({
    x: margin - 5,
    y: y - 4,
    width: width - 2 * margin + 10,
    height: 18,
    color: lightGray,
  });

  colWidths.forEach((label, i) => {
    drawText(label, cols[i], y, { size: 8, font: fontBold, color: gray });
  });
  y -= 20;

  // ─── TABLE ROWS ───
  data.lines.forEach((line) => {
    if (y < 100) return; // Prevent overflow (simplified)

    // Truncate description if too long
    const desc = line.description.length > 40 ? line.description.substring(0, 40) + '...' : line.description;
    drawText(desc, cols[0], y, { size: 9 });
    drawText(String(line.quantite), cols[1], y, { size: 9 });
    drawText(line.unite, cols[2], y, { size: 9 });
    drawText(`${line.prixUnitaire.toFixed(2)} €`, cols[3], y, { size: 9 });
    drawText(`${line.tauxTva}%`, cols[4], y, { size: 9 });
    drawText(`${line.totalHT.toFixed(2)} €`, cols[5], y, { size: 9, font: fontBold });
    y -= 18;
  });

  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: gray });
  y -= 20;

  // ─── TOTALS ───
  const totX = width - margin - 150;
  drawText('Total HT', totX, y, { size: 10 });
  drawText(`${data.totalHT.toFixed(2)} €`, totX + 100, y, { size: 10, font: fontBold });
  y -= 16;

  if (data.totalTVA > 0) {
    drawText('TVA', totX, y, { size: 10 });
    drawText(`${data.totalTVA.toFixed(2)} €`, totX + 100, y, { size: 10 });
    y -= 16;
  }

  page.drawLine({ start: { x: totX, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 1, color: primary });
  y -= 4;
  drawText('Total TTC', totX, y, { size: 12, font: fontBold });
  drawText(`${data.totalTTC.toFixed(2)} €`, totX + 100, y, { size: 12, font: fontBold, color: primary });
  y -= 30;

  // ─── BANK DETAILS ───
  if (data.emetteur.iban) {
    drawText('Coordonnées bancaires', margin, y, { size: 8, font: fontBold, color: gray });
    y -= 12;
    drawText(`IBAN: ${data.emetteur.iban}`, margin, y, { size: 8, color: gray });
    y -= 10;
    if (data.emetteur.bic) { drawText(`BIC: ${data.emetteur.bic}`, margin, y, { size: 8, color: gray }); y -= 10; }
    if (data.emetteur.banque) { drawText(`Banque: ${data.emetteur.banque}`, margin, y, { size: 8, color: gray }); y -= 10; }
    y -= 10;
  }

  // ─── MENTIONS ───
  if (data.mentionsLegales) {
    const mention = data.mentionsLegales.length > 120 ? data.mentionsLegales.substring(0, 120) + '...' : data.mentionsLegales;
    drawText(mention, margin, y, { size: 7, color: gray });
    y -= 10;
  }
  if (data.conditions) {
    const cond = data.conditions.length > 120 ? data.conditions.substring(0, 120) + '...' : data.conditions;
    drawText(cond, margin, y, { size: 7, color: gray });
  }

  // ─── FOOTER ───
  drawText(
    `${data.emetteur.nom} — Document généré par TaskerTime`,
    margin,
    30,
    { size: 7, color: gray }
  );

  return doc.save();
}
