# BeWork — Audit global de la logique métier

> Date : 14 octobre 2026  
> Référence code initiale : `b610077b` (`main`)  
> Nature : diagnostic du code, du schéma Prisma, des routes, services, composants et tests.  
> Production : aucune écriture. Les contrôles Supabase tables, métadonnées et logs ont échoué par timeout ; ils ne sont donc pas considérés comme vérifiés. Les advisors accessibles ne remontaient pas d’alerte.

## Synthèse exécutive

BeWork possède un socle métier réel et largement opérationnel : organisation SaaS, visites, métré calculé, devis commercial versionné, planning, approvisionnements, commandes, documents chantier, situations, factures et encaissements. Le pipeline ChatGPT universel de modification couvre huit sections avec prévisualisation, empreinte anti-obsolescence, transaction et journal.

La faiblesse principale n’est pas l’absence de fonctions, mais la coexistence de sources de vérité et de règles parallèles :

- compte utilisateur, client CRM et client contractuel ne représentent pas toujours la même partie ;
- deux moteurs de devis, deux moteurs de planning, deux registres de situations et plusieurs modèles de comptes rendus coexistent ;
- la continuité visite → métré → devis → planning est mieux contrôlée que la continuité planning/métré → achats → réalisé → rentabilité ;
- plusieurs droits d’écriture chantier sont dérivés d’un simple droit de lecture ;
- la gouvernance des migrations et l’exécution automatique des tests ne garantissent pas que le schéma déployé corresponde au code.

Trois P0 sont confirmés par le code :

1. `plan-source` accepte GET/PATCH/DELETE sur une étude identifiée sans contrôle de tenant.
2. `canModifyChantierProject()` est actuellement équivalent à `canAccessChantierProject()` : un accès externe explicite peut devenir un droit d’écriture sur des données techniques.
3. La suppression d’un compte client peut déclencher des cascades métier massives et supprime le Storage avant de connaître l’issue DB.

Le niveau global est celui d’une plateforme riche mais encore insuffisamment unifiée pour garantir partout qu’un chiffre, un statut ou un document validé a une origine unique et des conséquences maîtrisées.

---

## A. Cartographie métier

### A1. Organisation, utilisateurs et droits

Sources principales :

- `Organization` et `OrganizationMember` portent le tenant SaaS.
- `User.role`, `personType`, `permissionProfile` et `teamRole` portent quatre couches historiques ou fonctionnelles d’autorisation.
- `ProjectAccess.scopesJson` ouvre des scopes externes : messages, documents, agenda et livraisons.
- `src/lib/organization/tenant.ts`, `src/lib/authz.ts`, `src/lib/equipe-acces/project-access.ts` et les modules `access.ts` spécialisés appliquent les droits.

La politique est cohérente dans le domaine commercial, mais non unifiée à l’échelle des routes chantier. Les rôles BeWork transverses sont intentionnellement cross-tenant ; les membres et partenaires doivent rester bornés à leur organisation ou à leurs scopes.

### A2. Clients, prospects et affaires

- `CommercialLead` représente le prospect.
- `ExternalOrganization` et `ExternalOrgContact` représentent le client/fournisseur/partenaire CRM.
- `User` représente encore le propriétaire du tenant et sert aussi de `Project.clientId`.
- `FollowUpSheet` représente un flux de suivi opérationnel, pas une affaire commerciale unifiée.

Le devis commercial référence `clientExternalOrgId`, tandis que le chantier référence un `User`. La création d’un chantier depuis un devis accepté rattache aujourd’hui le chantier au propriétaire de l’organisation, puis l’interface reconstruit le libellé client par plusieurs chemins. L’identité du donneur d’ordre du chantier n’est donc pas une relation directe et unique.

### A3. Chantier

`Project` est la racine opérationnelle. Il porte l’organisation, l’adresse, les statuts, les responsables et les liens vers les domaines aval. `ProjectScope` structure les lots/périmètres et conserve des références de baseline vers étude, devis et planning.

Deux statuts coexistent :

- `Project.status`, historique et générique ;
- `Project.chantierStatus`, cycle ETUDE → EN_COURS → EN_ATTENTE → RECEPTION → TERMINE.

Le helper `projectLifecycleWrite()` réduit les divergences, mais les deux champs restent une dette de modèle.

### A4. Visite et préparation

`SiteVisit`, ses mesures, médias et informations manquantes constituent le relevé terrain. `computeMeasurement()` calcule les quantités avec coefficients, pertes et déductions. Une empreinte détecte les changements postérieurs à la génération du métré.

La création de métré depuis une visite est opérationnelle via contexte ChatGPT et bundle. Elle n’est cependant pas un mapping déterministe ligne à ligne : ChatGPT transforme les mesures, puis une baseline et une empreinte contrôlent les changements ultérieurs.

### A5. Métré

`PrepStudy`, `PrepParameter` et `PrepTakeoffLine` forment la source du métré. Le moteur :

- parse les formules sans `eval` ;
- résout les dépendances ;
- calcule sans arrondi intermédiaire ;
- distingue quantité déclarée, calculée et validée ;
- incrémente `PrepStudy.version` lors des mutations ;
- garde une quantité validée pour la décision humaine.

Le métré est l’un des domaines les plus structurés, mais il ne conserve pas un snapshot complet reconstructible à chaque version.

### A6. Bibliothèques et ressources

Les bibliothèques `CommercialWorkItem`, composants, matériaux et prix alimentent le chiffrage commercial. D’autres familles (`WorkItem`, `SiteResource`, ressources chantier) restent actives pour des usages historiques ou distincts.

Une ressource chantier et un produit fournisseur ne sont pas confondus dans le modèle, mais les unités, alias et classifications sont normalisés par plusieurs helpers concurrents.

### A7. Devis et étude de prix

Le domaine de référence est `CommercialQuote` :

- `CommercialQuoteVersion` porte les versions ;
- `currentVersionId` désigne la version de travail ;
- `acceptedVersionId` désigne la version contractuelle acceptée ;
- `lockState` fige les versions envoyées et acceptées ;
- `money.ts` calcule ligne, TVA, TTC, coûts et marges en centimes.

Le domaine legacy `QuoteProject` / `QuoteDocument` / `QuoteLine` utilise un autre moteur financier. Il n’est pas relié aux ponts métré, aux snapshots acceptés ni au tenant commercial de la même manière.

Le statut commercial `VALIDATED` reste modifiable tant que le devis n’est pas envoyé. Le verrou contractuel réel intervient à `SENT`, puis à `ACCEPTED`.

### A8. Planning et ressources

`PrepSchedulePlan`, ses tâches, dépendances, liens métré/devis et snapshot de domaine constituent le planning chantier.

Deux voies existent :

- moteur historique `computeSchedule`, avec nivellement de ressources ;
- domaine V2 `schedule-domain`, avec snapshot typé, verrou transactionnel et calcul distinct.

`resolveCurrentSchedulePlan()` est le resolver canonique de lecture. Aucune contrainte DB commune ne garantit cependant un unique `CURRENT`, et certains chemins historiques utilisent encore d’autres heuristiques.

Le suivi d’exécution est porté sur les mêmes tâches planning par `executionStatus`, avancement, dates réelles, blocages, photos et réserves.

### A9. Approvisionnements et achats

La chaîne persistée comprend :

- `MaterialRequirement` pour le besoin ;
- `SupplyOffer` pour les offres ;
- `selectedOfferId` pour le choix humain ;
- `PurchaseOrder` et lignes pour la commande ;
- `PurchaseOrderReceiptLine` pour la réception réelle ;
- événements agenda dérivés des dates de livraison.

Les quantités déjà commandées sont protégées contre une réécriture silencieuse. Une modification du métré marque une dérive et propose une décision humaine. Les offres conservent un historique de prix ; une offre retenue ou utilisée par un bon de commande n’est pas supprimable.

La création automatique des besoins depuis le métré/planning n’est pas opérationnelle. Les liens planning sont des identifiants JSON sans clé étrangère.

### A10. Exécution, suivi et clôture

Trois familles coexistent :

- `FollowUpSheet` pour les flux opérationnels et administratifs ;
- tâches de planning pour l’avancement réel ;
- `WorksitePilotage*` pour DOE, non-conformités, retards, travaux supplémentaires, jalons et situations manuelles.

La clôture n’est pas orchestrée par une règle unique reliant réception, DOE, situation finale, retenue de garantie et archivage.

### A11. Finance

Le domaine `Commercial*` est la source financière la plus fiable :

- situations calculées ;
- factures, acomptes, avoirs et retenues ;
- paiements et reste à encaisser ;
- tableaux de bord commerciaux.

La rentabilité chantier utilise :

- `ProjectBudget` pour le prévu ;
- bons de commande pour l’engagé ;
- factures fournisseur ou réceptions valorisées pour le réalisé achat ;
- devis accepté et avenants pour le marché ;
- factures et paiements pour facturé/encaissé.

La main-d’œuvre réelle est absente. Sans budget, la somme de plusieurs devis acceptés peut gonfler le CA marché. `actualIncomplete` est actuellement toujours vrai.

### A12. Documents

- `ChantierFile` est la GED.
- `SiteDocument` porte CR, notice et PPSPS structurés.
- `PilotageMarketDocument` versionne les pièces marché du module pilotage.
- `Report` et `PilotageReport` restent deux registres parallèles.

`SiteDocument.versionNumber` n’évolue pas avec chaque modification de contenu ; une empreinte de contenu est utilisée pour les imports ChatGPT. Les transitions de statut sont des chaînes libres et un document finalisé peut encore être modifié ou supprimé par les routes actuelles.

---

## B. État de fonctionnement

### Opérationnel

- organisations, membres et invitations ;
- CRM commercial, devis versionnés et snapshots acceptés ;
- visites et calcul des relevés ;
- moteur de métré, validation et version optimiste ;
- pont métré → devis avec traçabilité des quantités ;
- planning et détection d’obsolescence ;
- besoins, offres, commandes et réceptions ;
- situations commerciales, factures et encaissements ;
- pipeline ChatGPT universel de modification ;
- GED et documents chantier structurés ;
- alertes de dérive visite → métré et métré/devis → planning/approvisionnement.

### Partiel

- identité client du chantier ;
- transformation prospect → client → devis → chantier ;
- tarification du devis créé depuis le métré ;
- unicité réelle du planning courant ;
- génération métré/planning → besoins ;
- suivi réalisé et rentabilité complète ;
- versioning des documents chantier ;
- clôture réception/DOE/finance ;
- tests automatisés de routes et chaîne achat.

### Incohérent

- droit de modification chantier identique au droit de lecture ;
- compteurs du snapshot facturation branchés sur `Invoice` et `WorkSituation` au lieu du domaine commercial ;
- situations pilotage et situations commerciales sans réconciliation ;
- travaux supplémentaires pilotage sans lien avec avenant commercial ;
- plusieurs familles d’unités et deux moteurs financiers ;
- statuts « Validé », « Prêt » et verrou contractuel non équivalents ;
- dépendances planning stockées à la fois en JSON et en table.

### Absent

- affaire commerciale unifiée ;
- pointage de main-d’œuvre réelle ;
- consommation matière chantier ;
- avancement physique unique alimentant planning, situations et rentabilité ;
- révision globale versionnée du dossier ;
- CI obligatoire et stratégie de migration unique ;
- undo universel du pipeline ChatGPT.

---

## C. Logique transversale et propagation

### C1. Visite → métré

La visite fournit mesures et hypothèses au contexte de création. Le métré résultant porte sa propre version. Une baseline et une empreinte détectent les changements de visite. La propagation est assistée et validée, pas automatique.

### C2. Métré → devis

`PrepQuoteTransfer` et `PrepQuoteLink` conservent version d’étude, ligne source, quantité transférée et ligne devis. Les changements sont détectés et la revalidation reste humaine.

Faiblesse : les lignes créées par le pont portent par défaut des prix nuls. C’est acceptable pour préparer un chiffrage, mais pas pour émettre un devis facturable sans avertissement bloquant. Une ligne explicitement gratuite doit rester distinguable d’une ligne non chiffrée.

### C3. Métré/devis → planning

Le planning conserve `studyVersionAtGeneration`, liens métré/devis et snapshot. Les dérives sont signalées. Le recalcul n’écrase pas automatiquement un planning validé.

Faiblesse : deux moteurs et plusieurs statuts de plan peuvent produire des dates ou priorités différentes.

### C4. Planning/métré → approvisionnements

Les besoins portent des codes métré et des identifiants de tâches ; une dérive amont est détectée. Après commande, aucune quantité n’est réécrite silencieusement.

Faiblesse : les besoins ne sont pas systématiquement générés depuis les ressources des ouvrages ou des tâches.

### C5. Achats → rentabilité

Le bon de commande représente l’engagé. La facture fournisseur représente le réalisé ; à défaut, la réception valorisée sert de fallback sans double comptage.

### C6. Suivi → rentabilité

Le suivi d’exécution enrichit les tâches, mais l’avancement physique n’alimente pas encore une source unique de coût réalisé et de situation.

### C7. Devis → facturation

Les situations commerciales génèrent les factures et les paiements alimentent l’encaissé. Les devis acceptés et avenants déterminent le marché. Le registre `WorkSituation` du pilotage n’est pas cette source financière.

### C8. Pipeline ChatGPT

Flux canonique :

`bework_chatgpt_context_v1 → ChatGPT → bework_patch_v1 → analyze/preview → commit`

Garanties présentes :

- opérations annoncées filtrées par capacités réellement commitables ;
- identifiants explicites ;
- version de base ;
- empreinte de preview ;
- transaction ;
- idempotence par `patchId` ;
- protection des sources et des objets contractuels ;
- modes de synchronisation complets ou partiels.

Limites :

- pas d’undo universel ;
- journal incomplet pour une visite autonome sans projet ;
- routes legacy toujours présentes mais écriture désactivée ;
- documentation `docs/BEWORK_PATCH_PROTOCOL_V1.md` en retard sur le code.

---

## D. Anomalies confirmées

### P0 — intégrité ou accès

#### P0-1 — IDOR `plan-source`

Preuve : `src/app/api/prep-studies/[id]/plan-source/route.ts` charge l’étude par `id` après une simple session, puis utilise son `organizationId`. GET expose les candidats GED ; PATCH rattache une source ; le DELETE local détache une source. Aucun `requirePrepApiContext` ne prouve que l’utilisateur appartient au tenant.

Conséquence : lecture ou mutation cross-tenant si un identifiant d’étude est connu.

#### P0-2 — lecture = écriture chantier

Preuve : `canModifyChantierProject()` retourne directement `canAccessChantierProject()`. Ce dernier accepte les accès explicites `ProjectAccess`, y compris les personnes externes. Plusieurs routes mutantes utilisent ce helper ou seulement le helper de lecture.

Conséquence : client externe, fournisseur, sous-traitant ou partenaire peut obtenir un droit trop large sur planning, suivi, lots ou documents.

#### P0-3 — suppression client destructive

Preuve : `DELETE /api/clients/[clientId]` supprime d’abord les fichiers Storage, puis `prisma.user.delete()`. Les relations `User → Project` et `User owner → Organization` utilisent des cascades. Aucun inventaire bloquant complet n’est réalisé.

Conséquence : perte massive de dossiers ou Storage supprimé alors que la DB échoue ; absence de rollback inter-systèmes.

### P1 — incohérences métier majeures

1. Création chantier depuis devis accepté non atomique : création du projet puis mise à jour du devis dans deux opérations.
2. Devis métré avec prix nuls : structure et quantités valides, mais aucune distinction persistée entre prix manquant et gratuit volontaire.
3. Planning courant non garanti en DB ; suivi pouvant rester lié à un plan archivé.
4. Documents finalisés mutables et supprimables ; statuts non validés.
5. Double identité client du chantier.
6. Deux registres de situations et travaux supplémentaires non reliés aux avenants.
7. CA marché de rentabilité pouvant additionner plusieurs devis acceptés sans budget.
8. Snapshot facturation comptant des modèles legacy.
9. Gouvernance migrations fragmentée : SQL Prisma ad hoc, migrations Supabase parallèles et `db push`.
10. Tests nombreux mais non agrégés, exclus du TypeScript principal et absents du build Railway.
11. Sept familles de normalisation d’unités et deux moteurs financiers sans test de parité.
12. Génération automatique des besoins matière absente.

### P2 — amélioration opérationnelle

- statut `VALIDATED` du devis sémantiquement ambigu ;
- conversion lead → client sans dédoublonnage commun ;
- organisation active arbitraire en cas de multi-membership ;
- photos et comptes rendus répartis sur plusieurs registres ;
- NOTICE réutilisant le générateur visuel de compte rendu ;
- lien tâche → besoin stocké sans clé étrangère ;
- `actualIncomplete` non discriminant ;
- absence de tests métier du module purchase-orders.

### P3 — dette

- routes et composants ChatGPT legacy dormants ;
- helpers de résolution tenant et planning dupliqués ;
- documentation d’architecture obsolète ;
- scripts de test liés à des scénarios particuliers ;
- modèles historiques encore exposés dans la navigation ou les KPI.

---

## E. Incohérences architecturales

### E1. Modèles concurrents

- Client : `User` / `ExternalOrganization` / champs libres visite.
- Devis : `CommercialQuote` / `QuoteDocument`.
- Facture : `CommercialInvoice` / `Invoice`.
- Situation : `CommercialProgressStatement` / `WorkSituation`.
- Compte rendu : `SiteDocument` / `PilotageReport` / `Report`.
- Pilotage : `PrepStudy` + planning/suivi / `WorksitePilotage*`.

### E2. Règles dispersées

- droits : `authz`, tenant, chantier, commercial, pilotage, GED, équipe ;
- unités : visite, métré, devis, import, supply, matériaux, commandes ;
- planning courant : resolver canonique, références scope et heuristiques historiques ;
- statuts devis : libellés liste, détail, préparation et verrou réel ;
- migrations : deux dossiers SQL et `db push`.

### E3. Architecture cible progressive

Sans fusion brutale :

1. déclarer pour chaque concept une source primaire et des adaptateurs legacy en lecture ;
2. imposer des façades aux frontières : tenant, unité, argent, planning courant, état documentaire ;
3. ajouter des contrôles de cohérence et d’obsolescence avant de déplacer les données ;
4. mesurer l’usage réel des modèles legacy ;
5. migrer uniquement après inventaire, plan de retour et validation spécifique ;
6. conserver snapshots et validation humaine pour toute conséquence contractuelle.

---

## F. Fonctionnalités manquantes

### Indispensables à la cohérence actuelle

- source directe du client contractuel sur le chantier ;
- unicité contrôlée du planning courant ;
- distinction prix manquant / gratuit volontaire ;
- lien travaux supplémentaires → avenant ;
- rapprochement ou dérivation des situations pilotage depuis les situations commerciales ;
- stratégie de migration et contrôle de schéma au déploiement ;
- chaîne de tests critiques obligatoire.

### Importantes pour l’entreprise

- génération proposée des besoins depuis ouvrages et planning ;
- pointage de main-d’œuvre et coût réel ;
- clôture orchestrée réception/DOE/solde/RG ;
- affaire commerciale unifiée ;
- registre documentaire consolidé ;
- avancement physique unique.

### Avancées

- stock et consommation matière ;
- undo administré du pipeline universel ;
- révision globale du dossier ;
- réconciliation comptable/export expert-comptable ;
- optimisation avancée multi-ressources du planning V2.

---

## G. Corrections réalisées

### Déjà présentes avant cet audit actualisé

- `8d8dbef6` : sélection client imposée à la création chantier pour AGENT.
- `cb9844f5` : contrat QUOTE du pipeline universel aligné sur le commit réel.
- `ba8a6c86` : dérive métré branchée sur les commits approvisionnement.
- `675f7141` / `9e2c8d6c` : résolution du planning courant centralisée pour plusieurs lectures.
- `a6ab2f1a` : accès transverses messagerie, tâches et rapports réduits.
- `aed402ac` : planning V2 et snapshot de domaine.

### Lots de cet audit

À compléter après chaque correction validée avec fichiers, tests, commit, push et déploiement réel.

---

## H. Corrections restantes

Ordre recommandé :

1. P0 `plan-source`.
2. P0 séparation lecture/écriture chantier et inventaire des routes mutantes.
3. P0 suppression client sûre.
4. P1 atomicité devis accepté → chantier.
5. P1 protection planning archivé et document finalisé.
6. P1 distinction ligne non chiffrée / gratuite.
7. P1 correction des KPI branchés sur les modèles legacy.
8. Agrégation des tests et garde de livraison.
9. Décisions d’architecture nécessitant migration.

Aucune migration de données ou de schéma importante ne doit être appliquée dans ces lots sans validation spécifique.

---

## I. Évaluation globale

### Cohérence métier — 6,4 / 10

Nombreux domaines complets, mais concepts client, situations, documents, planning et facturation ont encore plusieurs représentations.

### Continuité des données — 6,2 / 10

Bonne continuité visite/métré/devis/planning et protections post-commande ; ruptures sur besoins automatiques, exécution réelle, travaux supplémentaires et clôture.

### Fiabilité des calculs — 7,3 / 10

Moteur métré et moteur commercial sérieux, centimes financiers et formules tracées. Risques : deux moteurs financiers, unités multiples, prix nuls et absence de tests de parité.

### Qualité des workflows — 6,5 / 10

Les parcours principaux existent, mais les statuts et transitions ne sont pas toujours univoques et les registres concurrents demandent des ressaisies.

### Pipeline ChatGPT — 8,0 / 10

Pipeline MODIFY unifié, prévisualisé, versionné et transactionnel. Limites : undo, visite autonome, code legacy et documentation.

### Robustesse des validations — 6,0 / 10

Bonnes validations locales dans prep/commercial/supply ; faiblesse critique des autorisations chantier et transitions documentaires.

### Exploitabilité en entreprise — 6,6 / 10

Exploitable pour préparer, chiffrer, planifier, commander et facturer ; pilotage économique réel et clôture nécessitent encore des contrôles manuels.

### Maintenabilité — 5,8 / 10

Services métier riches et tests nombreux, mais règles dispersées, migrations non gouvernées, tests non agrégés et modèles legacy actifs.

### Note synthétique — 6,6 / 10

Critères : couverture fonctionnelle 25 %, intégrité/accès 25 %, continuité 20 %, calculs 15 %, tests/déploiement 15 %. Les P0 empêchent une note supérieure malgré la richesse fonctionnelle.

---

## J. Feuille de route

### Immédiat — sécuriser sans migration

- fermer les P0 d’accès et suppression ;
- protéger les documents et plannings archivés ;
- rendre atomiques les écritures multi-objets ;
- empêcher l’émission d’un devis non chiffré sans bloquer le gratuit explicite ;
- corriger les KPI lisant les mauvaises tables ;
- exécuter automatiquement le pack de tests critiques.

### Court terme — définir les sources de vérité

- client contractuel du chantier ;
- planning courant ;
- situation financière ;
- avancement réel ;
- registre de comptes rendus ;
- glossaire des statuts.

### Moyen terme — préparer les migrations

- audit SQL production en lecture seule ;
- inventaire d’usage des modèles legacy ;
- préflight multi-CURRENT, projets sans organisation et acceptedVersion orphelines ;
- migrations réversibles et contraintes après correction des données ;
- stratégie unique d’application et de traçage des migrations.

### Long terme — continuité d’exploitation

- besoins proposés depuis ouvrages/planning ;
- pointage main-d’œuvre ;
- travaux supplémentaires vers avenants ;
- clôture DOE/réception/solde ;
- révision globale du dossier ;
- suivi de consommation et rentabilité finale.

---

## Limites de preuve

- Aucun audit exhaustif des données de production n’a été possible.
- Les éventuels doublons `CURRENT`, projets sans organisation, FK logiques orphelines et écarts de schéma restent à vérifier par SQL lecture seule.
- Aucun parcours navigateur complet multi-persona n’a encore été rejoué dans cette phase diagnostic.
- Les performances et races réelles ne sont déduites que des transactions, contraintes et tests présents.
- Les scripts et sorties visant des chantiers particuliers n’ont pas été utilisés comme preuve globale.
