# Déployer la plateforme BeWork sur Railway

## 1. Préparer le code

Poussez votre projet sur **GitHub** si ce n’est pas déjà fait :

```bash
git add .
git commit -m "Prêt pour déploiement Railway"
git push origin main
```

## 2. Créer un projet sur Railway

1. Allez sur [railway.app](https://railway.app) et connectez-vous (avec GitHub).
2. Cliquez sur **New Project**.
3. Choisissez **Deploy from GitHub repo** et sélectionnez le dépôt **plateforme** (autorisez Railway à accéder au repo si demandé).
4. Railway détecte le projet et crée un service. Vous pouvez laisser les réglages par défaut pour l’instant.

## 3. Configurer le build et le démarrage

Dans le service créé :

1. Allez dans **Settings** (ou onglet **Settings** du service).
2. **Build** :
   - **Build Command** : `npm run build`  
     (ou laisser vide pour utiliser le script `build` du `package.json` : `prisma generate && next build`).
3. **Deploy** :
   - **Start Command** : `npm run start`  
     (ou laisser vide ; le script `start` utilise déjà le port `PORT` fourni par Railway).
4. **Root Directory** : laisser vide si le code est à la racine du dépôt.

## 4. Variables d’environnement

Dans **Variables** (onglet du service ou **Variables** du projet), ajoutez :

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `DATABASE_URL` | URL Supabase (port **6543**, pooler) | Oui |
| `NEXTAUTH_SECRET` | Chaîne secrète (ex. `openssl rand -base64 32`) | Oui |
| `NEXTAUTH_URL` | **https://votre-app.railway.app** (voir ci‑dessous) | Oui |

**Important :** Ne pas mettre `DIRECT_URL` sur Railway (réservé au `prisma db push` en local).

Optionnel (formulaire contact / emails) :

| Variable | Valeur |
|----------|--------|
| `CONTACT_EMAIL` | Email qui reçoit les demandes |
| `BREVO_API_KEY` | Clé API Brevo (transactionnel) |
| `EMAIL_FROM` | Ex. noreply@bework.fr |
| `EMAIL_FROM_NAME` | BeWork |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro WhatsApp (sans +) |

## 5. Obtenir l’URL publique et corriger NEXTAUTH_URL

1. Dans votre service, allez dans **Settings** → **Networking** (ou **Generate Domain**).
2. Cliquez sur **Generate Domain** pour obtenir une URL du type :  
   `https://plateforme-production-xxxx.up.railway.app`
3. Copiez cette URL et mettez‑la dans la variable **`NEXTAUTH_URL`** (remplacez l’ancienne valeur).
4. Redéployez le service (**Redeploy** ou nouveau push sur GitHub) pour que la connexion NextAuth fonctionne.

## 6. Déploiement

- À chaque **push sur la branche connectée** (souvent `main`), Railway rebuild et redéploie automatiquement.
- Vous pouvez aussi lancer un déploiement à la main depuis le dashboard.

## 7. (Optionnel) Domaine personnalisé

Dans **Settings** → **Networking** → **Custom Domain**, ajoutez votre domaine (ex. `app.iatask.fr`) et configurez le CNAME indiqué par Railway chez votre hébergeur DNS.

Pensez à mettre à jour **`NEXTAUTH_URL`** avec ce domaine (ex. `https://app.iatask.fr`).

---

## Résumé

- **Build** : `npm run build` (déjà : `prisma generate && next build`).
- **Start** : `npm run start` (écoute sur le `PORT` fourni par Railway).
- **Variables minimales** : `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (URL réelle du site après génération du domaine).

Pour générer un secret :

```bash
openssl rand -base64 32
```

---

## En cas d’« Application error » au chargement

1. **Voir les logs serveur**  
   Railway → votre projet → votre service → onglet **Deployments** → cliquer sur le dernier déploiement → **View Logs** (ou **Logs**). Regarder la section **Runtime** après le démarrage : le message d’erreur exact (et la pile d’appels) s’affiche là.

2. **Vérifier les variables**  
   - `DATABASE_URL` : URL Supabase. Pour le pooler (recommandé), utiliser le **port 6543** (mode transaction) dans l’URL fournie par Supabase (Settings → Database → Connection string → URI, mode Transaction).  
   - `NEXTAUTH_URL` : exactement l’URL du site (ex. `https://www.bework.fr`), sans slash final.  
   - `NEXTAUTH_SECRET` : doit être défini (générer avec `openssl rand -base64 32`).

3. **Connexion Supabase**  
   Si les logs indiquent une erreur de connexion à la base : dans Supabase (Settings → Database), prendre l’URL avec **port 6543** et `?pgbouncer=true`, et éventuellement ajouter `&sslmode=require` si requis.

4. **Tables manquantes**  
   Si l’erreur mentionne une table absente (ex. `Subscription`, `Payment`), exécuter le script SQL Supabase : `prisma/migrations/subscription-payment-actions.sql` dans le SQL Editor Supabase.
