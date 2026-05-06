# Emails transactionnels via Brevo (API)

La plateforme envoie les emails **uniquement** via l’API officielle **Brevo** (HTTPS), ce qui évite les soucis de ports SMTP bloqués en production.

## Variables d’environnement (Railway)

- `BREVO_API_KEY` : clé API Brevo v3 (format `xkeysib-...`)
- `EMAIL_FROM` : expéditeur visible (ex. `noreply@bework.fr`)
- `EMAIL_FROM_NAME` : nom d’expéditeur (ex. `BeWork`)
- `ADMIN_EMAIL` : destinataire(s) notification nouvelle inscription (emails séparés par virgules)

Optionnel :

- `BREVO_API_TIMEOUT_MS` : timeout en ms (défaut `20000`)

## Où récupérer la clé API Brevo

Brevo → **Transactionnel** → **Email** → onglet **Paramètres de l’API** → générer une **Clé API**.

## Fonctionnalités couvertes

- Email de bienvenue après inscription
- Notification admin lors d’une nouvelle inscription (`ADMIN_NOTIFICATION_EMAIL`)
- Notification nouvelle demande (si activée) : `NEW_TASK_EMAIL_TO` ou emails des comptes `MANAGER`
- Email de contact (formulaire contact) vers `CONTACT_EMAIL`

## Dépannage rapide

Dans les logs Railway, chercher :

- `[Email] Brevo API → envoi` (tentative)
- `[Email] Brevo API ← envoyé` (succès)
- `[Email] Brevo API refus` (erreur HTTP, voir `status`)

