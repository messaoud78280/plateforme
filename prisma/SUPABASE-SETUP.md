# Configuration Supabase – Plateforme Client–Agence

## 1. Base de données (tables)

Deux cas possibles.

### Cas A : Base vide (première fois)

Exécuter **un seul** script :

1. **Supabase** → **SQL Editor** → **New query**
2. Copier-coller le contenu de **`supabase-all-tables.sql`**
3. Cliquer **Run**

Cela crée : `User`, `Project`, `Message`, `Document`, `Task`, `Activity`, `Alert` et tous les types ENUM.

**Si vous avez déjà exécuté une partie des scripts** et que vous voyez *"type UserRole already exists"* (ou *"table already exists"*) : le schéma est déjà en place, **vous n’avez rien à faire**. Sinon, utilisez **`supabase-all-tables-idempotent.sql`** : il crée uniquement ce qui manque et peut être exécuté plusieurs fois sans erreur.

### Cas B : Vous avez déjà User, Project, Message

Si vous avez déjà exécuté `supabase-create-tables.sql` :

1. **Supabase** → **SQL Editor** → **New query**
2. Copier-coller le contenu de **`supabase-add-documents-tasks.sql`**
3. Cliquer **Run**

Cela ajoute : `Document`, `Task`, `Activity`, `Alert` et leurs ENUMs.

---

## 2. Après avoir créé les tables

Dans le projet (terminal) :

```bash
npx prisma generate
```

Cela régénère le client Prisma pour qu’il connaisse toutes les tables.

---

## 3. Connexion (connection string)

- **Supabase** → **Project Settings** → **Database**
- Utiliser l’URL du **Connection pooling** (port **6543**, mode Transaction).
- Dans `.env` :

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[MOT_DE_PASSE]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

En dev, si vous avez des erreurs TLS, vous pouvez lancer les commandes avec :

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run db:push
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run db:seed
```

(ou utiliser les scripts `db:push` / `db:seed` déjà configurés dans `package.json`.)

---

## 4. Stockage (upload de documents)

Pour que l’upload de fichiers fonctionne :

1. **Supabase** → **Storage** → **New bucket**
2. Nom du bucket : **`documents`**
3. Rendre le bucket **Public** (ou configurer les RLS selon vos besoins)
4. Dans **.env** :

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

L’anon key se trouve dans **Project Settings** → **API**.

---

## 5. Vérification

```bash
npm run db:check
```

Affiche le nombre d’utilisateurs et de projets (ou un message si les tables n’existent pas).

---

## 6. Tâches : assignation agents + validation (optionnel)

Pour **assigner des tâches à vos agents**, ajouter des **notes** et **valider ou demander une correction** :

1. **SQL Editor** → exécuter **`prisma/supabase-tasks-agents-validation.sql`**.
2. Cela ajoute sur `Task` : `assignedToId`, `agencyNotes`, `correctionNote`, `validatedAt`.

---

## 7. Enrichissement des projets (optionnel)

Si vous voulez que les clients puissent renseigner **date souhaitée, deadline, urgence, notes** et **joindre des documents** à un projet :

1. **SQL Editor** → exécuter le script **`prisma/supabase-projets-enrichis.sql`**.
2. Cela ajoute sur `Project` : `dateSouhaitee`, `deadline`, `urgency`, `notes`, et sur `Document` : `projectId` (liaison projet ↔ pièces jointes).

---

## 8. Agent en charge du projet (optionnel)

Pour **assigner un agent à un projet** (en plus des tâches) :

1. **SQL Editor** → exécuter **`prisma/supabase-projets-assigned-agent.sql`**.
2. Cela ajoute sur `Project` : `assignedToId` (référence vers un utilisateur rôle AGENCE).

---

## 9. Lier une tâche à un projet (optionnel)

Pour que les clients puissent **rattacher une tâche à un projet** lors du dépôt :

1. **SQL Editor** → exécuter **`prisma/supabase-tasks-project-id.sql`**.
2. Cela ajoute sur `Task` : `projectId` (référence vers `Project`).

---

## 10. Lien d’action sur les alertes (optionnel)

Pour que les alertes « Nouveau message client » affichent un bouton **Voir le projet** (alerte créée quand un client envoie un message à l’agence) :

1. **SQL Editor** → exécuter **`prisma/supabase-alerts-action-url.sql`**.
2. Cela ajoute sur `Alert` : `actionUrl` (TEXT).

---

## 11. Simulation BelleVie (optionnel)

Pour la **simulation TaskFlow Solutions / BelleVie Cosmétiques** (comptes Sophie, Laure Olivie, Amina, projet, timeline) :

1. **SQL Editor** → exécuter **`prisma/supabase-simulation-tables.sql`**.
2. Cela ajoute : `TaskComment`, `Invoice`, `Metric`, colonnes `User` (company, phone), `UserRole` MANAGER, `Activity` (projectId, metadata).
3. Puis dans le terminal : **`npm run db:seed:simulation`** pour créer les utilisateurs et le projet BelleVie.

---

## Récapitulatif des tables

| Table     | Rôle |
|----------|------|
| User     | Comptes (client / agence) |
| Project  | Projets clients (avec deadline, urgence, dates, notes) |
| Message  | Messages liés aux projets |
| Document | Fichiers déposés par les clients (optionnellement liés à un projet) |
| Task     | Tâches administratives |
| Activity | Timeline d’activité (dashboard) |
| Alert    | Alertes / notifications |
