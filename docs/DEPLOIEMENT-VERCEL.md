# Déployer la plateforme IATASK sur Vercel

## 1. Préparer le code

- Poussez votre projet sur **GitHub** (ou GitLab / Bitbucket) si ce n’est pas déjà fait :
  ```bash
  git add .
  git commit -m "Prêt pour déploiement"
  git push origin main
  ```

## 2. Créer un projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous (avec GitHub).
2. Cliquez sur **Add New** → **Project**.
3. Importez le dépôt **plateforme** (autorisez Vercel à accéder au repo si demandé).
4. Vercel détecte Next.js automatiquement. Ne changez pas le **Framework Preset** ni la **Build Command** (le script `build` du `package.json` fait déjà `prisma generate && next build`).
5. **Ne déployez pas tout de suite** : cliquez sur **Environment Variables** pour ajouter les variables ci‑dessous.

## 3. Variables d’environnement (obligatoires)

Dans **Settings** du projet (ou lors de l’import), ajoutez :

| Nom | Valeur | Remarque |
|-----|--------|----------|
| `DATABASE_URL` | Votre URL Supabase (port **6543**, pooler) | Copier depuis Supabase → Database → Connection string |
| `NEXTAUTH_SECRET` | Une chaîne aléatoire (ex. `openssl rand -base64 32`) | Gardez la même qu’en local ou générez une nouvelle pour la prod |
| `NEXTAUTH_URL` | **https://votre-projet.vercel.app** | À adapter après le 1er déploiement (voir ci‑dessous) |

Variables optionnelles (selon vos besoins) :

| Nom | Valeur |
|-----|--------|
| `CONTACT_EMAIL` | Email qui reçoit les demandes de contact |
| `RESEND_API_KEY` | Clé API Resend (envoi des emails du formulaire) |
| `RESEND_FROM_EMAIL` | Ex. noreply@votredomaine.com |
| `RESEND_FROM_NAME` | IATASK |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro WhatsApp (sans +) |

**Important :**  
- Ne pas ajouter `DIRECT_URL` sur Vercel (utilisée seulement pour `prisma db push` en local).  
- La base Supabase est déjà créée (tables en place) ; le build fait uniquement `prisma generate`.

## 4. Premier déploiement

1. Cliquez sur **Deploy**.
2. Attendez la fin du build (1 à 3 min).
3. Une fois en ligne, Vercel vous donne une URL du type : `https://plateforme-xxx.vercel.app`.

## 5. Corriger NEXTAUTH_URL après le 1er déploiement

1. Dans Vercel : **Project** → **Settings** → **Environment Variables**.
2. Modifiez `NEXTAUTH_URL` et mettez exactement l’URL de votre site, par ex. :  
   `https://plateforme-xxx.vercel.app`  
   (ou votre nom de domaine personnalisé si vous l’ajoutez).
3. Redéployez : **Deployments** → ⋮ sur le dernier déploiement → **Redeploy**.

Sans cette URL correcte, la connexion (NextAuth) peut échouer en production.

## 6. (Optionnel) Domaine personnalisé

Dans **Settings** → **Domains**, ajoutez votre domaine (ex. `app.iatask.fr`) et suivez les instructions pour configurer le DNS (enregistrement CNAME vers Vercel).

---

## Résumé des commandes (local)

```bash
# Générer une clé pour NEXTAUTH_SECRET
openssl rand -base64 32
```

Après déploiement, testez : connexion, formulaire de contact, dashboard.
