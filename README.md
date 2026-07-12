# Plateforme Client - Agence

Plateforme d'échange sécurisée entre vos clients et votre agence. Gestion des projets, messagerie et suivi en un seul endroit.

## Fonctionnalités

- **Authentification** : Connexion et inscription avec rôles (Client / Agence)
- **Tableau de bord** : KPIs (tâches en cours, complétées, documents en attente, temps moyen), activité récente, alertes, graphique 7 jours
- **Mes documents** : Upload (PDF, JPG, PNG, DOCX, XLSX, max 10 Mo), liste/grille, filtres (catégorie, statut, recherche), pagination
- **Projets** : Les clients créent des projets, l'agence les consulte
- **Messagerie** : Échange de messages par projet entre client et agence

## Démarrage rapide

### Prérequis

- Node.js 18+
- npm
- Un projet [Supabase](https://supabase.com) (gratuit)

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte / projet.
2. Dans **Project Settings → Database**, récupérez la **Connection string** (mode URI).
3. Choisissez **Connection pooling** (port **6543**) pour l’app, et remplacez `[YOUR-PASSWORD]` par le mot de passe de la base.
4. Dans **Project Settings → API**, notez l’**URL** et la clé **anon public** (optionnel, pour Realtime/Storage plus tard).

### 2. Installation

```bash
# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env

# Renseigner dans .env :
# - DATABASE_URL (chaîne PostgreSQL Supabase)
# - NEXTAUTH_SECRET, NEXTAUTH_URL
# - NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (pour upload de documents)

# Créer le bucket Supabase Storage "documents" (privé recommandé ; les téléchargements passent par URL signée).
# Si le bucket reste public temporairement, le fallback URL stockée continue de fonctionner.

# Créer les tables dans Supabase
npx prisma migrate dev --name init

# Créer les comptes de démo
npm run db:seed
```

### Lancement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

### Comptes de démo

| Rôle  | Email              | Mot de passe    |
|-------|--------------------|-----------------|
| Client| client@exemple.com | motdepasse123   |
| Agence| agence@exemple.com | motdepasse123   |

## Configuration

### Variables d'environnement (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL Supabase (pooler, port 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (optionnel, pour Realtime/Storage) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase (optionnel) |
| `NEXTAUTH_SECRET` | Secret des sessions (générer avec `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL de l’app (`http://localhost:3000` en dev) |

### Production

1. Générer un secret NextAuth : `openssl rand -base64 32`
2. Mettre à jour `NEXTAUTH_URL` avec l’URL de production.
3. La base est déjà sur Supabase (PostgreSQL hébergé).

## Scripts disponibles

| Commande       | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Serveur de développement      |
| `npm run build`| Build de production           |
| `npm run start`| Démarrer en production        |
| `npm run db:seed` | Créer les utilisateurs de démo |
| `npm run db:studio` | Interface Prisma Studio   |

## Structure du projet

```
src/
├── app/                    # Pages et routes Next.js
│   ├── api/               # Routes API
│   │   ├── auth/          # Authentification (NextAuth, inscription)
│   │   ├── messages/      # Envoi de messages
│   │   └── projets/       # Création de projets
│   ├── connexion/         # Page de connexion
│   ├── inscription/       # Page d'inscription
│   └── dashboard/         # Espace connecté
│       └── projets/        # Liste et détail des projets
├── components/            # Composants réutilisables
└── lib/                   # Utilitaires (Prisma, Auth)
prisma/
├── schema.prisma          # Modèles de données
├── seed.ts                # Données initiales
└── migrations/            # Migrations SQL
```

## Technologies

- **Next.js 16** - Framework React
- **TypeScript** - Typage
- **Supabase** - Base PostgreSQL hébergée
- **Prisma 7** - ORM (avec adaptateur PostgreSQL)
- **NextAuth.js** - Authentification
- **Tailwind CSS** - Styles
