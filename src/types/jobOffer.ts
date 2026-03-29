// types/jobOffer.ts
export interface JobOffer {
  id: string;
  reference: string;
  title: string;
  description: string;
  profile_required?: string;
  department: string;
  location: string;
  contract_type: string;
  publication_date: string | null;
  application_deadline: string;
  status: 'draft' | 'published' | 'closed' | 'filled' | 'archived';
  salary_min?: number;
  salary_max?: number;
  experience: string;
  level: string;
  remote_work: boolean;
  travel_required: boolean;
  start_date: string;
  benefits: string[];
  required_skills: string[];
  views_count: number;
  applications_count: number;
  request_id?: number;
  created_at: string;
  updated_at: string;
}

export interface JobOfferStats {
  total: number;
  published: number;
  draft: number;
  closed: number;
}

export const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'];
export const EXPERIENCE_LEVELS = ['0-1 an', '1-3 ans', '3-5 ans', '5-8 ans', '8+ ans'];
export const LOCATIONS = ['Charguia 1', 'Jbel Wost', 'Ain Zaghouan', 'Tunis', 'Sfax', 'Sousse'];
export const DEPARTMENTS = ['Direction IT', 'Ressources Humaines', 'Finance & Comptabilité', 'Marketing & Communication', 'Commercial & Ventes', 'Direction Générale', 'Production', 'Logistique', 'Service Client'];

// types/jobOffer.ts
export const PUBLISH_PLATFORMS = [
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: 'Linkedin', 
    description: 'Publication automatique sur votre profil', 
    color: 'blue',
    requiresApi: true
  },
  { 
    id: 'internal', 
    name: 'Intranet', 
    icon: 'Building', 
    description: 'Envoyer par email à tous les collaborateurs', 
    color: 'emerald',
    requiresApi: true
  },
  { 
    id: 'prepare', 
    name: 'Préparer le texte', 
    icon: 'Briefcase', 
    description: 'Générer le texte reformulé à copier manuellement', 
    color: 'amber',
    requiresApi: false
  }
];