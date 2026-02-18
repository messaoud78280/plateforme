# Checklist d’intégration – Plateforme Client–Agence

Vérification effectuée à partir du début de notre conversation. Tout est intégré dans le code.

---

## 1. Architecture et structure

| Élément | Statut | Fichier / détail |
|--------|--------|-------------------|
| Doc d’architecture | OK | `docs/ARCHITECTURE.md` |
| Design system (variables CSS) | OK | `src/app/globals.css` (couleurs, typo, espacements, ombres, radius) |
| Types TypeScript partagés | OK | `src/types/index.ts` (Task, Document, enums, labels) |

---

## 2. Schéma Prisma et base de données

| Élément | Statut | Détail |
|--------|--------|--------|
| User, Project, Message | OK | Schéma + SQL `supabase-create-tables.sql` |
| Document, Task, Activity, Alert | OK | Schéma + SQL `supabase-add-documents-tasks.sql` |
| Project : dateSouhaitee, deadline, urgency, notes | OK | Schéma + `supabase-projets-enrichis.sql` |
| Document.projectId | OK | Liaison projet ↔ pièces jointes |
| Task : assignedToId, agencyNotes, correctionNote, validatedAt | OK | Schéma + `supabase-tasks-agents-validation.sql` |
| User.tasksAssigned (relation) | OK | Schéma Prisma |

Scripts SQL présents :  
`supabase-create-tables.sql`, `supabase-add-documents-tasks.sql`, `supabase-all-tables.sql`, `supabase-all-tables-idempotent.sql`, `supabase-projets-enrichis.sql`, `supabase-tasks-agents-validation.sql`.

---

## 3. Navigation et layout

| Élément | Statut | Fichier |
|--------|--------|---------|
| Sidebar : Tableau de bord, Mes tâches, Mes documents, Projets, Messages, Rapports, Paramètres | OK | `src/app/dashboard/layout.tsx` |
| Header avec nom + rôle (Client/Agence) + Déconnexion | OK | Idem |

---

## 4. Tableau de bord

| Élément | Statut | Fichier |
|--------|--------|---------|
| Carte de bienvenue (nom, message client/agence) | OK | `src/app/dashboard/page.tsx` |
| 4 KPIs (tâches en cours, complétées ce mois, docs en attente, temps moyen) | OK | `DashboardKPIs.tsx`, liens vers `/dashboard/taches` et documents |
| Activité récente (5 dernières) | OK | `ActivityTimeline.tsx` |
| Alertes | OK | `AlertsSection.tsx` |
| Graphique évolution tâches (7 jours) | OK | `TasksChart.tsx` |
| Try/catch si tables absentes | OK | `dashboard/page.tsx` |

---

## 5. Tâches (client + agence)

| Élément | Statut | Fichier / API |
|--------|--------|----------------|
| Liste des tâches (vue tableau) | OK | `dashboard/taches/page.tsx`, `TaskListView.tsx` |
| Dépôt de tâche par le client (titre, description, statut EN_ATTENTE) | OK | `DepotTacheForm.tsx`, `POST /api/tasks` (réservé CLIENT) |
| Filtres par statut (agence) | OK | Liens Toutes / En attente / En cours / Terminées |
| Détail tâche | OK | `dashboard/taches/[id]/page.tsx` |
| Agence : Prendre en charge, Marquer terminée, Mettre en attente | OK | `TaskDetailView.tsx`, `PATCH /api/tasks/[id]/status` |
| Assignation à un agent | OK | `TaskDetailView` (select), `PUT /api/tasks/[id]` (assignedToId) |
| Notes pour l’agent (agencyNotes) | OK | Idem (textarea + enregistrer) |
| Valider le travail / Demander une correction | OK | `TaskDetailView`, `PATCH /api/tasks/[id]/validate` |
| Affichage correction + agent assigné (client) | OK | `TaskDetailView.tsx` |
| API liste agents (AGENCE) | OK | `GET /api/agents` |

---

## 6. Documents

| Élément | Statut | Fichier / API |
|--------|--------|----------------|
| Page Mes documents (liste, filtres, pagination) | OK | `dashboard/documents/page.tsx`, `DocumentsPageClient.tsx` |
| Upload (zone drag & drop, progress) | OK | `DocumentUploadZone.tsx`, `POST /api/documents/upload` |
| Liaison document ↔ projet (projectId) | OK | Upload accepte `projectId`, créé avec projet |
| Try/catch si table absente | OK | `documents/page.tsx` (prisma.document check) |

---

## 7. Projets

| Élément | Statut | Fichier / API |
|--------|--------|----------------|
| Liste avec stats (total, en cours, en attente, terminés) | OK | `dashboard/projets/page.tsx` |
| Recherche + filtres par statut | OK | Idem |
| Création projet : titre, description, date souhaitée, deadline, urgence, notes, pièces jointes | OK | `CreateProjectForm.tsx`, `POST /api/projets` |
| Upload fichiers liés au projet après création | OK | FormData avec projectId vers `/api/documents/upload` |
| Détail projet : urgence, dates, notes, pièces jointes | OK | `dashboard/projets/[id]/page.tsx` |
| Cartes avec deadline + badge urgence | OK | Liste projets |

---

## 8. Paramètres

| Élément | Statut | Fichier / API |
|--------|--------|----------------|
| Profil (nom modifiable, email en lecture seule) | OK | `ProfileForm.tsx`, `PATCH /api/me` |
| Changer mot de passe | OK | `ChangePasswordForm.tsx`, `POST /api/auth/change-password` |
| Session (rôle Client/Agence + Déconnexion) | OK | `parametres/page.tsx` |

---

## 9. Rapports

| Élément | Statut | Fichier / API |
|--------|--------|----------------|
| Sélecteur de période (7j, 30j, 3m, 6m, 1an) | OK | `dashboard/rapports/page.tsx` |
| Stats (tâches, terminées, taux, temps moyen, documents) | OK | `ReportsView.tsx`, `GET /api/reports/stats` |
| Graphique évolution (barres) | OK | Recharts dans `ReportsView` |
| Camembert répartition par statut | OK | Idem |
| Tableau récapitulatif | OK | Idem |
| Export PDF | OK | `GET /api/reports/export?format=pdf`, bouton PDF |
| Export Excel (CSV) | OK | `GET /api/reports/export?format=csv`, bouton Excel |
| Helper stats partagé | OK | `lib/reportStats.ts` |

---

## 10. API résumé

| Route | Méthodes | Rôle |
|-------|----------|------|
| `/api/me` | PATCH | Mise à jour nom profil |
| `/api/auth/change-password` | POST | Changement mot de passe |
| `/api/tasks` | GET, POST | Liste (client/agence), création (client uniquement, EN_ATTENTE) |
| `/api/tasks/[id]` | GET, PUT, DELETE | Détail, mise à jour (dont assignedToId, agencyNotes) |
| `/api/tasks/[id]/status` | PATCH | Changement statut |
| `/api/tasks/[id]/validate` | PATCH | Valider / Demander correction (agence) |
| `/api/agents` | GET | Liste des utilisateurs AGENCE |
| `/api/projets` | POST | Création projet (champs enrichis) |
| `/api/documents`, `/api/documents/upload`, `/api/documents/[id]` | GET, POST, etc. | Documents + upload avec projectId |
| `/api/reports/stats` | GET | Stats par période |
| `/api/reports/export` | GET | Export PDF ou CSV |

---

## 11. Connexion agence

| Élément | Statut |
|--------|--------|
| Compte démo agence | Seed : `agence@exemple.com` / `motdepasse123` |
| Indication sur page connexion | Texte « Démo : client@exemple.com / agence@exemple.com — mot de passe : motdepasse123 » |

---

## 12. À faire côté Supabase (si pas déjà fait)

1. Exécuter les scripts SQL dans l’ordre (sans refaire le schéma complet si User/Project/Message existent déjà) :  
   - `supabase-add-documents-tasks.sql`  
   - `supabase-projets-enrichis.sql`  
   - `supabase-tasks-agents-validation.sql`  
2. Créer le bucket Storage **documents** pour les uploads.  
3. `npx prisma generate` après toute modification du schéma.  
4. `npm run db:seed` pour les comptes de démo.

---

**Conclusion :** Toutes les fonctionnalités évoquées depuis le début de la conversation sont présentes dans le code. Si quelque chose ne s’affiche ou ne fonctionne pas, c’est en général un point de base de données (scripts SQL non exécutés) ou d’environnement (`.env`, bucket Supabase).
