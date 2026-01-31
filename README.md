# TaskerTime ⏱️

Application de gestion complète pour **indépendants** et **professions libérales**.

## ✨ Fonctionnalités

- 📅 **Calendrier intelligent** - Planifiez vos prestations et RDV
- 🛒 **Catalogue de prestations** - Tarifs horaires ou forfaits par prestation
- 💰 **Devis & Factures** - Conformes Factur-X 2026
- 🏛️ **Chorus Pro** - Facturation secteur public
- 💳 **Paiement en ligne** - Intégration Stripe
- 📝 **Contrats** - Import/export + signature électronique
- 👤 **Espace client** - Accès factures, devis, RDV
- 📧 **Relances automatiques** - Factures impayées
- 📊 **Statistiques** - CA, taux conversion, clients rentables
- 🌙 **Mode sombre** - Thème clair/sombre
- 🌍 **Multi-langue** - Français & Anglais
- 📱 **PWA** - Installable sur mobile

## 🚀 Installation

### Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com) (gratuit)
- Compte [Vercel](https://vercel.com) (gratuit)

### 1. Cloner et installer

```bash
git clone https://github.com/votre-username/taskertime.git
cd taskertime
npm install
```

### 2. Configurer l'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` avec vos clés.

### 3. Initialiser la base de données

```bash
npm run db:push
```

### 4. Lancer en développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 🛠️ Stack technique

| Technologie | Usage |
|-------------|-------|
| Next.js 14 | Framework React |
| Supabase | Base de données PostgreSQL |
| Prisma | ORM |
| Tailwind CSS | Styles |
| Shadcn/UI | Composants UI |
| NextAuth.js | Authentification |
| Stripe | Paiements |
| Resend | Emails |
| React Query | Data fetching |

## 📁 Structure

```
taskertime/
├── prisma/
│   └── schema.prisma       # Schéma BDD
├── src/
│   ├── app/                # Pages Next.js
│   │   ├── (auth)/         # Connexion/Inscription
│   │   ├── (dashboard)/    # Interface pro
│   │   ├── (client)/       # Espace client
│   │   ├── api/            # API Routes
│   │   └── book/           # Réservation publique
│   ├── components/
│   │   ├── ui/             # Composants Shadcn
│   │   └── ...             # Composants métier
│   ├── lib/                # Utilitaires
│   └── hooks/              # React hooks
└── public/                 # Assets statiques
```

## 📋 Commandes

```bash
npm run dev          # Développement
npm run build        # Build production
npm run db:studio    # Interface BDD
npm run db:push      # Sync schéma
```

## 🚢 Déploiement

1. Push sur GitHub
2. Importer sur [Vercel](https://vercel.com)
3. Ajouter les variables d'environnement
4. Déployer !

## 📄 Licence

MIT

---

Développé avec ❤️ par [Formation Panthéon](https://formation-pantheon.fr)
