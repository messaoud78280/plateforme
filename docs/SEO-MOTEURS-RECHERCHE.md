# SEO multi-moteurs — BeWork

## Moteurs couverts

| Moteur | Crawler | Configuration BeWork |
|--------|---------|----------------------|
| **Google** | Googlebot | `robots.txt`, sitemap, JSON-LD, Search Console |
| **Bing** | Bingbot | Idem + `msvalidate.01` + **IndexNow** |
| **DuckDuckGo** | DuckDuckBot | Index via Bing |
| **Safari / Apple** | Applebot | `apple-touch-icon`, `appleWebApp`, manifest |
| **Yahoo** | Slurp | `robots.txt` + vérif. optionnelle |
| **Yandex** | YandexBot | `robots.txt` + IndexNow + vérif. optionnelle |
| **Meta / Facebook** | FacebookBot | Open Graph + vérif. domaine optionnelle |
| **X / Twitter** | Twitterbot | Twitter Cards |
| **IA (ChatGPT, Perplexity…)** | GPTBot, PerplexityBot… | `llms.txt` + robots allow |

## Fichiers techniques

- `/robots.txt` — `src/app/robots.ts`
- `/sitemap.xml` — `src/app/sitemap.ts`
- `/feed.xml` — flux RSS (blog + accueil)
- `/manifest.webmanifest` — PWA / Safari
- `/opengraph-image` — image sociale par défaut
- `/llms.txt` — index pour assistants IA
- `/{INDEXNOW_API_KEY}.txt` — clé IndexNow (si `INDEXNOW_API_KEY` défini)

## Variables d’environnement (Railway / `.env`)

```env
NEXT_PUBLIC_SITE_URL=https://www.bework.fr
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...
NEXT_PUBLIC_BING_SITE_VERIFICATION=...
NEXT_PUBLIC_YANDEX_SITE_VERIFICATION=...
NEXT_PUBLIC_YAHOO_SITE_VERIFICATION=...
NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION=...
NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION=...
INDEXNOW_API_KEY=cle-32-caracteres-minimum
```

## Checklist après mise en prod

1. **Google Search Console** — ajouter la propriété `www.bework.fr`, coller le code dans `GOOGLE_SITE_VERIFICATION`, soumettre `sitemap.xml`.
2. **Bing Webmaster Tools** — même procédure + activer IndexNow (clé = `INDEXNOW_API_KEY`).
3. **Yandex Webmaster** (optionnel) — si cible RU/CIS.
4. Vérifier `https://www.bework.fr/robots.txt` et `https://www.bework.fr/sitemap.xml`.
5. Tester une URL : [Rich Results Test](https://search.google.com/test/rich-results).

## IndexNow (ping rapide Bing / Yandex)

Après publication d’articles ou déploiement majeur, appeler depuis un script :

```ts
import { pingIndexNow } from "@/lib/indexnow";
await pingIndexNow(["https://www.bework.fr/blog/mon-article"]);
```

## Pages exclues de l’index

- `/dashboard/*`, `/connexion`, `/inscription`, `/api/*`, `/communication-digitale`
