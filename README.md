# Kilani Groupe - Plateforme RH

Application web professionnelle de gestion des ressources humaines pour Kilani Groupe.

## Fonctionnalités

### Module Recrutement
- Expression et validation des demandes de recrutement
- Circuit de validation hiérarchique (Manager → Directeur → DRH → DAF → DGA → DG)
- Gestion des offres d'emploi
- Base de données centralisée des candidats
- Suivi complet des candidatures

### Module Évaluation
- Gestion des évaluations de fin de période d'essai
- Évaluation de fin de contrat
- Circuit de validation automatique
- Déclenchement automatique à J-30 de la date d'échéance

### Tableau de Bord
- Statistiques en temps réel
- Taux de réalisation du plan emploi
- Suivi des délais de traitement
- Répartition par motif/direction/site

## Technologies

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Base de données et authentification)

## Configuration

1. Configurez vos variables d'environnement dans le fichier `.env`:
```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

2. Installez les dépendances:
```bash
npm install
```

3. Lancez l'application en mode développement:
```bash
npm run dev
```

4. Créez un compte utilisateur via Supabase Auth

5. Ajoutez un profil dans la table `profiles` avec le rôle approprié

## Structure des rôles

- **Manager**: Créer des demandes de recrutement et évaluations
- **Director**: Valider les demandes de son département
- **DRH**: Gérer les offres d'emploi et candidatures
- **DAF**: Validation financière
- **DGA**: Validation de direction générale adjointe
- **DG**: Validation finale du directeur général

## Circuit de validation

### Recrutement
Manager → Director → DRH → DAF → DGA → DG

Délai: 48h par niveau avec rappel automatique

### Évaluation
Manager → Director (N+2) → DRH → DAF → DGA → DG

Délai: 48h par niveau avec rappel automatique

## Design

L'interface utilise une palette de couleurs professionnelle:
- Vert émeraude pour le recrutement
- Bleu pour les évaluations
- Dégradés subtils pour une apparence moderne
- Images de stock depuis Pexels pour l'esthétique

---

© 2026 Kilani Groupe - Tous droits réservés
