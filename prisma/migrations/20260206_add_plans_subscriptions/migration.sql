-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'UNPAID', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "PeriodeType" AS ENUM ('MENSUEL', 'ANNUEL');

-- CreateTable: plans
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable: subscriptions
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
