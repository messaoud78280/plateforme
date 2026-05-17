# Déployer sur Railway (`npm run deploy`)

## Déblocage en 2 minutes (token projet — le plus fiable)

1. Ouvrez [railway.app](https://railway.app) → projet **plateforme** (www.bework.fr).
2. **Settings** → **Tokens** → **Create project token** (copiez le token).
3. Dans le terminal, à la racine du projet :

```bash
cp railway.deploy.env.example .env.railway
```

4. Éditez `.env.railway` et collez votre token :

```
RAILWAY_TOKEN="votre_token_ici"
```

5. Déployez :

```bash
npm run deploy
```

Le script charge `.env.railway` automatiquement. **Ne commitez jamais ce fichier.**

---

## Connexion classique (session CLI)

```bash
npm run deploy:login
```

Puis :

```bash
npm run deploy
```

Sans navigateur (SSH / terminal distant) :

```bash
npm run deploy:login:browserless
```

---

## Commandes utiles

| Commande | Rôle |
|----------|------|
| `npm run deploy` | Déploie le code actuel |
| `npm run deploy:login` | Connexion Railway (1×) |
| `npm run deploy:logs` | Logs production |

---

## Dépannage

| Erreur | Solution |
|--------|----------|
| `Unauthorized` | Token invalide ou expiré → recréer un project token |
| `Project Token Not Found` | Utilisez un **project token**, pas un account token |
| `No service` | Vérifiez `RAILWAY_SERVICE=plateforme` dans `.env.railway` |
