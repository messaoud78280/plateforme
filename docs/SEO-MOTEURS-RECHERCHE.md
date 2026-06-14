# SEO multi-moteurs — BeWork

## Moteurs classiques

| Moteur | Crawler | Configuration BeWork |
|--------|---------|----------------------|
| **Google** | Googlebot | `robots.txt`, sitemap, JSON-LD, Search Console |
| **Bing / Copilot** | Bingbot | Idem + `msvalidate.01` + **IndexNow** |
| **DuckDuckGo** | DuckDuckBot | Index via Bing |
| **Safari / Apple** | Applebot | PWA, manifest, Applebot-Extended (IA) |
| **Yahoo** | Slurp | `robots.txt` + vérif. optionnelle |
| **Yandex** | YandexBot | `robots.txt` + IndexNow + vérif. optionnelle |
| **Baidu / Sogou / Petal** | Baiduspider, Sogou, PetalBot | `robots.txt` allow |
| **Europe** | SeznamBot, MojeekBot, Exabot | `robots.txt` allow |

## Moteurs IA (AEO — Answer Engine Optimization)

BeWork **autorise explicitement** les crawlers IA dans `robots.txt` et publie `/llms.txt` + `/ai.txt`.

| Plateforme | Crawlers autorisés | Fichier signal |
|------------|-------------------|----------------|
| **ChatGPT Search** | GPTBot, OAI-SearchBot, ChatGPT-User | llms.txt, ai.txt |
| **Perplexity** | PerplexityBot, Perplexity-User | idem |
| **Claude** | ClaudeBot, Claude-SearchBot, Claude-User, anthropic-ai | idem |
| **Gemini / Google IA** | Google-Extended, GoogleOther | idem |
| **Copilot** | Bingbot (+ contenu indexé Bing) | IndexNow |
| **Apple Intelligence** | Applebot-Extended | idem |
| **Meta AI** | Meta-ExternalAgent, Meta-ExternalFetcher | idem |
| **Amazon / Alexa** | Amazonbot, Amzn-SearchBot | idem |
| **You.com** | YouBot | idem |
| **Mistral (EU)** | MistralBot, MistralAI-User | idem |
| **DeepSeek** | DeepSeekBot | idem |
| **xAI Grok** | GrokBot, xAIBot | idem |
| **Cohere** | cohere-ai | idem |
| **Common Crawl** | CCBot | idem |

Liste complète : `src/lib/seo-ai-discovery.ts` → `SEO_AI_CRAWLER_USER_AGENTS`.

## Fichiers techniques

- `/robots.txt` — `src/app/robots.ts` (classiques + IA)
- `/sitemap.xml` — `src/app/sitemap.ts`
- `/feed.xml` — flux RSS (blog + accueil)
- `/llms.txt` — index structuré pour assistants IA
- `/ai.txt` — politique d'indexation & pages prioritaires IA
- `/manifest.webmanifest` — PWA / Safari
- `/{INDEXNOW_API_KEY}.txt` — clé IndexNow (si env défini)

## Variables d'environnement (Railway / `.env`)

```env
NEXT_PUBLIC_SITE_URL=https://www.bework.fr
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...
NEXT_PUBLIC_BING_SITE_VERIFICATION=...
NEXT_PUBLIC_YANDEX_SITE_VERIFICATION=...
INDEXNOW_API_KEY=cle-32-caracteres-minimum
```

## Checklist après mise en prod

1. **Google Search Console** — propriété `www.bework.fr`, sitemap, inspection URL.
2. **Bing Webmaster Tools** — sitemap + IndexNow (clé = `INDEXNOW_API_KEY`).
3. Vérifier :
   - `https://www.bework.fr/robots.txt`
   - `https://www.bework.fr/sitemap.xml`
   - `https://www.bework.fr/llms.txt`
   - `https://www.bework.fr/ai.txt`
4. Ping IndexNow après déploiement majeur : `npm run seo:ping-indexnow`
5. [Rich Results Test](https://search.google.com/test/rich-results) sur pages FAQ / missions.

## IndexNow

```bash
npm run seo:ping-indexnow
```

Notifie Bing, Yandex et partenaires des URLs prioritaires (accueil, missions, marchés publics, tarifs, FAQ…).

## Pages exclues de l'index

- `/dashboard/*`, `/connexion`, `/inscription`, `/api/*`, `/communication-digitale`

## Note importante

`robots.txt` est un **signal** d'autorisation, pas un pare-feu. La visibilité dans les moteurs IA dépend aussi du contenu citables (FAQ, JSON-LD, llms.txt), de la notoriété du domaine et du délai d'exploration de chaque plateforme — aucun site ne peut garantir une citation systématique.
