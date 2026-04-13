# Déployer BeWork sur Railway

Ce guide décrit comment déployer la plateforme BeWork sur [Railway](https://railway.app).

## Prérequis

- Un compte [Railway](https://railway.app) (connexion GitHub possible)
- Un dépôt Git (GitHub, GitLab, Bitbucket) contenant le projet
- Une base PostgreSQL : soit **Supabase** (recommandé, déjà utilisé en dev), soit **PostgreSQL Railway** (ajouté comme plugin)

---

## 1. Créer un projet Railway

1. Allez sur [railway.app](https://railway.app) et connectez-vous.
2. **New Project** → **Deploy from GitHub repo** (ou **Empty Project** si vous déploierez via CLI).
3. Choisissez le dépôt **plateforme** (ou le nom de votre repo).
4. Railway détecte automatiquement une app **Next.js** et configure le build.

---

## 2. Base de données

### Option A : Garder Supabase (recommandé)

Si vous utilisez déjà Supabase en dev :

- Aucun changement côté base.
- Dans Railway, vous renseignerez les mêmes `DATABASE_URL` et `DIRECT_URL` (voir section Variables d’environnement).

### Option B : PostgreSQL Railway

1. Dans votre projet Railway : **+ New** → **Database** → **PostgreSQL**.
2. Une fois créée, ouvrez le service PostgreSQL → onglet **Variables** ou **Connect**.
3. Copiez **`DATABASE_URL`** (ou **Postgres Connection URL**) et utilisez-la dans les variables du service **Web** (voir ci‑dessous).
4. Pour Prisma en production avec un pooler, vous pouvez utiliser la même URL pour `DATABASE_URL` et `DIRECT_URL` si Railway ne fournit qu’une seule URL.

---

## 3. Variables d’environnement

Dans le service **Web** (votre app) : **Variables** → **Add variables** (ou **Raw Editor**).

Variables **obligatoires** :

| Variable | Description | Exemple |
|----------|-------------|--------|
| `DATABASE_URL` | Connexion PostgreSQL (Supabase ou Railway) | `postgresql://user:pass@host:5432/db?pgbouncer=true` |
| `DIRECT_URL` | Connexion directe PostgreSQL (Supabase : port 5432) | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| `NEXTAUTH_SECRET` | Secret des sessions NextAuth | Générer : `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL publique de l’app | `https://votre-app.up.railway.app` |

Variables **recommandées** (selon vos besoins) :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (Storage/Realtime) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `CONTACT_EMAIL` | Email qui reçoit les demandes de contact |
| `RESEND_API_KEY` | Clé API Resend (envoi d’emails) |
| `RESEND_FROM_EMAIL` | Expéditeur des emails (domaine vérifié sur Resend) |
| `RESEND_FROM_NAME` | Nom d’affichage (ex. BeWork) |
| `NEW_TASK_EMAIL_TO` | (Optionnel) Destinataires email pour “Nouvelle mission” (emails séparés par virgules). Si absent, envoie aux comptes `MANAGER` ayant un email |

**Important** : Après le premier déploiement, mettez à jour `NEXTAUTH_URL` avec l’URL réelle fournie par Railway (ex. `https://plateforme-production-xxxx.up.railway.app`).

---

## 4. Build et démarrage

Railway utilise **Railpack** et détecte automatiquement :

- **Build** : `npm run build` (défini dans `package.json` : `prisma generate && next build --webpack`)
- **Start** : `npm start` → `next start -p ${PORT}` (Railway injecte `PORT`)

Aucun fichier supplémentaire n’est requis. Le build inclut déjà `prisma generate`.

### Migrations Prisma

- Si vous utilisez **Supabase** et des migrations Prisma (`prisma migrate`), exécutez une fois en local ou via un job :
  ```bash
  npx prisma migrate deploy
  ```
- Vous pouvez aussi ajouter cette commande au **Build Command** dans Railway :  
  **Service → Settings → Build** → Build Command :  
  `npx prisma generate && npx prisma migrate deploy && npm run build`  
  (en adaptant si votre `npm run build` fait déjà `prisma generate`).
- Si vous n’utilisez que `prisma db push` (sans migrations), exécutez `npx prisma db push` une fois contre la base de production (depuis votre machine avec `DATABASE_URL` pointant vers la prod, ou via un script/job).

---

## 5. Déploiement

1. **Déploiement automatique** : à chaque push sur la branche connectée (souvent `main`), Railway rebuild et redéploie.
2. **Déploiement manuel** : **Deploy** → **Deploy Now** (ou via CLI `railway up`).
3. Une fois le build terminé, Railway affiche l’URL publique (ex. `https://…up.railway.app`).
4. Configurez **NEXTAUTH_URL** avec cette URL (et éventuellement un domaine personnalisé).

### Domaine personnalisé (optionnel)

Dans le service Web : **Settings** → **Networking** → **Public Networking** → **Generate domain** ou **Custom domain** pour attacher votre propre domaine.

---

## 6. Vérifications après déploiement

- Ouvrir l’URL de l’app : page d’accueil et lien **Connexion**.
- Tester la connexion (compte démo ou inscription).
- Vérifier que le dashboard et les APIs (demandes, documents, etc.) répondent correctement.

En cas d’erreur 500 ou de problème de base :

- Vérifier les **logs** du service (Railway → service → **Deployments** → dernier déploiement → **View logs**).
- Vérifier que `DATABASE_URL` et `DIRECT_URL` sont bien définis et accessibles depuis Railway (pas d’IP locale).

---

## Résumé des étapes

1. Créer un projet Railway et connecter le repo GitHub.
2. (Optionnel) Ajouter une base PostgreSQL Railway ou garder Supabase.
3. Renseigner les variables d’environnement (au minimum `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
4. Laisser Railway builder et démarrer l’app ; mettre à jour `NEXTAUTH_URL` avec l’URL réelle.
5. Exécuter les migrations Prisma si besoin (`migrate deploy` ou `db push` une fois).
6. Tester l’application et, si besoin, configurer un domaine personnalisé.
