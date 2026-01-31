import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      siret: true,
      siren: true,
      tvaIntracom: true,
      rcs: true,
      capitalSocial: true,
      formeJuridique: true,
      activite: true,
      adresseRue: true,
      adresseCP: true,
      adresseVille: true,
      adressePays: true,
      tauxHoraireDefaut: true,
      tvaApplicable: true,
      tauxTva: true,
      mentionTvaExo: true,
      prefixeFacture: true,
      prefixeDevis: true,
      prochainNumFacture: true,
      prochainNumDevis: true,
      iban: true,
      bic: true,
      banque: true,
      numeroNda: true,
      certifQualiopi: true,
      stripeAccountId: true,
      stripeOnboarded: true,
      langue: true,
      theme: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return user;
}
