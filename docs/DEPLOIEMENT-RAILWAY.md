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
| `RESEND_API_KEY` | Clé API Resend |
| `RESEND_FROM_EMAIL` | Ex. noreply@votredomaine.com |
| `RESEND_FROM_NAME` | BeWork |
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
