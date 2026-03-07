# Déployer sur Railway

## 1. Connexion (une seule fois)

Utilisez le CLI officiel **@railway/cli**. Dans un terminal, à la racine du projet :

```bash
cd /Users/djebailialiabtp/Desktop/plateforme
npx @railway/cli login
```

Ouvrez l’URL affichée dans le navigateur (Safari ou Chrome), connectez-vous à [railway.app](https://railway.app) et validez l’autorisation.

## 2. Lier le projet (première fois)

Si le déploiement indique qu’aucun projet n’est lié, exécutez :

```bash
npx @railway/cli link
```

Choisissez **Create new project** (créer un projet) ou **Link to existing project** (lier un projet existant).

## 3. Déploiement

```bash
npm run deploy
```

## 4. Variables d’environnement

Dans le [dashboard Railway](https://railway.app) → votre projet → **Variables**, ajoutez au minimum :

- `DATABASE_URL` — si vous utilisez la base PostgreSQL Railway (service **Add PostgreSQL** dans le projet)
- `NEXTAUTH_SECRET` — une chaîne aléatoire (ex. `openssl rand -base64 32`)
- `NEXTAUTH_URL` — l’URL de l’app une fois déployée (ex. `https://votre-app.up.railway.app`)

Puis redéployez : `npm run deploy`.

---

**Si ça ne marche pas** : copiez le **message d’erreur exact** affiché dans le terminal après `npm run deploy` et partagez-le pour diagnostiquer.
