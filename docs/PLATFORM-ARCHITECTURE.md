# Architecture multi-plateformes BeWork

> BeWork n’est plus une plateforme unique personnalisée à la main.
> BeWork est un **éditeur de plateformes métier BTP** : socle commun + configurations indépendantes.

Document de référence — **PLATFORM-ISOLATION-V1 / V1.1**.

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

**Exemple volontaire :** correction responsive Messagerie → SETRIM + BeWork Internal + Client Test en bénéficient. C’est NORMAL.

**Interdit dans le CORE :**

- nom client en dur (`SETRIM`, `Denis Buret`, logo SETRIM)
- fallback `DEMO_BRAND` dans un composant multi-tenant
- `if (companyName === "SETRIM")` pour du comportement

### NIVEAU 2 — CONFIGURATION PAR ORGANISATION

Résolue via `getPlatformConfigForOrganization` (`src/lib/platform/config.ts`).

#### Identité V1.1 (ordre de priorité)

| Priorité | Signal | Exemple |
|----------|--------|---------|
| 1 | `platformKey` explicite | tests / futur DB |
| 2 | `DemoEnvironment.loginIdentifier` via registre | `bework-demo` → `setrim` |
| 3 | `isDemo` sans login connu | → `generic_demo` (neutre) |
| 4 | `organizationId` + non-démo | → `neutral_client` |
| 5 | session staff sans org client | → `bework_internal` |

**INTERDIT comme clé :** `companyName` / displayName (peut changer sans changer la plateforme).

Registre actuel : `PLATFORM_KEY_BY_LOGIN_IDENTIFIER`  
(`bework-demo` / `setrim` → setrim · `client-test` → client_test).

Pour créer **Client B** : choisir un `loginIdentifier` unique (ex. `client-b`), l’ajouter au registre **seulement** si une config dédiée est nécessaire ; sinon → `generic_demo` neutre.

#### Fallback inconnu

| Cas | Config |
|-----|--------|
| Démo inconnue | `generic_demo` — **jamais SETRIM** |
| Org client inconnue | `neutral_client` — **jamais BeWork interne** |
| Staff BeWork | `bework_internal` |

#### Contenu PlatformConfig

| Champ | Rôle |
|--------|------|
| `key` | `bework_internal` · `setrim` · `client_test` · `generic_demo` · `neutral_client` |
| `branding` | nom, logo, libellé secondaire |
| `demoMode` / `internalPlatform` / `commercialDemo` | modes |
| `features` | modules / `aiTools` |

`DEMO_BRAND` / `SETRIM_DEMO_BRAND` = **template de création** SETRIM uniquement.

### NIVEAU 3 — DÉPLOIEMENT DÉDIÉ (optionnel, futur)

Instance / base / domaine dédiés pour gros clients. **Non implémenté.**

---

## Staff @bework.internal (dette documentée)

Comptes singleton globaux (Lefèvre / Adjaili / Laura) — **legacy SETRIM uniquement**.

- `allowSharedBeworkStaff` / `allowsSharedBeworkInternalStaff` → `true` seulement si `platform.key === "setrim"`
- ACL directe : plus de bypass cross-tenant vers ces emails
- Nouvelle démo Client B : **ne doit pas** appeler `ensureDemoMessagingStaff`

Personas démo : emails `{login}+{suffix}@demo.bework.local` (déjà isolés par login).  
Convention future possible : `julie@setrim.demo.bework.local` — **non migrée** (auth actuelle OK).

---

## Règle de développement

| Type | Impact |
|------|--------|
| **CORE CHANGE** | Volontaire — toutes les plateformes du module |
| **PLATFORM CONFIG CHANGE** | Uniquement l’org / login / platformKey |
| **CLIENT CUSTOM FEATURE** | Orgs avec le flag / outil |

Exemple config : SETRIM active Commandes fournisseurs → BeWork Internal inchangé.

---

## platformKey en DB — verdict V1.1

**NÉCESSAIRE MAINTENANT = NON**

Pourquoi : `loginIdentifier` unique + registre code suffit pour les démos ; `organizationId` isole les données ; displayName n’est plus une clé.

**Migration future proposée (ne pas appliquer sans GO) :**

```prisma
model DemoEnvironment {
  platformKey String? // setrim | client_test | generic_demo | …
}
model Organization {
  platformKey String?
}
```

Backfill : `bework-demo` → `setrim` ; autres démos → `generic_demo`.  
Rollback : colonne nullable. Tests : résolution prioritaire `platformKey` DB > login > fallback.

---

## Tests

- `npm run test:platform-isolation` (V1)
- `npm run test:platform-isolation-v1-1`
- `npx tsx scripts/test-messagerie-direct-acl-v2c5.ts`

---

## Périmètre

**V1.1 :** identité loginIdentifier, fallbacks neutres, staff SETRIM-only, ACL, filtre messagerie BeWork, aiTools filtrés, docs.

**Hors scope :** migration Prisma, refonte ACL globale, LLM, moteurs métier.
