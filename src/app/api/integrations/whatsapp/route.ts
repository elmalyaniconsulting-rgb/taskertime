export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

// GET /api/integrations/whatsapp - Status
export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    enabled: false,
    status: 'not_configured',
    message: 'L\'intégration WhatsApp Business API sera disponible dans le plan Business. Elle permettra : envoi de confirmations de RDV, rappels automatiques, partage de factures et devis directement via WhatsApp.',
    features: [
      'Confirmation de réservation automatique',
      'Rappels RDV 24h et 1h avant',
      'Envoi de factures et devis',
      'Notifications de paiement reçu',
      'Messages personnalisés aux clients',
    ],
  });
}

// POST /api/integrations/whatsapp - Send message (skeleton)
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, to, message, templateName, templateParams } = await req.json();

    // WhatsApp Business API integration skeleton
    // Requires: Meta Business verification, WhatsApp Business API access,
    // phone number registration, and approved message templates

    if (action === 'send') {
      // TODO: Implement with WhatsApp Cloud API
      // const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
      // const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
      //
      // const response = await fetch(
      //   `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       messaging_product: 'whatsapp',
      //       to: to,
      //       type: 'template',
      //       template: {
      //         name: templateName,
      //         language: { code: 'fr' },
      //         components: templateParams,
      //       },
      //     }),
      //   }
      // );

      // For now, generate a WhatsApp deep link as fallback
      const cleanPhone = (to || '').replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(message || '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      return NextResponse.json({
        status: 'fallback',
        whatsappUrl,
        message: 'WhatsApp Business API non configurée. Utilisez le lien direct pour envoyer le message manuellement.',
      });
    }

    if (action === 'configure') {
      return NextResponse.json({
        status: 'pending',
        steps: [
          '1. Créer un compte Meta Business (business.facebook.com)',
          '2. Configurer WhatsApp Business API dans le Meta Developer Dashboard',
          '3. Obtenir un numéro de téléphone vérifié',
          '4. Créer des templates de messages approuvés par Meta',
          '5. Ajouter les variables WHATSAPP_TOKEN et WHATSAPP_PHONE_ID dans Vercel',
        ],
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
