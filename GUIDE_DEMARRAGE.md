# Guide de démarrage - Kilani Groupe RH

## Étape 1: Configuration de Supabase

1. Connectez-vous à votre projet Supabase
2. Les migrations de base de données ont déjà été appliquées
3. Copiez votre URL Supabase et votre clé anonyme
4. Mettez à jour le fichier `.env` avec vos identifiants:
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
   ```

## Étape 2: Créer des utilisateurs

### Via l'interface Supabase:
1. Allez dans Authentication > Users
2. Cliquez sur "Add user"
3. Créez des comptes avec différents rôles

### Ensuite, ajoutez les profils:
1. Allez dans Table Editor > profiles
2. Pour chaque utilisateur créé, ajoutez une ligne avec:
   - `id`: L'UUID de l'utilisateur (copié depuis auth.users)
   - `email`: L'email de l'utilisateur
   - `full_name`: Le nom complet
   - `role`: Le rôle (Manager, Director, DRH, DAF, DGA, DG)
   - `department_id`: ID du département (optionnel)
   - `site_id`: ID du site (optionnel)

## Étape 3: Données de test

Quelques sites et départements ont été créés automatiquement:

### Sites:
- Siège Social - Tunis
- Agence Sfax

### Départements:
- Ressources Humaines
- Technologies de l'Information
- Finance et Comptabilité
- Commercial et Ventes

## Étape 4: Premier test

1. Lancez l'application: `npm run dev`
2. Connectez-vous avec un compte Manager
3. Créez une demande de recrutement
4. Connectez-vous avec un compte Director pour valider
5. Suivez le circuit de validation

## Fonctionnalités clés à tester

### Module Recrutement:
✓ Créer une demande de recrutement
✓ Suivre le circuit de validation
✓ Voir les offres d'emploi générées
✓ Consulter la base de candidats

### Module Évaluation:
✓ Créer une évaluation d'employé
✓ Valider une évaluation en tant que N+2
✓ Suivre le circuit de validation

### Tableau de Bord:
✓ Consulter les statistiques globales
✓ Voir les taux de réalisation
✓ Analyser les délais moyens

## Support

Pour toute question ou problème, contactez l'équipe IT.

---

Bonne utilisation de votre nouvelle plateforme RH !
