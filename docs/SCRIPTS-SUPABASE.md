# Scripts Supabase à exécuter

## Refonte dashboard / Nouvelle demande / Abonnement

**Aucun nouveau script Supabase n’est nécessaire** pour la refonte du dashboard client, de la page Nouvelle demande ou de la page Abonnement. Aucune table ni colonne n’a été ajoutée au schéma de données.

---

## Si vous configurez la base Supabase from scratch

Suivre **`prisma/SUPABASE-SETUP.md`**. Résumé :

### 1. Créer les tables

- **Base vide** : dans Supabase → SQL Editor, exécuter **une seule fois** :
  - **`prisma/supabase-all-tables.sql`**  
  - En cas d’erreurs "already exists", utiliser **`prisma/supabase-all-tables-idempotent.sql`**.

- **Déjà User, Project, Message** : exécuter **`prisma/supabase-add-documents-tasks.sql`**.

### 2. Optionnel (fonctionnalités avancées)

Exécuter dans l’ordre si besoin :

| Script | Rôle |
|--------|------|
| `prisma/supabase-tasks-agents-validation.sql` | Assignation tâches aux agents, notes agence, correction, validation |
| `prisma/supabase-projets-enrichis.sql` | Projets : date souhaitée, deadline, urgence, notes ; Document.projectId |
| `prisma/supabase-projets-assigned-agent.sql` | Agent assigné au projet (Project.assignedToId) |
| `prisma/supabase-tasks-project-id.sql` | Lier une tâche à un projet (Task.projectId) |
| `prisma/supabase-alerts-action-url.sql` | Lien d’action sur les alertes (Alert.actionUrl) |
| `prisma/supabase-documents-task-id.sql` | Document lié à une tâche (Document.taskId) |
| `prisma/supabase-simulation-tables.sql` | Simulation BelleVie (TaskComment, Invoice, Metric, etc.) |

### 3. Après toute exécution SQL

Dans le projet :

```bash
npx prisma generate
```

### 4. Connexion et stockage

- **.env** : `DATABASE_URL` (connection string Supabase, port 6543 pooler recommandé).
- **Stockage** : bucket Supabase **`documents`** + `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` si upload de fichiers.

---

## Si vous utilisez Prisma Migrate / db push

Si vous créez ou mettez à jour la base **uniquement** avec :

- `npx prisma migrate deploy`  
- ou `npx prisma db push`

alors le schéma vient de **Prisma** (fichier `prisma/schema.prisma`). Les scripts SQL Supabase ne sont **pas obligatoires** : ils servent à recréer le même schéma quand on ne passe pas par les migrations (ex. copier-coller dans le SQL Editor Supabase).

---

## Récapitulatif

- **Refonte actuelle (dashboard, nouvelle demande, abonnement)** : **rien à exécuter** côté Supabase.
- **Nouvelle installation** : utiliser `supabase-all-tables.sql` (ou idempotent) puis `npx prisma generate`.
- **Détail** : voir **`prisma/SUPABASE-SETUP.md`**.
