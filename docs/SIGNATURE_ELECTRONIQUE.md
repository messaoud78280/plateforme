# Acceptation du contrat – Implémentation (sans prestataire externe)

## 1. Résumé

- **Menu « Mon compte »** : l’entrée **« Contrat »** pointe vers `/contract`.
- **Champs sur `User`** : `contractStatus` (PENDING | SIGNED), `signedAt`, `yousignSignatureRequestId` (conservé en base, non utilisé).
- **Inscription** : nouveau compte avec `contractStatus = PENDING`.
- **Accès dashboard** : les CLIENT sont redirigés vers `/contract` tant que `contractStatus !== "SIGNED"`.
- **Page `/contract`** : affichage du PDF du contrat + bouton **« J'accepte le contrat »**. Au clic, l’API enregistre l’acceptation (SIGNED + date) et l’utilisateur peut accéder au dashboard.

Aucun compte ni clé API externe (Yousign, etc.) : tout est géré sur la plateforme.

---

## 2. Fichiers concernés

| Fichier | Rôle |
|--------|------|
| `prisma/schema.prisma` | Enum `ContractStatus`, champs sur `User` |
| `prisma/migrations/contract-signature.sql` | Migration SQL (Supabase) |
| `src/app/contract/page.tsx` | Page contrat (PDF + bloc acceptation) |
| `src/components/contract/ContractSigningBlock.tsx` | Bouton « J'accepte le contrat » + appel API |
| `src/app/api/contract/accept/route.ts` | POST : met à jour `contractStatus = SIGNED`, `signedAt = now()` |
| `src/app/dashboard/layout.tsx` | Redirection CLIENT vers `/contract` si non signé |
| `src/lib/auth.ts` | `contractStatus` dans session/JWT |
| `src/types/next-auth.d.ts` | Typage session |
| `src/components/dashboard/UserAccountDropdown.tsx` | Lien « Contrat » → `/contract` |

---

## 3. SQL Supabase

Exécuter dans Supabase (SQL Editor) :

```sql
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SIGNED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "contractStatus" "ContractStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yousignSignatureRequestId" TEXT;
```

Pour débloquer les comptes déjà existants :

```sql
UPDATE "User"
SET "contractStatus" = 'SIGNED', "signedAt" = COALESCE("signedAt", "createdAt")
WHERE "contractStatus" = 'PENDING';
```

Puis `npx prisma generate` en local.

---

## 4. Flux utilisateur

1. Inscription → `contractStatus = PENDING`.
2. Connexion → accès dashboard → redirection vers `/contract`.
3. Sur `/contract` : lecture du PDF, clic sur **« J'accepte le contrat »**.
4. `POST /api/contract/accept` met à jour `contractStatus = "SIGNED"` et `signedAt`.
5. La page se rafraîchit, message « Contrat signé » + lien vers le dashboard.
6. L’utilisateur accède au dashboard sans être redirigé vers `/contract`.

---

## 5. PDF du contrat

- Par défaut le site affiche `/contrat-bework.pdf` : placer le fichier dans `public/contrat-bework.pdf`.
- Ou définir la variable d’environnement `CONTRACT_PDF_URL` (URL publique du PDF) si tu préfères héberger le PDF ailleurs.

Aucune autre variable d’environnement n’est nécessaire pour l’acceptation du contrat.
