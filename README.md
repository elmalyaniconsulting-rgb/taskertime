# TaskerTime

Application de gestion pour indépendants et professions libérales.

## Fonctionnalités

- 📅 **Calendrier** : Gestion des rendez-vous et événements
- 👥 **Clients** : Base de données clients avec CRM intégré
- 📝 **Devis** : Création et envoi de devis professionnels
- 🧾 **Factures** : Facturation conforme Factur-X 2026
- 📆 **Réservation en ligne** : Système type Calendly
- 📊 **Statistiques** : Tableau de bord avec KPIs
- 📧 **Emails** : Envoi automatique via Resend

## Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com) (base de données)
- Compte [Resend](https://resend.com) (emails) - optionnel
- Compte [Vercel](https://vercel.com) (hébergement)

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/taskertime.git
cd taskertime
npm install
```

### 2. Configurer Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `prisma/init-database.sql`
4. Exécutez le script

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine :

```env
# Base de données Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="générez-avec-openssl-rand-base64-32"

# Resend (optionnel mais recommandé pour les emails)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="TaskerTime <noreply@votredomaine.com>"
```

Pour obtenir votre `DATABASE_URL` Supabase :
- Allez dans Settings > Database > Connection string > URI
- Remplacez `[YOUR-PASSWORD]` par le mot de passe de votre projet

### 4. Générer le client Prisma

```bash
npx prisma generate
```

### 5. Lancer en développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Déploiement sur Vercel

### 1. Push sur GitHub

```bash
git add -A
git commit -m "Initial commit"
git push origin main
```

### 2. Connecter à Vercel

1. Importez le projet depuis GitHub sur [Vercel](https://vercel.com)
2. Ajoutez les variables d'environnement :
   - `DATABASE_URL`
   - `NEXTAUTH_URL` = `https://votre-app.vercel.app`
   - `NEXTAUTH_SECRET`
   - `RESEND_API_KEY` (optionnel)
   - `RESEND_FROM_EMAIL` (optionnel)

### 3. Déployer

Vercel déploiera automatiquement à chaque push sur `main`.

## Configuration des emails (Resend)

Pour que l'envoi d'emails fonctionne :

1. Créez un compte sur [Resend](https://resend.com)
2. Ajoutez et vérifiez votre domaine (ou utilisez le domaine de test)
3. Créez une API Key
4. Ajoutez dans Vercel :
   - `RESEND_API_KEY` = votre clé API
   - `RESEND_FROM_EMAIL` = `TaskerTime <noreply@votredomaine.com>`

**Sans Resend** : L'application utilisera un fallback `mailto:` qui ouvre le client email de l'utilisateur.

## Structure du projet

```
taskertime/
├── prisma/
│   ├── schema.prisma      # Schéma de la base de données
│   └── init-database.sql  # Script SQL pour Supabase
├── src/
│   ├── app/               # Pages et routes API (Next.js App Router)
│   ├── components/        # Composants React
│   ├── hooks/             # Hooks personnalisés
│   ├── lib/               # Utilitaires (auth, email, prisma, etc.)
│   └── types/             # Types TypeScript
└── public/                # Assets statiques
```

## Scripts disponibles

```bash
npm run dev       # Développement
npm run build     # Build production
npm run start     # Lancer en production
npm run lint      # Linter
npx prisma studio # Interface visuelle BDD
```

## Support

Pour toute question ou bug, ouvrez une issue sur GitHub.

## Licence

MIT
