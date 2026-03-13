//manager soumettre la demande d'emploi et les détails de la demande
import { useState, useEffect } from 'react';
import { 
  X, Briefcase, Building, Users, DollarSign,  
  FileText, Target, Zap, AlertCircle, CheckCircle, 
  TrendingUp, Globe, Shield,  Award, Sparkles,
  ChevronDown, Search, MapPin, UserMinus,
  RefreshCw, TrendingUp as Growth, FolderPlus,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface RecruitmentCauseDetail {
  mainReason: string;
  subReason?: string;
  description: string;
  impact?: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  relatedPosition?: string;
  documents?: File[];
}

// Listes statiques des postes
const jobTitlesList = [
  // IT & Développement
  'Développeur Full Stack',
  'Développeur Frontend',
  'Développeur Backend',
  'Développeur Mobile',
  'Chef de Projet IT',
  'Data Scientist',
  'Data Analyst',
  'Administrateur Système',
  'DevOps Engineer',
  'Architecte Logiciel',
  'UI/UX Designer',
  'Product Owner',
  'Scrum Master',
  'QA Tester',
  'Cyber Security Analyst',
  
  // RH & Management
  'Responsable RH',
  'Chargé de Recrutement',
  'Gestionnaire de Paie',
  'HR Business Partner',
  'Formateur',
  
  // Finance & Comptabilité
  'Comptable',
  'Contrôleur de Gestion',
  'Directeur Financier',
  'Chef Comptable',
  'Analyste Financier',
  'Auditeur Interne',
  
  // Marketing & Communication
  'Responsable Marketing',
  'Community Manager',
  'Graphiste',
  'Content Manager',
  'SEO Specialist',
  'Marketing Digital',
  'Chef de Produit',
  
  // Commercial & Ventes
  'Commercial',
  'Responsable Commercial',
  'Directeur Commercial',
  'Business Developer',
  'Account Manager',
  "Chargé d'Affaires",
  
  // Direction & Administration
  'Assistant de Direction',
  'Office Manager',
  'Directeur Général',
  'Directeur Administratif',
  
  // Production & Logistique
  'Ingénieur Production',
  "Chef d'équipe",
  'Responsable Logistique',
  'Magasinier',
  'Supply Chain Manager',
  'Planificateur',
  
  // Service Client
  'Conseiller Client',
  'Responsable Service Client',
  'Support Technique',
  'Téléconseiller',
  
  // Stagiaires et Alternants
  'Stagiaire Développement',
  'Stagiaire Marketing',
  'Stagiaire RH',
  'Stagiaire Commercial',
  'Stagiaire Comptabilité',
  'Stagiaire Communication',
  'Stagiaire Design',
  'Alternant Développement',
  'Alternant Marketing',
  'Alternant RH',
  'Alternant Commercial',
  'Alternant Comptabilité',
  
  // CDD Courts / Temporaires
  'CDD Court - Développement',
  'CDD Court - Support',
  'CDD Court - Commercial',
  'CDD Court - Administratif',
  'Intérimaire Production',
  'Intérimaire Logistique',
  'Intérimaire Administratif',
  'Freelance Développement',
  'Freelance Design',
  'Freelance Rédaction',
  'Saisonnier Vente',
  'Saisonnier Support',
  'Saisonnier Production',
  'Auxiliaire Administratif',
  'Assistant Temps Partiel',
  'Aide-comptable Junior',
  'Remplacement Court Terme',
  'Congé Maternité Remplacement',
  'Congé Maladie Remplacement',
  
  // Postes sans impact budgétaire significatif
  'Technicien Niveau 1',
  "Agent d'entretien",
  'Manutentionnaire',
  'Préparateur de commandes',
  'Cariste',
  'Standardiste',
  "Agent d'accueil",
  'Opérateur de saisie',
  'Archiviste',
  'Coursier'
].sort();

// Liste des départements
const departmentsList = [
  'Direction IT',
  'Ressources Humaines',
  'Finance & Comptabilité',
  'Marketing & Communication',
  'Commercial & Ventes',
  'Direction Générale',
  'Production',
  'Logistique',
  'Recherche & Développement',
  'Service Client',
  'Juridique',
  'Achats',
  'Qualité',
  'Communication'
].sort();

// Liste des localisations
const locationsList = [
  // Tunisie
  'Tunis',
  'Sousse',
  'Sfax',
  'Nabeul',
  'Bizerte',
  'Monastir',
  'Gabès',
  'Gafsa',
  'Kairouan',
  'Médenine',
  'Mahdia',
  'Ben Arous',
  'Ariana',
  'Manouba',
  'Jendouba',
  'Le Kef',
  'Siliana',
  'Kasserine',
  'Tozeur',
  'Kébili',
  'Tataouine',
  'Béja',
  'Zaghouan',
  
  // International
  'Paris',
  'Lyon',
  'Marseille',
  'Montréal',
  'Casablanca',
  'Alger',
  'Dubai',
  'Bruxelles',
  'Genève'
].sort();

const contractTypes = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim', 'CDD Court (<3 mois)', 'Saisonnier'];

// Structure améliorée des causes de recrutement
const recruitmentReasons = {
  'Création de poste': {
    icon: FolderPlus,
    color: 'emerald',
    description: 'Nouveau poste lié à une expansion ou une nouvelle activité',
    subReasons: [
      'Nouveau projet/département',
      'Expansion de léquipe',
      'Nouvelle activité',
      'Diversification',
      'Innovation/R&D',
      'Digitalisation'
    ],
    questions: [
      'Quel est le nouveau projet/activité ?'
    ]
  },
  'Remplacement': {
    icon: RefreshCw,
    color: 'amber',
    description: 'Remplacement d\'un collaborateur existant',
    subReasons: [
      'Démission',
      'Départ à la retraite',
      'Mutation interne',
      'Promotion',
      'Fin de contrat',
      'Congé longue durée',
      'Décès'
    ],
    questions: [
      'Qui est remplacé ?',
      'Quelle est la raison exacte du départ ?',
      'Y a-t-il une période de passation prévue ?'
    ]
  },
  'Renforcement équipe': {
    icon: Users,
    color: 'blue',
    description: 'Augmentation de la charge de travail nécessitant des ressources supplémentaires',
    subReasons: [
      'Croissance activité',
      'Nouveaux clients',
      'Surcharge temporaire',
      'Projet spécifique',
      'Saisonnalité',
      'Pic d\'activité'
    ],
    questions: [
      'Quelle est l\'augmentation de charge constatée ?',
      'Quels sont les indicateurs de cette croissance ?',
      'Est-ce une tendance durable ?'
    ]
  },
  'Nouveau projet': {
    icon: Target,
    color: 'violet',
    description: 'Lancement d\'un nouveau projet nécessitant des compétences spécifiques',
    subReasons: [
      'Projet stratégique',
      'Transformation digitale',
      'Innovation produit',
      'Expansion géographique',
      'Nouveau marché',
      'R&D'
    ],
    questions: [
      'Quelle est la durée du projet ?',
      'Quelles sont les compétences spécifiques requises ?',
      'Quel est le budget projet associé ?'
    ]
  },
  'Départ': {
    icon: UserMinus,
    color: 'red',
    description: 'Départ non prévu nécessitant un remplacement rapide',
    subReasons: [
      'Démission imprévue',
      'Départ urgent',
      'Absence longue durée',
      'Licenciement',
      'Fin de période d\'essai'
    ],
    questions: [
      'Quelle est l\'urgence du remplacement ?',
      'Y a-t-il des dossiers critiques en attente ?',
      'Quel est le délai idéal pour le remplacement ?'
    ]
  },
  'Augmentation activité': {
    icon: Growth,
    color: 'green',
    description: 'Croissance soutenue de l\'activité nécessitant des renforts',
    subReasons: [
      'Croissance organique',
      'Nouveaux marchés',
      'Gain de parts de marché',
      'Développement commercial',
      'Nouveaux produits/services'
    ],
    questions: [
      'Quel est le taux de croissance ?',
      'Quels sont les objectifs à atteindre ?',
      'Y a-t-il des KPI spécifiques à respecter ?'
    ]
  },
  'Spécialisation': {
    icon: Award,
    color: 'purple',
    description: 'Besoin d\'une expertise spécifique non disponible en interne',
    subReasons: [
      'Nouvelle technologie',
      'Expertise rare',
      'Compétence stratégique',
      'Certification requise',
      'Veille technologique'
    ],
    questions: [
      'Quelle est l\'expertise recherchée ?',
      'Pourquoi cette compétence n\'est-elle pas disponible en interne ?',
      'Y a-t-il des formations prévues pour l\'équipe ?'
    ]
  }
};

// Circuits de validation par poste
const validationFlowsByJob: Record<string, string[]> = {
  // ===== POSTES AVEC VALIDATION UNIQUEMENT PAR MANAGER =====
  // Stagiaires
  'Stagiaire Développement': ['Manager'],
  'Stagiaire Marketing': ['Manager'],
  'Stagiaire RH': ['Manager'],
  'Stagiaire Commercial': ['Manager'],
  'Stagiaire Comptabilité': ['Manager'],
  'Stagiaire Communication': ['Manager'],
  'Stagiaire Design': ['Manager'],
  
  // Alternants / Apprentis
  'Alternant Développement': ['Manager'],
  'Alternant Marketing': ['Manager'],
  'Alternant RH': ['Manager'],
  'Alternant Commercial': ['Manager'],
  'Alternant Comptabilité': ['Manager'],
  
  // CDD courts / Missions temporaires
  'CDD Court - Développement': ['Manager'],
  'CDD Court - Support': ['Manager'],
  'CDD Court - Commercial': ['Manager'],
  'CDD Court - Administratif': ['Manager'],
  
  // Intérimaires / Temporaires
  'Intérimaire Production': ['Manager'],
  'Intérimaire Logistique': ['Manager'],
  'Intérimaire Administratif': ['Manager'],
  
  // Freelances / Consultants ponctuels
  'Freelance Développement': ['Manager'],
  'Freelance Design': ['Manager'],
  'Freelance Rédaction': ['Manager'],
  
  // Jobs saisonniers
  'Saisonnier Vente': ['Manager'],
  'Saisonnier Support': ['Manager'],
  'Saisonnier Production': ['Manager'],
  
  // Postes à temps partiel / auxiliaires
  'Auxiliaire Administratif': ['Manager'],
  'Assistant Temps Partiel': ['Manager'],
  'Aide-comptable Junior': ['Manager'],
  
  // Remplacements temporaires
  'Remplacement Court Terme': ['Manager'],
  'Congé Maternité Remplacement': ['Manager'],
  'Congé Maladie Remplacement': ['Manager'],
  
  // Postes sans impact budgétaire significatif
  'Technicien Niveau 1': ['Manager'],
  "Agent d'entretien": ['Manager'],
  'Manutentionnaire': ['Manager'],
  'Préparateur de commandes': ['Manager'],
  'Cariste': ['Manager'],
  'Standardiste': ['Manager'],
  "Agent d'accueil": ['Manager'],
  'Opérateur de saisie': ['Manager'],
  'Archiviste': ['Manager'],
  'Coursier': ['Manager'],

  // ===== POSTES OPERATIONNELS / EXECUTION =====
  // Circuit standard : Manager → Directeur → DRH
  'Développeur Full Stack': ['Manager', 'Directeur', 'DRH'],
  'Développeur Frontend': ['Manager', 'Directeur', 'DRH'],
  'Développeur Backend': ['Manager', 'Directeur', 'DRH'],
  'Développeur Mobile': ['Manager', 'Directeur', 'DRH'],
  'Data Analyst': ['Manager', 'Directeur', 'DRH'],
  'QA Tester': ['Manager', 'Directeur', 'DRH'],
  'Commercial': ['Manager', 'Directeur', 'DRH'],
  'Community Manager': ['Manager', 'Directeur', 'DRH'],
  'Graphiste': ['Manager', 'Directeur', 'DRH'],
  'Conseiller Client': ['Manager', 'Directeur', 'DRH'],
  'Téléconseiller': ['Manager', 'Directeur', 'DRH'],
  'Magasinier': ['Manager', 'Directeur', 'DRH'],
  'Comptable': ['Manager', 'Directeur', 'DRH'],
  'Assistant de Direction': ['Manager', 'Directeur', 'DRH'],
  'Formateur': ['Manager', 'Directeur', 'DRH'],
  "Chef d'équipe": ['Manager', 'Directeur', 'DRH'],
  'Planificateur': ['Manager', 'Directeur', 'DRH'],
  'Support Technique': ['Manager', 'Directeur', 'DRH'],

  // ===== POSTES SENIORS / EXPERTS =====
  // Circuit avec DAF (impact budget/salaire plus élevé)
  'Data Scientist': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'DevOps Engineer': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'UI/UX Designer': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'Contrôleur de Gestion': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'Analyste Financier': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'Business Developer': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'Account Manager': ['Manager', 'Directeur', 'DRH', 'DAF'],
  "Chargé d'Affaires": ['Manager', 'Directeur', 'DRH', 'DAF'],
  'Office Manager': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'Ingénieur Production': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'Responsable Logistique': ['Manager', 'Directeur', 'DRH', 'DAF'],
  'Supply Chain Manager': ['Manager', 'Directeur', 'DRH', 'DAF'],

  // ===== POSTES STRATEGIQUES / SENSIBLES =====
  // Circuit avec DG (validation finale par Direction Générale)
  'Chef de Projet IT': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Architecte Logiciel': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Product Owner': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Scrum Master': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Cyber Security Analyst': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Responsable Marketing': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Content Manager': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'SEO Specialist': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Marketing Digital': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Chef de Produit': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Responsable Commercial': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Auditeur Interne': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],
  'Responsable Service Client': ['Directeur', 'DRH', 'DAF', 'DGA/DG'],

  // ===== POSTES DE DIRECTION =====
  // Circuit court : DRH → DAF → DG (pas de manager)
  'Responsable RH': ['DRH', 'DAF', 'DGA/DG'],
  'Chargé de Recrutement': ['DRH', 'DAF', 'DGA/DG'],
  'Gestionnaire de Paie': ['DRH', 'DAF', 'DGA/DG'],
  'HR Business Partner': ['DRH', 'DAF', 'DGA/DG'],
  'Directeur Commercial': ['DRH', 'DAF', 'DGA/DG'],
  'Directeur Financier': ['DRH', 'DAF', 'DGA/DG'],
  'Chef Comptable': ['DRH', 'DAF', 'DGA/DG'],
  'Directeur Administratif': ['DRH', 'DAF', 'DGA/DG'],
  'Administrateur Système': ['DRH', 'DAF', 'DGA/DG'],

  // ===== TOP MANAGEMENT =====
  // Validation uniquement par DG
  'Directeur Général': ['DGA/DG'],
};

// Circuit par défaut pour les postes non listés
const defaultValidationFlow = ['Manager', 'Directeur', 'DRH'];

const skillSuggestions = [
  'React', 'Node.js', 'TypeScript', 'Python', 'Java',
  'AWS', 'Docker', 'Kubernetes', 'Agile', 'Scrum',
  'Management', 'Communication', 'Anglais', 'Projet',
  'Excel', 'PowerPoint', 'Word', 'SAP', 'Salesforce',
  'Photoshop', 'Illustrator', 'Figma', 'WordPress',
  'SEO', 'Google Analytics', 'CRM', 'Gestion d\'équipe'
];

const levelOptions = ['Stagiaire', 'Junior', 'Confirmé', 'Senior', 'Expert', 'Lead'];
const experienceOptions = ['0-1 an', '1-3 ans', '3-5 ans', '5-8 ans', '8+ ans'];

// Composant pour le détail de la cause de recrutement
function RecruitmentCauseDetails({ 
  reason, 
  onDataChange,
  errors
}: { 
  reason: string; 
  onDataChange: (data: any) => void;
  errors: Record<string, string>;
}) {
  const [details, setDetails] = useState<RecruitmentCauseDetail>({
    mainReason: reason,
    subReason: '',
    description: '',
    urgencyLevel: 'medium'
  });

  const reasonConfig = recruitmentReasons[reason as keyof typeof recruitmentReasons];

  useEffect(() => {
    onDataChange(details);
  }, [details, onDataChange]);

  if (!reasonConfig) return null;

  const Icon = reasonConfig.icon;

  const handleChange = (field: keyof RecruitmentCauseDetail, value: any) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mt-6 space-y-6">
      {/* En-tête avec couleur dynamique */}
      <div className={`p-4 rounded-xl bg-${reasonConfig.color}-50 border border-${reasonConfig.color}-200`}>
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg bg-${reasonConfig.color}-100`}>
            <Icon className={`w-6 h-6 text-${reasonConfig.color}-600`} />
          </div>
          <div className="flex-1">
            <h4 className={`text-lg font-semibold text-${reasonConfig.color}-900`}>
              {reason}
            </h4>
            <p className={`text-sm text-${reasonConfig.color}-700`}>
              {reasonConfig.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sous-motif */}
        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            value={details.subReason}
            onChange={(e) => handleChange('subReason', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg ${
              errors.subReason ? 'border-red-300' : 'border-slate-300/70'
            }`}
          >
            <option value="">Sélectionnez un type</option>
            {reasonConfig.subReasons.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          {errors.subReason && (
            <p className="mt-1 text-sm text-red-600">{errors.subReason}</p>
          )}
        </div>

        {/* Niveau d'urgence */}
        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Niveau d'urgence <span className="text-red-500">*</span>
          </label>
          <select
            value={details.urgencyLevel}
            onChange={(e) => handleChange('urgencyLevel', e.target.value as any)}
            className="w-full px-4 py-3 border rounded-lg border-slate-300/70"
          >
            <option value="low">Basse - Pas d'urgence particulière</option>
            <option value="medium">Moyenne - À traiter dans les semaines à venir</option>
            <option value="high">Haute - À traiter rapidement</option>
            <option value="critical">Critique - Urgence absolue</option>
          </select>
        </div>
      </div>

      {/* Questions contextuelles */}
      <div className="p-4 rounded-lg bg-slate-50">
        <div className="flex items-center mb-3 space-x-2">
          <Info className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Questions pour mieux comprendre votre besoin
          </span>
        </div>
        <div className="space-y-4">
          {reasonConfig.questions.map((question, index) => (
            <div key={index}>
              <label className="block mb-2 text-sm text-slate-600">
                {question}
              </label>
              <input
                type="text"
                value={details[`answer${index}` as keyof RecruitmentCauseDetail] || ''}
                onChange={(e) => handleChange(`answer${index}` as any, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg border-slate-300/70"
                placeholder="Votre réponse..."
              />
            </div>
          ))}
        </div>
      </div>

      {/* Description détaillée */}
      <div>
        <label className="block mb-2 text-sm font-medium text-slate-700">
          Description détaillée du besoin <span className="text-red-500">*</span>
        </label>
        <textarea
          value={details.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg ${
            errors.description ? 'border-red-300' : 'border-slate-300/70'
          }`}
          placeholder="Expliquez en détail le contexte, les enjeux, et les attentes spécifiques liées à cette demande..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>
    </div>
  );
}

export default function NewRequestModal({ onClose, onSuccess }: Props) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recruitmentDetails, setRecruitmentDetails] = useState<any>(null);
  const [validationFlow, setValidationFlow] = useState<string[]>([]);
  
  // États pour les recherches
  const [searchJob, setSearchJob] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  // États pour afficher/masquer les dropdowns
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    department: user?.department || '',
    location: '',
    contractType: 'CDI',
    reason: 'Création de poste',
    budget: '',
    requiredSkills: '',
    description: '',
    urgent: false,
    startDate: '',
    replacementName: '',
    replacementReason: '',
    level: 'Junior',
    experience: '1-3 ans',
    remote: false,
    travelRequired: false
  });

  const validationLevels = [
    { level: 'Manager', color: 'bg-emerald-500', icon: Users, description: 'Validation hiérarchique directe' },
    { level: 'Directeur', color: 'bg-blue-500', icon: Building, description: 'Validation direction' },
    { level: 'DRH', color: 'bg-violet-500', icon: Shield, description: 'Validation ressources humaines' },
    { level: 'DAF', color: 'bg-amber-500', icon: DollarSign, description: 'Validation financière' },
    { level: 'DGA/DG', color: 'bg-purple-500', icon: Award, description: 'Validation direction générale' }
  ];

  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
    setFormData(prev => ({
      ...prev,
      startDate: nextMonth.toISOString().split('T')[0]
    }));
  }, []);

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowJobDropdown(false);
      setShowDeptDropdown(false);
      setShowLocationDropdown(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre du poste est requis';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = 'Le département est requis';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'La localisation est requise';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    // Validation des détails de la cause
    if (recruitmentDetails) {
      if (!recruitmentDetails.subReason) {
        newErrors.subReason = 'Le type est requis';
      }
      if (!recruitmentDetails.description) {
        newErrors.description = 'La description détaillée est requise';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);

    try {
      // Déterminer le circuit de validation final
      let finalValidationFlow = validationFlow;
      
      // Si pas de circuit spécifique, déterminer en fonction du type de contrat et du niveau
      if (finalValidationFlow.length === 0) {
        // Cas des postes temporaires/stagiaires
        if (formData.contractType === 'Stage' || 
            formData.contractType === 'Alternance' || 
            formData.contractType === 'Intérim' || 
            formData.contractType === 'CDD Court (<3 mois)' || 
            formData.contractType === 'Saisonnier' ||
            formData.level === 'Stagiaire') {
          finalValidationFlow = ['Manager'];
        } 
        // Cas des postes juniors
        else if (formData.level === 'Junior' || formData.level === 'Confirmé') {
          finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
        }
        // Cas des postes seniors
        else if (formData.level === 'Senior' || formData.level === 'Expert') {
          finalValidationFlow = ['Manager', 'Directeur', 'DRH', 'DAF'];
        }
        // Cas des postes de direction
        else if (formData.level === 'Lead' || formData.title.includes('Directeur') || formData.title.includes('Responsable')) {
          finalValidationFlow = ['DRH', 'DAF', 'DGA/DG'];
        }
        // Circuit par défaut
        else {
          finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
        }
      }

      // S'assurer que le circuit de validation n'est pas vide
      if (finalValidationFlow.length === 0) {
        finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
      }

      // 🔴 CORRECTION: Utiliser les statuts en français comme dans RecruitmentRequestList
      let status = 'En attente';
      let current_validation_level = finalValidationFlow[0];

      // Si circuit simplifié (Manager uniquement), on valide directement
      if (finalValidationFlow.length === 1 && finalValidationFlow[0] === 'Manager') {
        status = 'Validées';
        current_validation_level = 'Validé';
      }

      // Préparer les données pour l'envoi
      const requestData = {
        // Informations de base
        title: formData.title.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        contract_type: formData.contractType,
        
        // Cause du recrutement
        reason: formData.reason,
        reason_details: recruitmentDetails || {},
        
        // Budget et rémunération
        budget: formData.budget ? parseInt(formData.budget, 10) : null,
        
        // Compétences et description
        required_skills: formData.requiredSkills 
          ? formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        description: formData.description.trim(),
        
        // Niveau et expérience
        level: formData.level,
        experience: formData.experience,
        
        // Dates et conditions
        start_date: formData.startDate,
        remote_work: formData.remote || false,
        travel_required: formData.travelRequired || false,
        
        // Urgence et priorité
        urgent: formData.urgent || (recruitmentDetails?.urgencyLevel === 'high' || recruitmentDetails?.urgencyLevel === 'critical'),
        priority: recruitmentDetails?.urgencyLevel || (formData.urgent ? 'high' : 'medium'),
        
        // Informations de remplacement (si applicable)
        replacement_name: formData.replacementName?.trim() || null,
        replacement_reason: formData.replacementReason?.trim() || null,
        
        // Informations créateur
        created_by: user?.id,
        created_by_name: user?.full_name || user?.email,
        created_by_role: user?.role || 'Manager',
        
        // CIRCUIT DE VALIDATION COMPLET
        validation_flow: finalValidationFlow,
        
        // ✅ STATUTS EN FRANÇAIS (corrigé)
        status: status,
        current_validation_level: current_validation_level,
        
        // Métadonnées supplémentaires
        created_at: new Date().toISOString()
      };

      // Log pour le débogage
      console.log('📤 Envoi de la demande de recrutement:', {
        title: requestData.title,
        department: requestData.department,
        validation_flow: requestData.validation_flow,
        status: requestData.status,
        current_level: requestData.current_validation_level,
        isAutoValidated: finalValidationFlow.length === 1 && finalValidationFlow[0] === 'Manager'
      });

      // Envoi de la requête
      const res = await fetch('http://localhost:5000/api/recruitment/new-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      // Récupération de la réponse
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || `Erreur ${res.status}: ${res.statusText}`);
      }

      // Message de succès adapté
      if (status === 'Validées') {
        toast.success('Demande validée automatiquement !');
      } else {
        toast.success('Demande de recrutement créée avec succès !');
      }
      
      // Appeler les callbacks de succès
      onSuccess();
      onClose();

    } catch (err: any) {
      // Gestion des erreurs
      console.error('❌ Erreur lors de la création de la demande:', err);
      
      // Message d'erreur personnalisé selon le type d'erreur
      if (err.message.includes('401')) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else if (err.message.includes('403')) {
        toast.error('Vous n\'avez pas les droits pour effectuer cette action.');
      } else if (err.message.includes('500')) {
        toast.error('Erreur serveur. Veuillez réessayer plus tard.');
      } else {
        toast.error(err.message || 'Erreur lors de la création de la demande');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addSkill = (skill: string) => {
    const currentSkills = formData.requiredSkills ? formData.requiredSkills.split(',') : [];
    if (!currentSkills.includes(skill.trim())) {
      const newSkills = [...currentSkills, skill.trim()].join(', ');
      handleChange('requiredSkills', newSkills);
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = formData.requiredSkills.split(',').map(s => s.trim());
    const newSkills = currentSkills.filter(s => s !== skill).join(', ');
    handleChange('requiredSkills', newSkills);
  };

  // Fonction pour déterminer le circuit de validation en fonction du poste et du type de contrat
  const getValidationFlow = (jobTitle: string, contractType: string): string[] => {
    // Vérifier d'abord si le poste a un circuit spécifique
    const specificFlow = validationFlowsByJob[jobTitle];
    if (specificFlow) {
      return specificFlow;
    }

    // Sinon, déterminer en fonction du type de contrat et du niveau
    if (contractType === 'Stage' || contractType === 'Alternance' || contractType === 'Intérim' || contractType === 'CDD Court (<3 mois)' || contractType === 'Saisonnier') {
      return ['Manager'];
    }

    // Circuit par défaut
    return defaultValidationFlow;
  };

  // Fonction pour gérer la sélection d'un poste et son circuit
  const handleJobSelect = (job: string) => {
    // Met à jour le titre du poste dans le formulaire
    handleChange('title', job);

    // Récupère le circuit de validation correspondant au poste et au type de contrat
    const circuit = getValidationFlow(job, formData.contractType);
    setValidationFlow(circuit);

    // Ferme le dropdown et vide la recherche
    setShowJobDropdown(false);
    setSearchJob('');
  };

  // Mettre à jour le circuit quand le type de contrat change
  useEffect(() => {
    if (formData.title) {
      const circuit = getValidationFlow(formData.title, formData.contractType);
      setValidationFlow(circuit);
    }
  }, [formData.contractType, formData.title]);

  // Filtrer les listes en fonction de la recherche
  const filteredJobs = jobTitlesList.filter(job => 
    job.toLowerCase().includes(searchJob.toLowerCase())
  );

  const filteredDepartments = departmentsList.filter(dept => 
    dept.toLowerCase().includes(searchDept.toLowerCase())
  );

  const filteredLocations = locationsList.filter(loc => 
    loc.toLowerCase().includes(searchLocation.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/30 my-8">
        {/* En-tête */}
        <div className="sticky top-0 z-20 px-8 py-6 border-b bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-xl border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-4 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className="absolute flex items-center justify-center w-6 h-6 border-2 border-white rounded-full shadow-lg -top-2 -right-2 bg-gradient-to-br from-white to-slate-100">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
                  Nouvelle demande de recrutement
                </h3>
                <p className="mt-1 text-slate-600">Remplissez tous les champs pour créer votre demande</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-3 transition-all duration-200 hover:bg-slate-100 rounded-xl hover:scale-105 group"
            >
              <X className="w-5 h-5 transition-colors text-slate-600 group-hover:text-slate-900" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="space-y-6">
            {/* Première ligne : Titre et Département */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Titre du poste avec dropdown */}
              <div className="p-6 transition-shadow bg-white border shadow-sm border-slate-200/70 rounded-2xl hover:shadow-md">
                <div className="flex items-center mb-4 space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                    <Target className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-slate-900">Titre du poste</label>
                    <p className="text-sm text-slate-600">Sélectionnez ou saisissez un poste</p>
                  </div>
                </div>
                
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        handleChange('title', e.target.value);
                        setSearchJob(e.target.value);
                        setShowJobDropdown(true);
                      }}
                      onFocus={() => setShowJobDropdown(true)}
                      className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all pr-10 ${
                        errors.title ? 'border-red-300' : 'border-slate-300/70'
                      }`}
                      placeholder="Ex: Développeur Full Stack Senior"
                    />
                    <ChevronDown 
                      className="absolute w-5 h-5 transform -translate-y-1/2 cursor-pointer right-3 top-1/2 text-slate-400"
                      onClick={() => setShowJobDropdown(!showJobDropdown)}
                    />
                  </div>
                  
                  {/* Dropdown des postes */}
                  {showJobDropdown && (
                    <div className="absolute z-30 w-full mt-1 overflow-y-auto bg-white border shadow-xl border-slate-200 rounded-xl max-h-60">
                      <div className="sticky top-0 p-2 bg-white border-b border-slate-100">
                        <div className="flex items-center px-3 py-2 rounded-lg bg-slate-50">
                          <Search className="w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={searchJob}
                            onChange={(e) => setSearchJob(e.target.value)}
                            placeholder="Rechercher un poste..."
                            className="w-full ml-2 text-sm bg-transparent border-0 outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      {filteredJobs.length > 0 ? (
                        filteredJobs.map(job => (
                          <button
                            key={job}
                            type="button"
                            onClick={() => handleJobSelect(job)}
                            className="flex items-start w-full px-4 py-3 space-x-3 text-left transition-colors hover:bg-emerald-50"
                          >
                            <Briefcase className="w-4 h-4 mt-1 text-emerald-600" />
                            <span className="font-medium text-slate-900">{job}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          Aucun poste trouvé. Vous pouvez saisir un poste personnalisé.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {errors.title && (
                  <p className="flex items-center mt-2 space-x-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              {/* Détails organisationnels avec dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Département avec dropdown */}
                <div className="p-5 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
                  <label className="flex items-center mb-3 space-x-2 text-sm font-medium text-slate-700">
                    <Building className="w-4 h-4" />
                    <span>Direction/Département</span>
                  </label>
                  
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.department}
                        onChange={(e) => {
                          handleChange('department', e.target.value);
                          setSearchDept(e.target.value);
                          setShowDeptDropdown(true);
                        }}
                        onFocus={() => setShowDeptDropdown(true)}
                        className={`w-full px-4 py-3 bg-slate-50/50 border rounded-lg pr-10 ${
                          errors.department ? 'border-red-300' : 'border-slate-300/70'
                        }`}
                        placeholder="Ex: Direction IT"
                      />
                      <ChevronDown 
                        className="absolute w-4 h-4 transform -translate-y-1/2 cursor-pointer right-3 top-1/2 text-slate-400"
                        onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                      />
                    </div>
                    
                    {/* Dropdown des départements */}
                    {showDeptDropdown && (
                      <div className="absolute z-30 w-full mt-1 overflow-y-auto bg-white border rounded-lg shadow-xl border-slate-200 max-h-48">
                        <div className="sticky top-0 p-2 bg-white border-b border-slate-100">
                          <div className="flex items-center px-3 py-2 rounded bg-slate-50">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={searchDept}
                              onChange={(e) => setSearchDept(e.target.value)}
                              placeholder="Rechercher..."
                              className="w-full ml-2 text-sm bg-transparent border-0 outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {filteredDepartments.map(dept => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              handleChange('department', dept);
                              setShowDeptDropdown(false);
                              setSearchDept('');
                            }}
                            className="w-full px-4 py-2 text-sm text-left transition-colors hover:bg-emerald-50"
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Localisation avec dropdown */}
                <div className="p-5 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
                  <label className="flex items-center mb-3 space-x-2 text-sm font-medium text-slate-700">
                    <Globe className="w-4 h-4" />
                    <span>Localisation</span>
                  </label>
                  
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => {
                          handleChange('location', e.target.value);
                          setSearchLocation(e.target.value);
                          setShowLocationDropdown(true);
                        }}
                        onFocus={() => setShowLocationDropdown(true)}
                        className={`w-full px-4 py-3 bg-slate-50/50 border rounded-lg pr-10 ${
                          errors.location ? 'border-red-300' : 'border-slate-300/70'
                        }`}
                        placeholder="Ex: Tunis"
                      />
                      <ChevronDown 
                        className="absolute w-4 h-4 transform -translate-y-1/2 cursor-pointer right-3 top-1/2 text-slate-400"
                        onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      />
                    </div>
                    
                    {/* Dropdown des localisations */}
                    {showLocationDropdown && (
                      <div className="absolute z-30 w-full mt-1 overflow-y-auto bg-white border rounded-lg shadow-xl border-slate-200 max-h-48">
                        <div className="sticky top-0 p-2 bg-white border-b border-slate-100">
                          <div className="flex items-center px-3 py-2 rounded bg-slate-50">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={searchLocation}
                              onChange={(e) => setSearchLocation(e.target.value)}
                              placeholder="Rechercher une ville..."
                              className="w-full ml-2 text-sm bg-transparent border-0 outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {filteredLocations.map(loc => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => {
                              handleChange('location', loc);
                              setShowLocationDropdown(false);
                              setSearchLocation('');
                            }}
                            className="w-full px-4 py-2 text-sm text-left transition-colors hover:bg-emerald-50"
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {errors.location && (
                    <p className="flex items-center mt-2 space-x-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.location}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Deuxième ligne : Détails du contrat */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="p-6 border bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200/50 rounded-2xl">
                <div className="flex items-center mb-6 space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Détails du contrat</h4>
                    <p className="text-sm text-blue-700">Informations contractuelles</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">
                      Type de contrat
                    </label>
                    <select
                      value={formData.contractType}
                      onChange={(e) => handleChange('contractType', e.target.value)}
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300/70"
                    >
                      {contractTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">
                      Niveau
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) => handleChange('level', e.target.value)}
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300/70"
                    >
                      {levelOptions.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">
                      Expérience requise
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300/70"
                    >
                      {experienceOptions.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">
                      Date de début souhaitée
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className="w-full px-4 py-3 bg-white border rounded-lg border-slate-300/70"
                    />
                  </div>
                </div>
              </div>

              {/* Options de travail */}
              <div className="p-5 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl">
                      <Globe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Télétravail possible</p>
                      <p className="text-sm text-slate-600">Mode hybride ou full remote</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.remote}
                      onChange={(e) => handleChange('remote', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION AMÉLIORÉE : Cause de recrutement */}
            <div className="p-6 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
              <div className="flex items-center mb-4 space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-slate-900">Cause de recrutement</label>
                  <p className="text-sm text-slate-600">Contexte et justification détaillée</p>
                </div>
              </div>
              
              <select
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                className="w-full px-4 py-3 mb-4 border rounded-lg bg-slate-50/50 border-slate-300/70"
              >
                {Object.keys(recruitmentReasons).map(reason => {
                  const Icon = recruitmentReasons[reason as keyof typeof recruitmentReasons].icon;
                  return (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  );
                })}
              </select>

              {/* Détails améliorés de la cause */}
              <RecruitmentCauseDetails
                reason={formData.reason}
                onDataChange={setRecruitmentDetails}
                errors={errors}
              />

              {/* Affichage conditionnel pour l'ancien système (conservé pour compatibilité) */}
              {formData.reason === 'Remplacement' && (
                <div className="p-4 mt-4 space-y-4 border bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200/50 rounded-xl">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-amber-800">
                      Nom de la personne remplacée
                    </label>
                    <input
                      type="text"
                      value={formData.replacementName}
                      onChange={(e) => handleChange('replacementName', e.target.value)}
                      className={`w-full px-4 py-3 bg-white border ${
                        errors.replacementName ? 'border-red-300' : 'border-amber-300'
                      } rounded-lg`}
                      placeholder="Nom et prénom"
                    />
                    {errors.replacementName && (
                      <p className="mt-2 text-sm text-red-600">{errors.replacementName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-amber-800">
                      Raison du remplacement
                    </label>
                    <textarea
                      value={formData.replacementReason}
                      onChange={(e) => handleChange('replacementReason', e.target.value)}
                      className="w-full px-4 py-3 bg-white border rounded-lg border-amber-300"
                      rows={2}
                      placeholder="Départ, mutation, promotion, arrêt maladie..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Troisième ligne : Description détaillée */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="p-6 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
                <div className="flex items-center mb-4 space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
                    <FileText className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-slate-900">Description du poste</label>
                    <p className="text-sm text-slate-600">Missions, responsabilités et objectifs</p>
                  </div>
                </div>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all resize-none min-h-[200px] ${
                    errors.description ? 'border-red-300' : 'border-slate-300/70'
                  }`}
                  placeholder="Décrivez en détail les missions principales, responsabilités, objectifs du poste, et intégration dans l'équipe..."
                />
                {errors.description && (
                  <p className="flex items-center mt-2 space-x-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.description}</span>
                  </p>
                )}
                <div className="mt-3 text-sm text-slate-500">
                  <p>💡 Conseils : Soyez précis sur les missions quotidiennes, les résultats attendus, et les compétences techniques requises.</p>
                </div>
              </div>

              {/* Budget et urgence */}
              <div className="space-y-4">
                <div className="p-6 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
                  <div className="flex items-center mb-4 space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-slate-900">Salaire (DT)</label>
                      <p className="text-sm text-slate-600">Rémunération brute</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleChange('budget', e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg bg-slate-50/50 border-slate-300/70"
                    placeholder="Ex: 45000"
                  />
                </div>

                <div className="p-6 border bg-gradient-to-br from-red-50/50 to-orange-50/50 border-red-200/50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
                        <Zap className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-red-900">Recrutement urgent</p>
                        <p className="text-sm text-red-700">Priorité haute - Traitement accéléré</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.urgent}
                        onChange={(e) => handleChange('urgent', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r from-red-500 to-orange-500"></div>
                    </label>
                  </div>
                  {formData.urgent && (
                    <div className="p-3 mt-4 border border-red-200 rounded-lg bg-white/50">
                      <p className="text-sm text-red-700">
                        ⚡ <span className="font-medium">Mode accéléré activé :</span> 
                        La demande sera traitée en priorité avec un délai estimé de 15 jours.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quatrième ligne : Compétences requises */}
            <div className="p-6 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
              <div className="flex items-center mb-4 space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-slate-900">Compétences requises</label>
                  <p className="text-sm text-slate-600">Techniques et comportementales</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {skillSuggestions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="px-3 py-2 text-sm transition-colors rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                
                <textarea
                  value={formData.requiredSkills}
                  onChange={(e) => handleChange('requiredSkills', e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg resize-none bg-slate-50/50 border-slate-300/70"
                  rows={4}
                  placeholder="Listez les compétences techniques et soft skills, séparées par des virgules..."
                />
              </div>

              {/* Liste des compétences sélectionnées */}
              {formData.requiredSkills && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Compétences ajoutées :</span>
                    <span className="text-sm text-slate-500">
                      {formData.requiredSkills.split(',').filter(s => s.trim()).length} compétences
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.requiredSkills.split(',').filter(skill => skill.trim()).map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center px-3 py-2 space-x-1 border border-blue-200 rounded-lg group bg-gradient-to-r from-blue-50 to-cyan-50"
                      >
                        <span className="text-sm text-blue-700">{skill.trim()}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.trim())}
                          className="text-blue-500 transition-colors hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Circuit de validation */}
            <div className="pt-8 mt-8 border-t border-emerald-200">
              <h5 className="mb-4 font-semibold text-slate-900">Circuit de validation</h5>
              <div className="flex items-center justify-between">
                {validationLevels.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = validationFlow.length === 0 || validationFlow.includes(item.level);
                  
                  return (
                    <div key={item.level} className="relative flex flex-col items-center group">
                      <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center shadow-lg z-10 ${isActive ? 'opacity-100 ring-4 ring-offset-2 ring-' + item.color.replace('bg-', '') + '/30' : 'opacity-40'}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className={`mt-2 text-xs font-medium ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>{item.level}</p>
                      <div className="absolute hidden w-48 p-2 mb-2 text-xs text-center text-white rounded-lg bottom-full group-hover:block bg-slate-800">
                        {item.description}
                      </div>
                      {index < validationLevels.length - 1 && (
                        <div className={`absolute top-6 left-12 w-16 h-0.5 ${isActive && validationLevels[index + 1] && (validationFlow.length === 0 || validationFlow.includes(validationLevels[index + 1].level)) ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
              {validationFlow.length > 0 ? (
                <div className="p-4 mt-6 border bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-emerald-200">
                  <p className="text-sm text-center text-emerald-800">
                    <span className="font-semibold">Circuit spécifique pour ce poste :</span>{' '}
                    {validationFlow.join(' → ')}
                  </p>
                  {validationFlow.length === 1 && validationFlow[0] === 'Manager' && (
                    <p className="mt-2 text-xs text-center text-emerald-600">
                      ✅ Poste à validation simplifiée (stage, alternance, CDD court, etc.)
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 mt-6 border bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-slate-200">
                  <p className="text-sm text-center text-slate-600">
                    <span className="font-semibold">Circuit standard :</span>{' '}
                    Manager → Directeur → DRH
                  </p>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end pt-6 space-x-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 transition-colors border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="relative px-8 py-3 overflow-hidden font-medium text-white transition-all duration-300 shadow-lg group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-emerald-500/30 disabled:opacity-50"
              >
                <span className="relative flex items-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Soumettre la demande</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}