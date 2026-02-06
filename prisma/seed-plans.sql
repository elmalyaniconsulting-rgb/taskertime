-- ============================================================================
-- TaskerTime - Seed des Plans d'abonnement
-- Exécuter après migration: prisma db push && psql < seed-plans.sql
-- OU via Prisma Studio / API admin
-- ============================================================================

-- Plan GRATUIT
INSERT INTO plans (
  id, slug, nom, description,
  "prixMensuel", "prixAnnuel",
  "stripePriceMonth", "stripePriceYear",
  "maxClients", "maxFactures", "maxDevis", "maxPrestations",
  "stripeConnect", "reservationEnLigne", contrats, "signatureElec",
  "relancesAuto", "statsAvancees", "crmComplet", branding,
  "iaAssistant", whatsapp, "googleCalSync", "espaceClient",
  "apiAccess", "multiDevise", "exportFec", "supportPrio",
  ordre, "isActive", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(), 'free', 'Gratuit', 'Découvrez TaskerTime gratuitement',
  0, 0,
  NULL, NULL,
  3, 5, 5, 1,
  false, false, false, false,
  false, false, false, true,
  false, false, false, false,
  false, false, false, false,
  0, true, NOW(), NOW()
);

-- Plan PRO
INSERT INTO plans (
  id, slug, nom, description,
  "prixMensuel", "prixAnnuel",
  "stripePriceMonth", "stripePriceYear",
  "maxClients", "maxFactures", "maxDevis", "maxPrestations",
  "stripeConnect", "reservationEnLigne", contrats, "signatureElec",
  "relancesAuto", "statsAvancees", "crmComplet", branding,
  "iaAssistant", whatsapp, "googleCalSync", "espaceClient",
  "apiAccess", "multiDevise", "exportFec", "supportPrio",
  ordre, "isActive", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(), 'pro', 'Pro', 'Pour les indépendants qui veulent tout gérer au même endroit',
  14.90, 149.00,
  'price_pro_monthly_PLACEHOLDER', 'price_pro_yearly_PLACEHOLDER',
  -1, -1, -1, -1,
  true, true, true, true,
  true, true, true, false,
  false, false, false, false,
  false, false, false, false,
  1, true, NOW(), NOW()
);

-- Plan BUSINESS
INSERT INTO plans (
  id, slug, nom, description,
  "prixMensuel", "prixAnnuel",
  "stripePriceMonth", "stripePriceYear",
  "maxClients", "maxFactures", "maxDevis", "maxPrestations",
  "stripeConnect", "reservationEnLigne", contrats, "signatureElec",
  "relancesAuto", "statsAvancees", "crmComplet", branding,
  "iaAssistant", whatsapp, "googleCalSync", "espaceClient",
  "apiAccess", "multiDevise", "exportFec", "supportPrio",
  ordre, "isActive", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(), 'business', 'Business', 'Pour les professionnels exigeants avec IA et intégrations avancées',
  29.90, 299.00,
  'price_business_monthly_PLACEHOLDER', 'price_business_yearly_PLACEHOLDER',
  -1, -1, -1, -1,
  true, true, true, true,
  true, true, true, false,
  true, true, true, true,
  true, true, true, true,
  2, true, NOW(), NOW()
);

-- ============================================================================
-- NOTES DE CONFIGURATION
-- ============================================================================
-- 
-- Après avoir créé les produits et prix dans Stripe Dashboard :
-- 1. Créer un Product "TaskerTime Pro" et "TaskerTime Business"
-- 2. Pour chaque, créer 2 Prices : mensuel et annuel
-- 3. Remplacer les PLACEHOLDER par les vrais price IDs :
--
-- UPDATE plans SET "stripePriceMonth" = 'price_xxxxx', "stripePriceYear" = 'price_yyyyy' WHERE slug = 'pro';
-- UPDATE plans SET "stripePriceMonth" = 'price_xxxxx', "stripePriceYear" = 'price_yyyyy' WHERE slug = 'business';
--
-- Webhook Stripe : ajouter ces événements au endpoint existant :
-- - customer.subscription.created
-- - customer.subscription.updated
-- - customer.subscription.deleted
-- - invoice.payment_succeeded
-- - invoice.payment_failed
-- - checkout.session.completed (déjà actif)
