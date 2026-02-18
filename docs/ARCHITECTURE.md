# Architecture de la plateforme Client–Agence

## Stack technique

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend** : Next.js API Routes, Prisma 7, PostgreSQL (Supabase)
- **Auth** : NextAuth.js (credentials)
- **Stockage fichiers** : Supabase Storage

---

## Structure des dossiers

```
src/
├── app/
│   ├── layout.tsx                 # Layout racine (fonts, Providers)
│   ├── page.tsx                    # Page d'accueil / redirection
│   ├── globals.css                 # Design system (variables CSS)
│   ├── connexion/
│   │   └── page.tsx
│   ├── inscription/
│   │   └── page.tsx
│   └── dashboard/
│       ├── layout.tsx              # Header + sidebar + auth guard
│       ├── page.tsx                # Tableau de bord (KPIs, activité, alertes, graphique)
│       ├── documents/
│       │   ├── page.tsx
│       │   └── DocumentsPageClient.tsx
│       ├── taches/                 # Phase 1 : liste + détail
│       │   ├── page.tsx            # Liste des tâches (vue liste)
│       │   └── [id]/
│       │       └── page.tsx        # Détail d'une tâche
│       ├── projets/               # Projets (conteneurs) + messages
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── messages/
│       │   └── page.tsx
│       ├── rapports/              # Phase 3
│       │   └── page.tsx
│       └── parametres/            # Phase 3
│           └── page.tsx
│
├── components/
│   ├── common/                    # Composants UI réutilisables
│   │   ├── buttons/
│   │   │   ├── PrimaryButton.tsx
│   │   │   └── IconButton.tsx
│   │   ├── cards/
│   │   │   ├── Card.tsx
│   │   │   └── StatCard.tsx
│   │   ├── feedback/
│   │   │   ├── Alert.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   └── layout/
│   │       ├── Container.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── dashboard/
│   │   ├── DashboardKPIs.tsx      # 4 KPIs cliquables
│   │   ├── ActivityTimeline.tsx   # 5 dernières actions
│   │   ├── AlertsSection.tsx      # Alertes urgentes
│   │   └── TasksChart.tsx         # Graphique 7 jours
│   │
│   ├── documents/
│   │   ├── DocumentUploadZone.tsx # Drag & drop + progress
│   │   ├── DocumentCard.tsx       # Card document + actions
│   │   ├── DocumentFilters.tsx    # (à enrichir) Filtres
│   │   └── DocumentPreviewModal.tsx # (Phase 2)
│   │
│   ├── tasks/                     # Phase 1 + 2
│   │   ├── TaskListView.tsx       # Tableau liste
│   │   ├── TaskCard.tsx           # Ligne ou card tâche
│   │   ├── TaskDetailView.tsx     # En-tête, infos, timeline
│   │   ├── TaskTimeline.tsx       # Historique statuts
│   │   └── TaskKanbanBoard.tsx    # Phase 2
│   │
│   ├── messages/                  # Phase 2
│   │   ├── ConversationList.tsx
│   │   ├── ChatWindow.tsx
│   │   └── MessageBubble.tsx
│   │
│   ├── notifications/            # Phase 2
│   │   ├── NotificationBell.tsx
│   │   └── NotificationDropdown.tsx
│   │
│   ├── CreateProjectForm.tsx
│   ├── LogoutButton.tsx
│   ├── MessageForm.tsx
│   └── Providers.tsx
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── supabase.ts
│   └── utils.ts
│
├── hooks/                         # Hooks personnalisés
│   ├── useDocuments.ts            # Fetch documents + filtres
│   ├── useTasks.ts                # Fetch tasks
│   └── useDebounce.ts
│
├── types/
│   ├── index.ts                   # Types partagés (Task, Document, etc.)
│   └── next-auth.d.ts
│
└── app/api/
    ├── auth/
    │   ├── [...nextauth]/route.ts
    │   └── inscription/route.ts
    ├── documents/
    │   ├── route.ts               # GET, POST
    │   ├── upload/route.ts
    │   └── [id]/route.ts          # GET, PUT, DELETE
    ├── tasks/
    │   ├── route.ts               # GET, POST
    │   └── [id]/
    │       ├── route.ts           # GET, PUT, DELETE
    │       └── status/route.ts    # PATCH statut
    ├── projets/
    │   └── route.ts
    └── messages/
        └── route.ts
```

---

## Cartographie des composants (brief → code)

| Brief | Fichier / composant |
|-------|----------------------|
| **Dashboard** | |
| Carte de bienvenue | `dashboard/page.tsx` (titre + nom) |
| 4 KPIs | `DashboardKPIs.tsx` |
| Activité récente | `ActivityTimeline.tsx` |
| Alertes | `AlertsSection.tsx` |
| Graphique 7 jours | `TasksChart.tsx` |
| **Documents** | |
| DocumentUploadZone | `DocumentUploadZone.tsx` |
| DocumentCard | `DocumentCard.tsx` |
| DocumentFilters | À intégrer dans `DocumentsPageClient` |
| **Tâches (Phase 1)** | |
| Liste tâches (vue liste) | `dashboard/taches/page.tsx` + `TaskListView` |
| Détail tâche | `dashboard/taches/[id]/page.tsx` + `TaskDetailView` |
| TaskTimeline | `TaskTimeline.tsx` (historique statuts) |
| **Phase 2** | TaskKanbanBoard, TaskCard drag, Notifications, Messagerie |
| **Phase 3** | Rapports, Paramètres, Calendrier |

---

## Routes et navigation

| Route | Description |
|-------|-------------|
| `/` | Accueil (redir. selon auth) |
| `/connexion` | Connexion |
| `/inscription` | Inscription |
| `/dashboard` | Tableau de bord |
| `/dashboard/documents` | Mes documents |
| `/dashboard/taches` | Mes tâches (liste) |
| `/dashboard/taches/[id]` | Détail tâche |
| `/dashboard/projets` | Projets |
| `/dashboard/projets/[id]` | Détail projet + messages |
| `/dashboard/messages` | Messagerie (liste conversations) |
| `/dashboard/rapports` | Rapports (Phase 3) |
| `/dashboard/parametres` | Paramètres (Phase 3) |

---

## API Endpoints

| Méthode | Route | Rôle |
|---------|-------|------|
| GET/POST | `/api/documents` | Liste / création |
| POST | `/api/documents/upload` | Upload fichier |
| GET/PUT/DELETE | `/api/documents/[id]` | Détail / mise à jour / suppression |
| GET/POST | `/api/tasks` | Liste / création tâches |
| GET/PUT/DELETE | `/api/tasks/[id]` | Détail / mise à jour / suppression |
| PATCH | `/api/tasks/[id]/status` | Changement statut |
| GET/POST | `/api/projets` | Projets |
| GET/POST | `/api/messages` | Messages |

---

## État et data fetching

- **Auth** : session NextAuth (getServerSession côté serveur).
- **Listes (documents, tâches)** : fetch serveur dans les pages + actions serveur pour mutations (revalidation).
- **Phase 2+** : React Query (TanStack Query) pour cache et optimistic updates si besoin.
- **Store global** : non requis pour le MVP ; état local + URL (filtres en query params).

---

## Phases MVP (rappel)

- **Phase 1** : Auth, layout, dashboard, documents (upload + liste), tâches (liste + détail).
- **Phase 2** : Kanban tâches, notifications, messagerie, filtres avancés.
- **Phase 3** : Rapports, paramètres, calendrier, export.
- **Phase 4** : Polish, mode sombre, onboarding.
