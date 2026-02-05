// src/lib/email.ts
// Service d'envoi d'emails via Resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'TaskerTime <noreply@taskertime.app>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, email not sent');
    return { success: false, error: 'Email non configuré', fallback: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Templates d'emails

export function invoiceEmailTemplate({
  clientName,
  invoiceNumber,
  totalTTC,
  resteAPayer,
  dateEcheance,
  pdfUrl,
  senderName,
  customMessage,
}: {
  clientName: string;
  invoiceNumber: string;
  totalTTC: string;
  resteAPayer?: string;
  dateEcheance: string;
  pdfUrl: string;
  senderName: string;
  customMessage?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .invoice-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #1d4ed8; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .btn:hover { background: #1d4ed8; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .custom-message { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Facture ${invoiceNumber}</h1>
  </div>
  <div class="content">
    <p>Bonjour ${clientName},</p>
    <p>Veuillez trouver ci-joint votre facture.</p>
    
    <div class="invoice-box">
      <p><strong>Numéro :</strong> ${invoiceNumber}</p>
      <p><strong>Montant TTC :</strong> <span class="amount">${totalTTC}</span></p>
      ${resteAPayer ? `<p><strong>Reste à payer :</strong> ${resteAPayer}</p>` : ''}
      <p><strong>Date d'échéance :</strong> ${dateEcheance}</p>
    </div>
    
    ${customMessage ? `<div class="custom-message"><p>${customMessage}</p></div>` : ''}
    
    <center>
      <a href="${pdfUrl}" class="btn">📄 Télécharger la facture PDF</a>
    </center>
    
    <p>Cordialement,<br><strong>${senderName}</strong></p>
  </div>
  <div class="footer">
    <p>Email envoyé via TaskerTime</p>
  </div>
</body>
</html>
  `;

  return html;
}

export function quoteEmailTemplate({
  clientName,
  quoteNumber,
  totalTTC,
  validiteDate,
  pdfUrl,
  senderName,
  customMessage,
}: {
  clientName: string;
  quoteNumber: string;
  totalTTC: string;
  validiteDate: string;
  pdfUrl: string;
  senderName: string;
  customMessage?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .quote-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #059669; }
    .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .btn:hover { background: #059669; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .custom-message { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Devis ${quoteNumber}</h1>
  </div>
  <div class="content">
    <p>Bonjour ${clientName},</p>
    <p>Veuillez trouver ci-joint notre proposition commerciale.</p>
    
    <div class="quote-box">
      <p><strong>Numéro :</strong> ${quoteNumber}</p>
      <p><strong>Montant TTC :</strong> <span class="amount">${totalTTC}</span></p>
      <p><strong>Valide jusqu'au :</strong> ${validiteDate}</p>
    </div>
    
    ${customMessage ? `<div class="custom-message"><p>${customMessage}</p></div>` : ''}
    
    <center>
      <a href="${pdfUrl}" class="btn">📄 Voir le devis PDF</a>
    </center>
    
    <p>N'hésitez pas à nous contacter pour toute question.</p>
    
    <p>Cordialement,<br><strong>${senderName}</strong></p>
  </div>
  <div class="footer">
    <p>Email envoyé via TaskerTime</p>
  </div>
</body>
</html>
  `;

  return html;
}

export function bookingConfirmationTemplate({
  clientName,
  proName,
  bookingTitle,
  dateTime,
  duration,
  location,
}: {
  clientName: string;
  proName: string;
  bookingTitle: string;
  dateTime: string;
  duration: string;
  location?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .booking-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .icon { font-size: 48px; margin-bottom: 10px; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="icon">✅</div>
    <h1 style="margin: 0;">Réservation confirmée !</h1>
  </div>
  <div class="content">
    <p>Bonjour ${clientName},</p>
    <p>Votre réservation a été confirmée.</p>
    
    <div class="booking-box">
      <p><strong>📅 ${bookingTitle}</strong></p>
      <p><strong>Date :</strong> ${dateTime}</p>
      <p><strong>Durée :</strong> ${duration}</p>
      ${location ? `<p><strong>Lieu :</strong> ${location}</p>` : ''}
      <p><strong>Avec :</strong> ${proName}</p>
    </div>
    
    <p>À bientôt !</p>
    
    <p>Cordialement,<br><strong>${proName}</strong></p>
  </div>
  <div class="footer">
    <p>Email envoyé via TaskerTime</p>
  </div>
</body>
</html>
  `;

  return html;
}

export function newBookingNotificationTemplate({
  proName,
  clientName,
  clientEmail,
  bookingTitle,
  dateTime,
  message,
  dashboardUrl,
}: {
  proName: string;
  clientName: string;
  clientEmail: string;
  bookingTitle: string;
  dateTime: string;
  message?: string;
  dashboardUrl: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .booking-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .icon { font-size: 48px; margin-bottom: 10px; }
    .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .message-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="icon">🔔</div>
    <h1 style="margin: 0;">Nouvelle réservation !</h1>
  </div>
  <div class="content">
    <p>Bonjour ${proName},</p>
    <p>Vous avez reçu une nouvelle demande de réservation.</p>
    
    <div class="booking-box">
      <p><strong>👤 Client :</strong> ${clientName}</p>
      <p><strong>📧 Email :</strong> ${clientEmail}</p>
      <p><strong>📅 ${bookingTitle}</strong></p>
      <p><strong>Date :</strong> ${dateTime}</p>
    </div>
    
    ${message ? `<div class="message-box"><p><strong>Message du client :</strong></p><p>${message}</p></div>` : ''}
    
    <center>
      <a href="${dashboardUrl}" class="btn">Voir la réservation</a>
    </center>
  </div>
  <div class="footer">
    <p>Email envoyé via TaskerTime</p>
  </div>
</body>
</html>
  `;

  return html;
}
