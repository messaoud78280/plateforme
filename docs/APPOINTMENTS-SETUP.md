# Calendrier de rendez-vous (Calendly)

## Migration base de données

Pour activer le calendrier, exécuter le fichier SQL dans Supabase :

1. Ouvrir **Supabase** → votre projet → **SQL Editor**
2. Coller le contenu de `prisma/migrations/appointments.sql`
3. Exécuter

Puis regénérer le client Prisma :

```bash
npx prisma generate
```

## Fonctionnalités

- **Calendrier mensuel** : sélection d'une date
- **Créneaux disponibles** : 9h-18h, créneaux de 30 min
- **Pièces jointes** : PDF, images, Word, Excel (via Supabase Storage)
- **Notes et commentaires**
- **Récurrence** : hebdomadaire, bi-hebdomadaire, mensuel
- **Alertes** : chaque nouveau RDV crée une alerte dans la messagerie
- **Rappels** : badge « Rappel » pour les RDV dans les 24h
