# Architecture multi-plateformes BeWork

> BeWork n’est plus une plateforme unique personnalisée à la main.
> BeWork est un **éditeur de plateformes métier BTP** : socle commun + configurations indépendantes.

Document de référence — **PLATFORM-ISOLATION-V1**.

---

## Objectif business

Concevoir des plateformes internes sur mesure pour les entreprises :

1. partir d’un socle commun (CORE)
2. activer des modules / features
3. personnaliser branding, navigation, personas démo
4. ajouter des solutions IA activables
5. faire évoluer un client **sans modifier les autres**

---

## Trois niveaux

### NIVEAU 1 — CORE COMMUN

Briques partagées volontairement :

- Messagerie, Agenda, Planning, Chantiers, Tâches
- GED / Documents, Commandes, Facturation, À traiter
- Notifications, Permissions, Assistant IA (catalogue)

**Règle :** une amélioration CORE volontaire bénéficie à toutes les plateformes qui utilisent ce module.

**Interdit dans le CORE :**

- nom client en dur (`SETRIM`, `Denis Buret`, logo SETRIM)
- fallback `DEMO_BRAND` dans un composant multi-tenant
- `if (companyName === "SETRIM")` pour du comportement

### NIVEAU 2 — CONFIGURATION PAR ORGANISATION

Résolue via `getPlatformConfigForOrganization` / `getCurrentPlatformConfig`
(`src/lib/platform/config.ts`) à partir de :

- `organizationId`
- `isDemo`
- `companyName` / `logoUrl` (affichage, pas clé de comportement)
- `platformKey` explicite (futur / tests)

Contient notamment :

| Champ | Rôle |
|--------|------|
| `key` | `bework_internal` · `setrim` · `client_test` · `generic_demo` |
| `branding` | nom, logo, libellé secondaire |
| `demoMode` | environnement démo |
| `internalPlatform` | BeWork interne |
| `commercialDemo` | tour commercial / scénario vente |
| `features` | modules / outils IA filtrables |

**Exemples :**

- **BeWork interne** — branding BeWork, pas de « Voir comme », pas de tour commercial SETRIM
- **SETRIM** — logo SETRIM, personas Denis/Julie/Karim/Sophie/Thomas, tour commercial
- **Client Test** (fixture) — features réduites, sans polluer l’UI commerciale

`DEMO_BRAND` / `SETRIM_DEMO_BRAND` = **template de création** SETRIM uniquement.
Runtime UI = PlatformConfig + `DemoEnvironment` (org-scopé).

### NIVEAU 3 — DÉPLOIEMENT DÉDIÉ (optionnel, futur)

Pour certains gros clients :

- instance dédiée
- base dédiée
- domaine dédié

**Pas nécessaire pour chaque client.** Non implémenté en V1.
L’isolation multi-tenant actuelle (une DB, `organizationId`) suffit si les mutations restent scopées.

---

## Règle de développement (obligatoire)

| Type de changement | Impact |
|--------------------|--------|
| **CORE CHANGE** | Volontaire — peut toucher toutes les plateformes utilisant le module |
| **PLATFORM CONFIG CHANGE** | Uniquement l’organisation / `platformKey` concerné |
| **CLIENT CUSTOM FEATURE** | Activée seulement pour les orgs qui ont le flag / outil |

---

## Isolation des données

- `DemoEnvironment` ↔ `Organization` (1:1)
- Reset / seed / enrich : toujours `demoId` → `organizationId` / `rootUserId`
- Interdit : `deleteMany` / `updateMany` / replace global sans scope org
- Interdit : migrer ABC→SETRIM ou Marc→Denis hors org SETRIM

Tables souvent scopées directement : `Project`, `PurchaseOrder`, `AgendaEvent`, `FollowUpSheet`, …
Sinon dérivable via relations (`Task` → projet / client, `Notification` → user → org).

**Aucune migration Prisma dans cette passe.** Si un jour `platformKey` doit vivre en DB : proposer une migration dédiée, ne pas l’appliquer sans validation.

---

## Helpers

```ts
getPlatformConfigForOrganization({ organizationId, isDemo, companyName, logoUrl, platformKey })
getCurrentPlatformConfig(...)
isInternalBeworkPlatform(config)
isCommercialDemoPlatform(config)
isSetrimPlatform(config)
resolveHostCompanyLabel(orgName) // neutre — jamais « SETRIM » en fallback
getDemoPersonasForPlatform(platformKey, hostCompany)
```

---

## Tests

- `scripts/test-platform-isolation-v1.ts` — configs distinctes, pas de fuite SETRIM hors démo SETRIM, fixtures Client Test
- Tests manuels croisés : reset SETRIM ≠ impact BeWork ; donnée BeWork ≠ impact SETRIM

---

## Périmètre V1 vs hors scope

**Corrigé / consolidé :** branding runtime, fallbacks CORE, PlatformConfig, personas par plateforme, reset/seed scopés, tour commercial lié à `commercialDemo`, doc.

**Hors scope :** refonte ACL, Supabase, DB par client, multi-repos, migration Prisma, LLM, moteurs métier.
