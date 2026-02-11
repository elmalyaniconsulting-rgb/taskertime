// src/lib/email.ts
// Service d'envoi d'emails via Resend

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'TaskerTime <noreply@taskertime.app>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY || !resend) {
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
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

// Email templates
export function bookingConfirmationTemplate(params: {
  clientName: string;
  date: string;
  time: string;
  service: string;
  proName: string;
}) {
  return {
    subject: `Confirmation de votre RDV - ${params.service}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">Confirmation de rendez-vous</h2>
        <p>Bonjour ${params.clientName},</p>
        <p>Votre rendez-vous est confirmé :</p>
        <div style="background: #F5F3FF; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Service :</strong> ${params.service}</p>
          <p style="margin: 4px 0;"><strong>Date :</strong> ${params.date}</p>
          <p style="margin: 4px 0;"><strong>Heure :</strong> ${params.time}</p>
          <p style="margin: 4px 0;"><strong>Avec :</strong> ${params.proName}</p>
        </div>
        <p>À bientôt !</p>
      </div>
    `,
  };
}

export function newBookingNotificationTemplate(params: {
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  service: string;
}) {
  return {
    subject: `Nouvelle réservation : ${params.clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">Nouvelle réservation reçue</h2>
        <div style="background: #F5F3FF; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Client :</strong> ${params.clientName} (${params.clientEmail})</p>
          <p style="margin: 4px 0;"><strong>Service :</strong> ${params.service}</p>
          <p style="margin: 4px 0;"><strong>Date :</strong> ${params.date}</p>
          <p style="margin: 4px 0;"><strong>Heure :</strong> ${params.time}</p>
        </div>
        <p>Connectez-vous à TaskerTime pour confirmer ou refuser cette réservation.</p>
      </div>
    `,
  };
}
