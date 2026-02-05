-- ============================================================================
-- TaskerTime - Script d'initialisation complète de la base de données
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ENUMS
DO $$ BEGIN
    CREATE TYPE "ClientType" AS ENUM ('PARTICULIER', 'ENTREPRISE', 'ASSOCIATION', 'ADMINISTRATION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ModePaiement" AS ENUM ('VIREMENT', 'CHEQUE', 'CB', 'ESPECES', 'PRELEVEMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "EventType" AS ENUM ('FORMATION', 'REUNION', 'COACHING', 'PROSPECTION', 'ADMINISTRATIF', 'AUTRE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "EventStatut" AS ENUM ('PLANIFIE', 'CONFIRME', 'EN_COURS', 'REALISE', 'ANNULE', 'REPORTE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "QuoteStatut" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'CONVERTI');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceStatut" AS ENUM ('BROUILLON', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE', 'AVOIR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ContractStatut" AS ENUM ('BROUILLON', 'ENVOYE', 'SIGNE', 'ACTIF', 'TERMINE', 'RESILIE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "BookingStatus" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE_CLIENT', 'ANNULE_PRO', 'REALISE', 'NO_SHOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('RESERVATION', 'NOUVELLE_RESERVATION', 'FACTURE', 'DEVIS', 'PAIEMENT', 'RAPPEL', 'SYSTEME');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "siret" TEXT,
    "siren" TEXT,
    "tvaIntracom" TEXT,
    "rcs" TEXT,
    "capitalSocial" DECIMAL(10,2),
    "formeJuridique" TEXT,
    "activite" TEXT,
    "adresseRue" TEXT,
    "adresseCP" TEXT,
    "adresseVille" TEXT,
    "adressePays" TEXT NOT NULL DEFAULT 'FR',
    "tauxHoraireDefaut" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tvaApplicable" BOOLEAN NOT NULL DEFAULT false,
    "tauxTva" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "mentionTvaExo" TEXT,
    "prefixeFacture" TEXT NOT NULL DEFAULT 'F',
    "prefixeDevis" TEXT NOT NULL DEFAULT 'D',
    "prochainNumFacture" INTEGER NOT NULL DEFAULT 1,
    "prochainNumDevis" INTEGER NOT NULL DEFAULT 1,
    "iban" TEXT,
    "bic" TEXT,
    "banque" TEXT,
    "numeroNda" TEXT,
    "certifQualiopi" BOOLEAN NOT NULL DEFAULT false,
    "dateQualiopi" TIMESTAMP(3),
    "stripeAccountId" TEXT,
    "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "disponibilitesDefaut" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_siret_key" ON "users"("siret");

-- CLIENTS TABLE
CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ClientType" NOT NULL DEFAULT 'PARTICULIER',
    "raisonSociale" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "siret" TEXT,
    "tvaIntracom" TEXT,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "adresseRue" TEXT,
    "adresseCP" TEXT,
    "adresseVille" TEXT,
    "adressePays" TEXT NOT NULL DEFAULT 'FR',
    "passwordHash" TEXT,
    "lastLogin" TIMESTAMP(3),
    "isChorusPro" BOOLEAN NOT NULL DEFAULT false,
    "codeService" TEXT,
    "numeroEngagement" TEXT,
    "tauxHoraireClient" DECIMAL(10,2),
    "delaiPaiement" INTEGER NOT NULL DEFAULT 30,
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'VIREMENT',
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "clients_userId_idx" ON "clients"("userId");

-- PRESTATIONS TABLE
CREATE TABLE IF NOT EXISTS "prestations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "tauxHoraire" DECIMAL(10,2) NOT NULL,
    "dureeDefaut" INTEGER NOT NULL DEFAULT 60,
    "couleur" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "prestations_userId_idx" ON "prestations"("userId");

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "prestationId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "lieu" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'REUNION',
    "statut" "EventStatut" NOT NULL DEFAULT 'PLANIFIE',
    "couleur" TEXT,
    "isRecurrent" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceParentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "events_userId_idx" ON "events"("userId");
CREATE INDEX IF NOT EXISTS "events_dateDebut_idx" ON "events"("dateDebut");

-- QUOTES TABLE
CREATE TABLE IF NOT EXISTS "quotes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "objet" TEXT,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidite" TIMESTAMP(3) NOT NULL,
    "lignes" JSONB NOT NULL,
    "totalHT" DECIMAL(10,2) NOT NULL,
    "totalTVA" DECIMAL(10,2) NOT NULL,
    "totalTTC" DECIMAL(10,2) NOT NULL,
    "acompte" DECIMAL(10,2),
    "acomptePourcent" DECIMAL(5,2),
    "conditions" TEXT,
    "notes" TEXT,
    "statut" "QuoteStatut" NOT NULL DEFAULT 'BROUILLON',
    "signatureClient" TEXT,
    "dateSignature" TIMESTAMP(3),
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "quotes_numero_key" ON "quotes"("numero");
CREATE INDEX IF NOT EXISTS "quotes_userId_idx" ON "quotes"("userId");

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "quoteId" TEXT,
    "numero" TEXT NOT NULL,
    "objet" TEXT,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "lignes" JSONB NOT NULL,
    "totalHT" DECIMAL(10,2) NOT NULL,
    "totalTVA" DECIMAL(10,2) NOT NULL,
    "totalTTC" DECIMAL(10,2) NOT NULL,
    "acompteRecu" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "resteAPayer" DECIMAL(10,2) NOT NULL,
    "mentionsLegales" TEXT,
    "notes" TEXT,
    "statut" "InvoiceStatut" NOT NULL DEFAULT 'BROUILLON',
    "datePaiement" TIMESTAMP(3),
    "modePaiement" "ModePaiement",
    "referenceChorusPro" TEXT,
    "facturXPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_numero_key" ON "invoices"("numero");
CREATE INDEX IF NOT EXISTS "invoices_userId_idx" ON "invoices"("userId");

-- INVOICE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS "invoice_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" "ModePaiement" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "invoice_payments_invoiceId_idx" ON "invoice_payments"("invoiceId");

-- CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS "contracts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "filePath" TEXT,
    "statut" "ContractStatut" NOT NULL DEFAULT 'BROUILLON',
    "dateEnvoi" TIMESTAMP(3),
    "dateSignature" TIMESTAMP(3),
    "signatureClient" TEXT,
    "signaturePro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contracts_userId_idx" ON "contracts"("userId");

-- DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "documents_userId_idx" ON "documents"("userId");

-- AVAILABILITY LINKS TABLE
CREATE TABLE IF NOT EXISTS "availability_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dureeMinutes" INTEGER NOT NULL DEFAULT 60,
    "prestationId" TEXT,
    "disponibilites" JSONB,
    "delaiMinReservation" INTEGER NOT NULL DEFAULT 24,
    "delaiMaxReservation" INTEGER NOT NULL DEFAULT 30,
    "bufferAvant" INTEGER NOT NULL DEFAULT 0,
    "bufferApres" INTEGER NOT NULL DEFAULT 15,
    "afficherTarif" BOOLEAN NOT NULL DEFAULT false,
    "tarifAffiche" DECIMAL(10,2),
    "acompteRequis" BOOLEAN NOT NULL DEFAULT false,
    "acomptePourcent" DECIMAL(5,2),
    "couleur" TEXT NOT NULL DEFAULT '#10B981',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "availability_links_slug_key" ON "availability_links"("slug");
CREATE INDEX IF NOT EXISTS "availability_links_userId_idx" ON "availability_links"("userId");

-- AVAILABILITY SLOTS TABLE
CREATE TABLE IF NOT EXISTS "availability_slots" (
    "id" TEXT NOT NULL,
    "availabilityLinkId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "availability_slots_availabilityLinkId_idx" ON "availability_slots"("availabilityLinkId");

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS "bookings" (
    "id" TEXT NOT NULL,
    "availabilityLinkId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "entreprise" TEXT,
    "message" TEXT,
    "statut" "BookingStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "acomptePaye" BOOLEAN NOT NULL DEFAULT false,
    "stripePaymentIntent" TEXT,
    "eventId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_token_key" ON "bookings"("token");
CREATE INDEX IF NOT EXISTS "bookings_availabilityLinkId_idx" ON "bookings"("availabilityLinkId");
CREATE INDEX IF NOT EXISTS "bookings_email_idx" ON "bookings"("email");

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");

-- USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "reminderHours" INTEGER NOT NULL DEFAULT 24,
    "autoRelance" BOOLEAN NOT NULL DEFAULT false,
    "relanceDelai" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_userId_key" ON "user_settings"("userId");

-- FOREIGN KEYS
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_userId_fkey";
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prestations" DROP CONSTRAINT IF EXISTS "prestations_userId_fkey";
ALTER TABLE "prestations" ADD CONSTRAINT "prestations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_userId_fkey";
ALTER TABLE "events" ADD CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_clientId_fkey";
ALTER TABLE "events" ADD CONSTRAINT "events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_prestationId_fkey";
ALTER TABLE "events" ADD CONSTRAINT "events_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "prestations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_userId_fkey";
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_clientId_fkey";
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_userId_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_clientId_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoice_payments" DROP CONSTRAINT IF EXISTS "invoice_payments_invoiceId_fkey";
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_userId_fkey";
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_clientId_fkey";
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_userId_fkey";
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_links" DROP CONSTRAINT IF EXISTS "availability_links_userId_fkey";
ALTER TABLE "availability_links" ADD CONSTRAINT "availability_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_slots" DROP CONSTRAINT IF EXISTS "availability_slots_availabilityLinkId_fkey";
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_availabilityLinkId_fkey" FOREIGN KEY ("availabilityLinkId") REFERENCES "availability_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_availabilityLinkId_fkey";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_availabilityLinkId_fkey" FOREIGN KEY ("availabilityLinkId") REFERENCES "availability_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_settings" DROP CONSTRAINT IF EXISTS "user_settings_userId_fkey";
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SUCCESS MESSAGE
SELECT 'TaskerTime database initialized successfully!' as status;
