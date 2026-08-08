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

## Relances automatiques (pièces manquantes / échéances)

`POST /api/cron/relances` (header `x-secret` = `RELANCES_CRON_SECRET`) scanne les pièces
manquantes du classeur chantier et les échéances de mission proches, puis notifie client et
BeWork. Idempotent (pas de doublon avant 3 jours).

À planifier ~1×/jour : Railway → **Cron Job** (nouveau service, même repo, commande
`npm run notifications:run-relances`), ou tâche planifiée externe (GitHub Actions, cron-job.org)
appelant l'URL ci-dessus avec le secret.

---

## Anti-oubli fiches (rappels / escalades) — W3-C2B

`POST /api/cron/attention-escalations` (header `x-secret` = `ATTENTION_CRON_SECRET`)
appelle uniquement `processAttentionEscalations` (heure serveur réelle). Pas d’email / push.

### Variables Railway (service web)

| Variable | Description |
|----------|-------------|
| `ATTENTION_CRON_SECRET` | Secret long aléatoire (jamais `NEXT_PUBLIC_*`) |
| `SITE_URL` ou `NEXT_PUBLIC_SITE_URL` | URL canonique (ex. `https://www.bework.fr`) pour le script cron |

### Configuration manuelle Railway

1. Variables → ajouter `ATTENTION_CRON_SECRET` (valeur aléatoire).
2. **New** → **Cron Job** (ou service cron) sur le même projet :
   - Schedule : `0 * * * *` (toutes les heures)
   - Start command : `npm run notifications:run-attention-escalations`
   - Même variables d’environnement que le service web (`ATTENTION_CRON_SECRET`, `SITE_URL` / `NEXT_PUBLIC_SITE_URL`)
3. Alternative HTTP externe : `POST https://www.bework.fr/api/cron/attention-escalations` avec header `x-secret`.

### Test

```bash
curl -X POST "$SITE_URL/api/cron/attention-escalations" \
  -H "x-secret: $ATTENTION_CRON_SECRET" \
  -H "content-type: application/json" \
  -d '{}'
```

Sans secret / mauvais secret → `401`. Logs : chercher `Attention scheduler` dans `npm run deploy:logs`.

---

## Dépannage

| Erreur | Solution |
|--------|----------|
| `Unauthorized` | Token invalide ou expiré → recréer un project token |
| `Project Token Not Found` | Utilisez un **project token**, pas un account token |
| `No service` | Vérifiez `RAILWAY_SERVICE=plateforme` dans `.env.railway` |
