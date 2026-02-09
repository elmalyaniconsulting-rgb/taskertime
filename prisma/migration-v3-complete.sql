-- ============================================================================
-- TaskerTime V3 - Migration complète
-- Exécuter dans Supabase SQL Editor
-- ATTENTION: Ce script recrée toutes les tables. Sauvegardez vos données.
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: SUPPRIMER LES ANCIENNES TABLES ET ENUMS
-- ============================================================================
DROP TABLE IF EXISTS "client_interactions" CASCADE;
DROP TABLE IF EXISTS "availability_slots" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "availability_links" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "user_settings" CASCADE;
DROP TABLE IF EXISTS "documents" CASCADE;
DROP TABLE IF EXISTS "contracts" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "invoice_payments" CASCADE;
DROP TABLE IF EXISTS "invoice_lines" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "quote_lines" CASCADE;
DROP TABLE IF EXISTS "quotes" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "prestations" CASCADE;
DROP TABLE IF EXISTS "subscriptions" CASCADE;
DROP TABLE IF EXISTS "plans" CASCADE;
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS "ClientType" CASCADE;
DROP TYPE IF EXISTS "ModePaiement" CASCADE;
DROP TYPE IF EXISTS "InteractionType" CASCADE;
DROP TYPE IF EXISTS "TypeTarif" CASCADE;
DROP TYPE IF EXISTS "EventType" CASCADE;
DROP TYPE IF EXISTS "EventStatus" CASCADE;
DROP TYPE IF EXISTS "EventStatut" CASCADE;
DROP TYPE IF EXISTS "QuoteStatus" CASCADE;
DROP TYPE IF EXISTS "QuoteStatut" CASCADE;
DROP TYPE IF EXISTS "InvoiceStatus" CASCADE;
DROP TYPE IF EXISTS "InvoiceStatut" CASCADE;
DROP TYPE IF EXISTS "ContractStatus" CASCADE;
DROP TYPE IF EXISTS "ContractStatut" CASCADE;
DROP TYPE IF EXISTS "BookingStatus" CASCADE;
DROP TYPE IF EXISTS "NotificationType" CASCADE;
DROP TYPE IF EXISTS "DocumentType" CASCADE;
DROP TYPE IF EXISTS "SubscriptionStatus" CASCADE;
DROP TYPE IF EXISTS "PeriodeType" CASCADE;

-- ============================================================================
-- ÉTAPE 2: CRÉER LES ENUMS
-- ============================================================================
CREATE TYPE "ClientType" AS ENUM ('PARTICULIER', 'ENTREPRISE', 'ASSOCIATION', 'ETABLISSEMENT_PUBLIC');
CREATE TYPE "ModePaiement" AS ENUM ('VIREMENT', 'CHEQUE', 'CB', 'ESPECES', 'PRELEVEMENT', 'STRIPE');
CREATE TYPE "InteractionType" AS ENUM ('NOTE', 'APPEL', 'EMAIL', 'REUNION', 'AUTRE');
CREATE TYPE "TypeTarif" AS ENUM ('HORAIRE', 'FORFAIT', 'JOURNALIER');
CREATE TYPE "EventType" AS ENUM ('PRESTATION', 'REUNION', 'PERSONNEL', 'AUTRE');
CREATE TYPE "EventStatus" AS ENUM ('PLANIFIE', 'CONFIRME', 'EN_COURS', 'REALISE', 'ANNULE', 'REPORTE');
CREATE TYPE "QuoteStatus" AS ENUM ('BROUILLON', 'ENVOYE', 'VU', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'CONVERTI');
CREATE TYPE "InvoiceStatus" AS ENUM ('BROUILLON', 'ENVOYEE', 'VUE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE', 'AVOIR');
CREATE TYPE "ContractStatus" AS ENUM ('BROUILLON', 'ENVOYE', 'VU', 'SIGNE', 'REFUSE', 'EXPIRE');
CREATE TYPE "BookingStatus" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE_CLIENT', 'ANNULE_PRO', 'REALISE', 'NO_SHOW');
CREATE TYPE "NotificationType" AS ENUM ('RESERVATION', 'NOUVELLE_RESERVATION', 'RESERVATION_ANNULEE', 'DEVIS_ACCEPTE', 'DEVIS_REFUSE', 'FACTURE_PAYEE', 'FACTURE_EN_RETARD', 'PAIEMENT_RECU', 'CONTRAT_SIGNE', 'RAPPEL_RDV');
CREATE TYPE "DocumentType" AS ENUM ('DEVIS_PDF', 'FACTURE_PDF', 'FACTURE_XML', 'CONTRAT', 'AUTRE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'UNPAID', 'INCOMPLETE');
CREATE TYPE "PeriodeType" AS ENUM ('MENSUEL', 'ANNUEL');

-- ============================================================================
-- ÉTAPE 3: CRÉER LES TABLES
-- ============================================================================

-- USERS
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
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
    "role" TEXT NOT NULL DEFAULT 'user',
    "disponibilitesDefaut" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_siret_key" ON "users"("siret");

-- PLANS
CREATE TABLE "plans" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prixMensuel" DECIMAL(10,2) NOT NULL,
    "prixAnnuel" DECIMAL(10,2) NOT NULL,
    "stripePriceMonth" TEXT,
    "stripePriceYear" TEXT,
    "maxClients" INTEGER NOT NULL DEFAULT -1,
    "maxFactures" INTEGER NOT NULL DEFAULT -1,
    "maxDevis" INTEGER NOT NULL DEFAULT -1,
    "maxPrestations" INTEGER NOT NULL DEFAULT -1,
    "stripeConnect" BOOLEAN NOT NULL DEFAULT false,
    "reservationEnLigne" BOOLEAN NOT NULL DEFAULT false,
    "contrats" BOOLEAN NOT NULL DEFAULT false,
    "signatureElec" BOOLEAN NOT NULL DEFAULT false,
    "relancesAuto" BOOLEAN NOT NULL DEFAULT false,
    "statsAvancees" BOOLEAN NOT NULL DEFAULT false,
    "crmComplet" BOOLEAN NOT NULL DEFAULT false,
    "branding" BOOLEAN NOT NULL DEFAULT true,
    "iaAssistant" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "googleCalSync" BOOLEAN NOT NULL DEFAULT false,
    "espaceClient" BOOLEAN NOT NULL DEFAULT false,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "multiDevise" BOOLEAN NOT NULL DEFAULT false,
    "exportFec" BOOLEAN NOT NULL DEFAULT false,
    "supportPrio" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- SUBSCRIPTIONS
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "statut" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "periodeType" "PeriodeType" NOT NULL DEFAULT 'MENSUEL',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "dateProchainPaiement" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CLIENTS
CREATE TABLE "clients" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
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

-- CLIENT INTERACTIONS
CREATE TABLE "client_interactions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "clientId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_interactions_pkey" PRIMARY KEY ("id")
);

-- PRESTATIONS
CREATE TABLE "prestations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "typeTarif" "TypeTarif" NOT NULL DEFAULT 'HORAIRE',
    "tauxHoraire" DECIMAL(10,2),
    "prixForfait" DECIMAL(10,2),
    "dureeMinutes" INTEGER NOT NULL DEFAULT 60,
    "tauxTvaSpecifique" DECIMAL(5,2),
    "categorie" TEXT,
    "couleur" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prestations_pkey" PRIMARY KEY ("id")
);

-- EVENTS
CREATE TABLE "events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "prestationId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "lieu" TEXT,
    "isDistanciel" BOOLEAN NOT NULL DEFAULT false,
    "lienVisio" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceId" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'PRESTATION',
    "tauxHoraire" DECIMAL(10,2),
    "montantFixe" DECIMAL(10,2),
    "dureeHeures" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "montantCalcule" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "statut" "EventStatus" NOT NULL DEFAULT 'PLANIFIE',
    "quoteLineId" TEXT,
    "invoiceLineId" TEXT,
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- QUOTES
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidite" TIMESTAMP(3) NOT NULL,
    "totalHT" DECIMAL(10,2) NOT NULL,
    "totalTVA" DECIMAL(10,2) NOT NULL,
    "totalTTC" DECIMAL(10,2) NOT NULL,
    "acompteRequis" BOOLEAN NOT NULL DEFAULT false,
    "acomptePourcent" DECIMAL(5,2),
    "acompteMontant" DECIMAL(10,2),
    "statut" "QuoteStatus" NOT NULL DEFAULT 'BROUILLON',
    "conditions" TEXT,
    "notes" TEXT,
    "signedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "signedByIp" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quotes_invoiceId_key" ON "quotes"("invoiceId");

-- QUOTE LINES
CREATE TABLE "quote_lines" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "quoteId" TEXT NOT NULL,
    "prestationId" TEXT,
    "description" TEXT NOT NULL,
    "quantite" DECIMAL(10,2) NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'heure',
    "prixUnitaire" DECIMAL(10,2) NOT NULL,
    "tauxTva" DECIMAL(5,2) NOT NULL,
    "totalHT" DECIMAL(10,2) NOT NULL,
    "totalTVA" DECIMAL(10,2) NOT NULL,
    "totalTTC" DECIMAL(10,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- INVOICES
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "totalHT" DECIMAL(10,2) NOT NULL,
    "totalTVA" DECIMAL(10,2) NOT NULL,
    "totalTTC" DECIMAL(10,2) NOT NULL,
    "montantPaye" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "resteAPayer" DECIMAL(10,2) NOT NULL,
    "statut" "InvoiceStatus" NOT NULL DEFAULT 'BROUILLON',
    "conditions" TEXT,
    "notes" TEXT,
    "mentionsLegales" TEXT,
    "facturxXml" TEXT,
    "facturxPdf" TEXT,
    "facturxProfile" TEXT NOT NULL DEFAULT 'BASIC',
    "isChorusPro" BOOLEAN NOT NULL DEFAULT false,
    "chorusIdFlux" TEXT,
    "chorusStatut" TEXT,
    "chorusDateDepot" TIMESTAMP(3),
    "stripePaymentIntent" TEXT,
    "stripePaymentUrl" TEXT,
    "nombreRelances" INTEGER NOT NULL DEFAULT 0,
    "derniereRelance" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- INVOICE LINES
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "invoiceId" TEXT NOT NULL,
    "prestationId" TEXT,
    "description" TEXT NOT NULL,
    "quantite" DECIMAL(10,2) NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'heure',
    "prixUnitaire" DECIMAL(10,2) NOT NULL,
    "tauxTva" DECIMAL(5,2) NOT NULL,
    "totalHT" DECIMAL(10,2) NOT NULL,
    "totalTVA" DECIMAL(10,2) NOT NULL,
    "totalTTC" DECIMAL(10,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- PAYMENTS
CREATE TABLE "payments" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "invoiceId" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "mode" "ModePaiement" NOT NULL,
    "reference" TEXT,
    "datePaiement" TIMESTAMP(3) NOT NULL,
    "stripePaymentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CONTRACTS
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "fichierOriginal" TEXT,
    "fichierSigne" TEXT,
    "statut" "ContractStatus" NOT NULL DEFAULT 'BROUILLON',
    "dateEnvoi" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "signedByIp" TEXT,
    "signedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- DOCUMENTS
CREATE TABLE "documents" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "quoteId" TEXT,
    "invoiceId" TEXT,
    "nom" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT,
    "isSharedWithClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- AVAILABILITY LINKS
CREATE TABLE "availability_links" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
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
CREATE UNIQUE INDEX "availability_links_slug_key" ON "availability_links"("slug");

-- AVAILABILITY SLOTS
CREATE TABLE "availability_slots" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "availabilityLinkId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- BOOKINGS
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
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
    "token" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "reminderSent24h" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent1h" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bookings_token_key" ON "bookings"("token");

-- NOTIFICATIONS
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
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

-- USER SETTINGS
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "notifEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifPush" BOOLEAN NOT NULL DEFAULT true,
    "relanceAuto" BOOLEAN NOT NULL DEFAULT true,
    "relanceJ1" BOOLEAN NOT NULL DEFAULT true,
    "relanceJ7" BOOLEAN NOT NULL DEFAULT true,
    "relanceJ15" BOOLEAN NOT NULL DEFAULT true,
    "relanceJ30" BOOLEAN NOT NULL DEFAULT false,
    "rappelRdv24h" BOOLEAN NOT NULL DEFAULT true,
    "rappelRdv1h" BOOLEAN NOT NULL DEFAULT false,
    "googleCalendarSync" BOOLEAN NOT NULL DEFAULT false,
    "googleCalendarId" TEXT,
    "googleRefreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- ============================================================================
-- ÉTAPE 4: FOREIGN KEYS
-- ============================================================================
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id");
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "client_interactions" ADD CONSTRAINT "client_interactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE;
ALTER TABLE "prestations" ADD CONSTRAINT "prestations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL;
ALTER TABLE "events" ADD CONSTRAINT "events_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "prestations"("id") ON DELETE SET NULL;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE;
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE;
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "prestations"("id") ON DELETE SET NULL;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE;
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE;
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "prestations"("id") ON DELETE SET NULL;
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL;
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL;
ALTER TABLE "documents" ADD CONSTRAINT "documents_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL;
ALTER TABLE "documents" ADD CONSTRAINT "documents_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL;
ALTER TABLE "availability_links" ADD CONSTRAINT "availability_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_availabilityLinkId_fkey" FOREIGN KEY ("availabilityLinkId") REFERENCES "availability_links"("id") ON DELETE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_availabilityLinkId_fkey" FOREIGN KEY ("availabilityLinkId") REFERENCES "availability_links"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- ============================================================================
-- ÉTAPE 5: SEED PLANS
-- ============================================================================
INSERT INTO "plans" ("id", "slug", "nom", "description", "prixMensuel", "prixAnnuel", "maxClients", "maxFactures", "maxDevis", "maxPrestations", "stripeConnect", "reservationEnLigne", "contrats", "signatureElec", "relancesAuto", "statsAvancees", "crmComplet", "branding", "iaAssistant", "whatsapp", "googleCalSync", "espaceClient", "apiAccess", "multiDevise", "exportFec", "supportPrio", "ordre")
VALUES
(gen_random_uuid()::TEXT, 'free', 'Gratuit', 'Pour démarrer', 0, 0, 5, 5, 5, 5, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, 1),
(gen_random_uuid()::TEXT, 'pro', 'Pro', 'Pour les indépendants actifs', 9.99, 99.90, -1, -1, -1, -1, true, true, true, true, true, true, true, false, true, false, false, false, false, false, false, false, 2),
(gen_random_uuid()::TEXT, 'business', 'Business', 'Pour aller plus loin', 24.99, 249.90, -1, -1, -1, -1, true, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, 3);

-- ============================================================================
-- ÉTAPE 6: RE-INSÉRER LES UTILISATEURS EXISTANTS
-- ============================================================================
-- Vos utilisateurs seront supprimés par le DROP TABLE. 
-- Recréez-les via /register ou exécutez les INSERT ci-dessous :

INSERT INTO "users" ("id", "email", "passwordHash", "firstName", "lastName", "role")
VALUES 
('cb6d93cb-0068-42a6-8ff9-e2e729f0d0c8', 'elmalyani.consulting@gmail.com', '$2a$10$xPQOH5JzQGHQs3H7m2bnZOZFE8XKpL1hLqKy9qN5rK7fVnW3.Jq6e', 'mehdi', 'el malyani', 'admin'),
('c10a7ede-2018-4ca5-a265-b14810cae16a', 'youssoufi.khadija@hotmail.fr', '$2a$10$xPQOH5JzQGHQs3H7m2bnZOZFE8XKpL1hLqKy9qN5rK7fVnW3.Jq6e', 'Khadija', 'Youssoufi', 'user'),
('4bdf4ebe-1e16-441e-9f6d-448a1e956f13', 'marouane.you@outlook.fr', '$2a$10$xPQOH5JzQGHQs3H7m2bnZOZFE8XKpL1hLqKy9qN5rK7fVnW3.Jq6e', 'Marouane', 'You', 'user');

-- IMPORTANT: Le mot de passe temporaire pour tous les comptes est: Test1234!
-- Changez-le dans Paramètres après connexion.

-- Assigner le plan gratuit à chaque utilisateur
INSERT INTO "subscriptions" ("id", "userId", "planId")
SELECT gen_random_uuid()::TEXT, u.id, p.id
FROM "users" u, "plans" p
WHERE p.slug = 'free';

SELECT 'TaskerTime V3 database migration complete!' as status;
