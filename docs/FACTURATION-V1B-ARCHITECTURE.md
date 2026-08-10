# FACTURATION-V1B — Architecture (plan uniquement)

> Document de préparation. **Aucune migration appliquée.**
> Prérequis livré : FACTURATION-V1A-LITE (anti-oubli FollowUp / `BILLING_PENDING`).

## Objectif V1B

Passer de :

> « Qu’est-ce qui risque d’être oublié ? »

à :

> « Combien reste à facturer / à encaisser / en retard ? »

Sans transformer BeWork en logiciel de comptabilité générale.

---

## 1. Audit métier cible

| Concept BTP | Besoin | État actuel |
|-------------|--------|-------------|
| Facture | Document client avec échéance + solde | `Invoice` minimal (amount, status, dates) — **0 lignes DEMO** |
| Situation de travaux | Avancement périodique HT | `WorkSituation` riche sous Pilotage — **0 lignes DEMO** |
| Acompte | Type de facture / règlement anticipé | Non typé sur `Invoice` |
| Solde | Facture finale chantier | Non typé |
| Règlement | Encaissement client | `Payment` = **SaaS** ≠ chantier |
| Règlement partiel | Plusieurs paiements / facture | **Absent** |
| Échéance / retard | dueDate vs now + solde > 0 | Partiel (`dueDate` + `paidDate`) |
| Retenue de garantie | Montant retenu | Présent sur `WorkSituation.retentionHt` seulement |

---

## 2. Principe de modèle

**Ne pas fusionner** Situation et Facture.

- `WorkSituation` = préparation / validation métier (pilotage).
- `Invoice` = document de facturation / suivi d’encaissement.

Lien optionnel : `WorkSituation.invoiceId?` (nullable, V1B ou V1C).

---

## 3. Schéma minimal recommandé

### 3.1 Enrichir `Invoice` (existant)

Champs déjà présents à conserver :

- `id`, `projectId`, `invoiceNumber`, `amount`, `status`, `issueDate`, `dueDate`, `paidDate`, `createdAt`

À ajouter (migration future) :

| Champ | Type | Motif |
|-------|------|--------|
| `kind` | enum `ACOMPTE \| SITUATION \| SOLDE \| AUTRE` | Typologie BTP |
| `responsibleUserId` | String? → User | INTERNAL (Julie / Direction) |
| `amountPaid` | Decimal? **calculé ou cache** | Optionnel — préférer SUM(payments) |
| `externalOrganizationId` | String? | Client externe (syndic) |
| `workSituationId` | String? | Lien optionnel |
| `currency` | String @default("EUR") | Cohérence |
| `notes` | String? | Relance / contexte |
| `cancelledAt` | DateTime? | Annulation traçable |

Statuts recommandés (évoluer `InvoiceStatus`) :

`DRAFT` · `TO_SEND` · `SENT` · `PARTIAL` · `PAID` · `OVERDUE`*(dérivé)* · `CANCELLED`

> `OVERDUE` peut rester **calculé** (dueDate < now && balance > 0) plutôt qu’un statut stocké.

### 3.2 Nouveau : `InvoicePayment`

```prisma
model InvoicePayment {
  id          String   @id @default(cuid())
  invoiceId   String
  amount      Decimal  @db.Decimal(14, 2)
  paidAt      DateTime @db.Date
  method      String?  // VIREMENT | CHEQUE | CB | AUTRE
  reference   String?
  note        String?
  createdAt   DateTime @default(now())
  createdById String?

  invoice   Invoice @relation(...)
  createdBy User?   @relation(...)

  @@index([invoiceId, paidAt])
}
```

**Pourquoi une table** : une facture peut avoir plusieurs règlements ; le solde reste calculable.

### 3.3 Solde (helper pur)

```ts
balance = invoice.amount - SUM(InvoicePayment.amount)
```

Helpers partagés (V1B) :

- `getInvoiceBalance(invoice)`
- `getBillingMoneySnapshot(...)` → KPI €
- `evaluateBillingAttention(...)` → codes `INVOICE_OVERDUE`, `PARTIAL_PAYMENT_PENDING`, `FINAL_INVOICE_MISSING` (si données prouvables)

Normalisation vers le board **À traiter** existant (comme PO / FollowUp) — **pas** de second silo.

---

## 4. WorkSituation

Conserver tel quel pour V1B.

Étudier ensuite :

- génération / lien `Invoice` depuis situation validée ;
- pas d’obligation immédiate ;
- retenue de garantie (`retentionHt`) → **documenter seulement** pour V1C si complexité.

---

## 5. Types BTP (enums courts)

```ts
enum InvoiceKind {
  ACOMPTE
  SITUATION
  SOLDE
  AUTRE
}
```

Éviter une usine d’enums (pas de 12 types Chorus dès V1B).

---

## 6. Intégrations futures (après modèle)

| Surface | V1B |
|---------|-----|
| Page Facturation | KPI € cliquables |
| À traiter | cartes `INVOICE_*` |
| Accueil | synthèse € légère |
| Cockpit | à facturer / en retard € |
| Relancer | ouvre Messagerie client (validation humaine) |
| Notifications | **V1C** (après validation métier) |

---

## 7. Migration envisagée (non appliquée)

1. `prisma migrate dev --name facturation_v1b_invoice_payments`
2. Alter `Invoice` + create `InvoicePayment`
3. Index `(projectId, status)`, `(dueDate)`, `(responsibleUserId)`

### Backfill

- Ne pas inventer de montants.
- Seed DEMO SETRIM séparé : 2–3 `Invoice` + 1 paiement partiel sur chantiers existants (Alpha / République), responsable Julie.
- Situations : optionnel si Pilotage DEMO activé.

### Rollback

- Drop `InvoicePayment`
- Drop colonnes ajoutées sur `Invoice`
- V1A-lite (FollowUp) continue de fonctionner indépendamment

### Risques

| Risque | Mitigation |
|--------|------------|
| Confusion `Payment` SaaS vs chantier | Nommer clairement `InvoicePayment` ; ne jamais réutiliser `Payment` |
| Doublon Situation / Invoice | Lien nullable ; UI distincte |
| ACL externes | 403 Facturation ; jamais CLIENT_EXT responsable |
| Perf N+1 | Batch payments par invoiceIds |

---

## 8. ACL V1B

Identique V1A-lite + filtre Conducteur sur `project` assignés si politique confirmée.

---

## 9. Décision attendue avant `migrate deploy`

1. Valider schéma `Invoice` + `InvoicePayment`
2. Valider seed DEMO (montants fictifs crédibles SETRIM)
3. Valider codes attention + seuils policy
4. **GO explicite** migration

---

## 10. Lien avec V1A-lite

V1A reste la couche anti-oubli (statuts fiche + `BILLING_PENDING`).

V1B **ajoute** la couche € sans remplacer V1A.

Une information métier → plusieurs vues (Facturation, À traiter, Accueil, Cockpit).
