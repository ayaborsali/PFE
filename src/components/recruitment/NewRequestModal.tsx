// manager soumettre la demande d'emploi et les détails de la demande
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
  [key: string]: any; // Pour les réponses dynamiques aux questions
}

// Composant de sélection de salaire professionnel
function SalaryRangeInput({ 
  minValue, 
  maxValue, 
  onMinChange, 
  onMaxChange,
  error,
  currency = "DT",
  required = false
}: {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  error?: string;
  currency?: string;
  required?: boolean;
}) {
  const [minTouched, setMinTouched] = useState(false);
  const [maxTouched, setMaxTouched] = useState(false);
  
  const min = parseFloat(minValue);
  const max = parseFloat(maxValue);
  
  const getValidationMessage = () => {
    if (!minValue && !maxValue && !required) return null;
    if (minValue && maxValue) {
      if (min >= max) {
        return "Le salaire minimum doit être inférieur au salaire maximum";
      }
      if (min === max) {
        return "Les salaires minimum et maximum doivent être différents";
      }
    }
    if (minValue && !maxValue && required) return "Le salaire maximum est requis";
    if (!minValue && maxValue && required) return "Le salaire minimum est requis";
    return null;
  };
  
  const validationMessage = error || getValidationMessage();
  const isValid = !validationMessage;
  
  const formatValue = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('fr-FR').format(num);
  };
  
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onMinChange(value);
    }
  };
  
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onMaxChange(value);
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Salaire minimum
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-slate-500 sm:text-sm">{currency}</span>
            </div>
            <input
              type="text"
              value={minValue}
              onChange={handleMinChange}
              onBlur={() => setMinTouched(true)}
              className={`block w-full pl-8 pr-12 py-3 border rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all ${
                !isValid && minTouched ? 'border-red-300' : 'border-slate-300/70'
              }`}
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-slate-400 sm:text-sm">TND</span>
            </div>
          </div>
          {minValue && (
            <p className="mt-1 text-xs text-slate-500">
              ~ {formatValue(minValue)} {currency}
            </p>
          )}
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Salaire maximum
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-slate-500 sm:text-sm">{currency}</span>
            </div>
            <input
              type="text"
              value={maxValue}
              onChange={handleMaxChange}
              onBlur={() => setMaxTouched(true)}
              className={`block w-full pl-8 pr-12 py-3 border rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all ${
                !isValid && maxTouched ? 'border-red-300' : 'border-slate-300/70'
              }`}
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-slate-400 sm:text-sm">TND</span>
            </div>
          </div>
          {maxValue && (
            <p className="mt-1 text-xs text-slate-500">
              ~ {formatValue(maxValue)} {currency}
            </p>
          )}
        </div>
      </div>
      
      {!isValid && (minTouched || maxTouched) && (
        <div className="flex items-start p-3 space-x-2 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Erreur de validation
            </p>
            <p className="text-sm text-red-700">
              {validationMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant de suggestions de salaires
function SalarySuggestions({ 
  jobTitle, 
  experience,
  onSelect 
}: {
  jobTitle: string;
  experience: string;
  onSelect: (min: string, max: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<{ min: number; max: number; level: string }[]>([]);
  
  useEffect(() => {
    const getSalarySuggestion = () => {
      const baseSalary: Record<string, { junior: number; confirmé: number; senior: number; expert: number }> = {
        'Développeur Full Stack': { junior: 2500, confirmé: 3500, senior: 5000, expert: 7000 },
        'Développeur Frontend': { junior: 2200, confirmé: 3200, senior: 4500, expert: 6000 },
        'Développeur Backend': { junior: 2400, confirmé: 3400, senior: 4800, expert: 6500 },
        'Data Scientist': { junior: 2800, confirmé: 4000, senior: 5500, expert: 8000 },
        'Chef de Projet IT': { junior: 3000, confirmé: 4200, senior: 5800, expert: 7500 },
        'Product Owner': { junior: 2800, confirmé: 4000, senior: 5500, expert: 7200 },
        'Responsable RH': { junior: 2700, confirmé: 3800, senior: 5200, expert: 6800 },
        'Comptable': { junior: 1800, confirmé: 2500, senior: 3500, expert: 4500 },
        'Commercial': { junior: 1500, confirmé: 2200, senior: 3000, expert: 4000 },
      };
      
      const defaultSuggestions = [
        { min: 2000, max: 3000, level: 'Junior' },
        { min: 3000, max: 4500, level: 'Confirmé' },
        { min: 4500, max: 6000, level: 'Senior' },
        { min: 6000, max: 8000, level: 'Expert' },
      ];
      
      const jobKey = Object.keys(baseSalary).find(key => 
        jobTitle.toLowerCase().includes(key.toLowerCase())
      );
      
      if (jobKey && baseSalary[jobKey]) {
        const salaries = baseSalary[jobKey];
        const suggestions = [];
        
        if (salaries.junior) suggestions.push({ min: salaries.junior * 0.9, max: salaries.junior * 1.1, level: 'Junior' });
        if (salaries.confirmé) suggestions.push({ min: salaries.confirmé * 0.9, max: salaries.confirmé * 1.1, level: 'Confirmé' });
        if (salaries.senior) suggestions.push({ min: salaries.senior * 0.9, max: salaries.senior * 1.1, level: 'Senior' });
        if (salaries.expert) suggestions.push({ min: salaries.expert * 0.9, max: salaries.expert * 1.1, level: 'Expert' });
        
        return suggestions;
      }
      
      return defaultSuggestions;
    };
    
    if (jobTitle) {
      setSuggestions(getSalarySuggestion());
    }
  }, [jobTitle]);
  
  if (!jobTitle || suggestions.length === 0) return null;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };
  
  return (
    <div className="p-4 mt-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center mb-3 space-x-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          Suggestions basées sur le marché
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.level}
            type="button"
            onClick={() => onSelect(suggestion.min.toString(), suggestion.max.toString())}
            className={`p-3 text-left transition-all rounded-lg border ${
              experience === suggestion.level
                ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-400/30'
                : 'bg-white border-blue-200 hover:bg-blue-50'
            }`}
          >
            <p className="text-xs font-medium text-blue-700">{suggestion.level}</p>
            <p className="text-sm font-semibold text-blue-900">
              {formatCurrency(suggestion.min)} - {formatCurrency(suggestion.max)} DT
            </p>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-blue-600">
        💡 Basé sur les données du marché pour ce type de poste
      </p>
    </div>
  );
}

// Listes statiques des postes
const jobTitlesList = [
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
  'Responsable RH',
  'Chargé de Recrutement',
  'Gestionnaire de Paie',
  'HR Business Partner',
  'Formateur',
  'Comptable',
  'Contrôleur de Gestion',
  'Directeur Financier',
  'Chef Comptable',
  'Analyste Financier',
  'Auditeur Interne',
  'Responsable Marketing',
  'Community Manager',
  'Graphiste',
  'Content Manager',
  'SEO Specialist',
  'Marketing Digital',
  'Chef de Produit',
  'Commercial',
  'Responsable Commercial',
  'Directeur Commercial',
  'Business Developer',
  'Account Manager',
  "Chargé d'Affaires",
  'Assistant de Direction',
  'Office Manager',
  'Directeur Général',
  'Directeur Administratif',
  'Ingénieur Production',
  "Chef d'équipe",
  'Responsable Logistique',
  'Magasinier',
  'Supply Chain Manager',
  'Planificateur',
  'Conseiller Client',
  'Responsable Service Client',
  'Support Technique',
  'Téléconseiller',
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

const locationsList = [
  'Charguia 1',
  'Jbel Wost',
  'Ain Zaghouan',
].sort();

const contractTypes = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim', 'CDD Court (<3 mois)', 'Saisonnier'];

const recruitmentReasons = {
  'Création de poste': {
    icon: FolderPlus,
    color: 'emerald',
    description: 'Nouveau poste lié à une expansion ou une nouvelle activité',
    subReasons: [
      'Nouveau projet/département',
      'Expansion de léquipe',
      'Diversification',
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
      'Quelle est la raison exacte du départ ?',
      'Y a-t-il une période de passation prévue ?'
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
};

const validationFlowsByJob: Record<string, string[]> = {
  'Stagiaire Développement': ['Manager'],
  'Stagiaire Marketing': ['Manager'],
  'Stagiaire RH': ['Manager'],
  'Stagiaire Commercial': ['Manager'],
  'Stagiaire Comptabilité': ['Manager'],
  'Stagiaire Communication': ['Manager'],
  'Stagiaire Design': ['Manager'],
  'Alternant Développement': ['Manager'],
  'Alternant Marketing': ['Manager'],
  'Alternant RH': ['Manager'],
  'Alternant Commercial': ['Manager'],
  'Alternant Comptabilité': ['Manager'],
  'CDD Court - Développement': ['Manager'],
  'CDD Court - Support': ['Manager'],
  'CDD Court - Commercial': ['Manager'],
  'CDD Court - Administratif': ['Manager'],
  'Intérimaire Production': ['Manager'],
  'Intérimaire Logistique': ['Manager'],
  'Intérimaire Administratif': ['Manager'],
  'Freelance Développement': ['Manager'],
  'Freelance Design': ['Manager'],
  'Freelance Rédaction': ['Manager'],
  'Saisonnier Vente': ['Manager'],
  'Saisonnier Support': ['Manager'],
  'Saisonnier Production': ['Manager'],
  'Auxiliaire Administratif': ['Manager'],
  'Assistant Temps Partiel': ['Manager'],
  'Aide-comptable Junior': ['Manager'],
  'Remplacement Court Terme': ['Manager'],
  'Congé Maternité Remplacement': ['Manager'],
  'Congé Maladie Remplacement': ['Manager'],
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
  'Développeur Full Stack': ['Directeur', 'DRH'],
  'Développeur Frontend': ['Directeur', 'DRH'],
  'Développeur Backend': ['Directeur', 'DRH'],
  'Développeur Mobile': ['Directeur', 'DRH'],
  'Data Analyst': ['Directeur', 'DRH'],
  'QA Tester': ['Directeur', 'DRH'],
  'Commercial': ['Directeur', 'DRH'],
  'Community Manager': ['Directeur', 'DRH'],
  'Graphiste': ['Directeur', 'DRH'],
  'Conseiller Client': ['Directeur', 'DRH'],
  'Téléconseiller': ['Directeur', 'DRH'],
  'Magasinier': ['Directeur', 'DRH'],
  'Comptable': ['Directeur', 'DRH'],
  'Assistant de Direction': ['Directeur', 'DRH'],
  'Formateur': ['Directeur', 'DRH'],
  "Chef d'équipe": ['Directeur', 'DRH'],
  'Planificateur': ['Directeur', 'DRH'],
  'Support Technique': ['Directeur', 'DRH'],
  'Data Scientist': ['Directeur', 'DRH', 'DAF'],
  'DevOps Engineer': ['Directeur', 'DRH', 'DAF'],
  'UI/UX Designer': ['Directeur', 'DRH', 'DAF'],
  'Contrôleur de Gestion': ['Directeur', 'DRH', 'DAF'],
  'Analyste Financier': ['Directeur', 'DRH', 'DAF'],
  'Business Developer': ['Directeur', 'DRH', 'DAF'],
  'Account Manager': ['Directeur', 'DRH', 'DAF'],
  "Chargé d'Affaires": ['Directeur', 'DRH', 'DAF'],
  'Office Manager': ['Directeur', 'DRH', 'DAF'],
  'Ingénieur Production': ['Directeur', 'DRH', 'DAF'],
  'Responsable Logistique': ['Directeur', 'DRH', 'DAF'],
  'Supply Chain Manager': ['Directeur', 'DRH', 'DAF'],
  'Chef de Projet IT': ['DRH', 'DAF', 'DGA/DG'],
  'Architecte Logiciel': ['DRH', 'DAF', 'DGA/DG'],
  'Product Owner': ['DRH', 'DAF', 'DGA/DG'],
  'Scrum Master': ['DRH', 'DAF', 'DGA/DG'],
  'Cyber Security Analyst': ['DRH', 'DAF', 'DGA/DG'],
  'Responsable Marketing': ['DRH', 'DAF', 'DGA/DG'],
  'Content Manager': ['DRH', 'DAF', 'DGA/DG'],
  'SEO Specialist': ['DRH', 'DAF', 'DGA/DG'],
  'Marketing Digital': ['DRH', 'DAF', 'DGA/DG'],
  'Chef de Produit': ['DRH', 'DAF', 'DGA/DG'],
  'Responsable Commercial': ['DRH', 'DAF', 'DGA/DG'],
  'Auditeur Interne': ['DRH', 'DAF', 'DGA/DG'],
  'Responsable Service Client': ['DRH', 'DAF', 'DGA/DG'],
  'Responsable RH': ['DAF', 'DGA/DG'],
  'Chargé de Recrutement': ['DAF', 'DGA/DG'],
  'Gestionnaire de Paie': ['DAF', 'DGA/DG'],
  'HR Business Partner': ['DAF', 'DGA/DG'],
  'Directeur Commercial': ['DAF', 'DGA/DG'],
  'Directeur Financier': ['DAF', 'DGA/DG'],
  'Chef Comptable': ['DAF', 'DGA/DG'],
  'Directeur Administratif': ['DAF', 'DGA/DG'],
  'Administrateur Système': ['DAF', 'DGA/DG'],
  'Directeur Général': ['DGA/DG'],
};

const defaultValidationFlow = ['Directeur', 'DRH'];

const skillSuggestions = [
  'Management', 'Communication', 'Anglais', 'Excel', 'PowerPoint', 'Word', 
];

const levelOptions = [
  'Baccalauréat',
  'Bac+2 (DUT, BTS)',
  'Licence (Bac+3)',
  'Master (Bac+5)',
  'Diplôme d\'Ingénieur',
  'Doctorat (PhD)'
];

const experienceOptions = ['0-1 an', '1-3 ans', '3-5 ans', '5-8 ans', '8+ ans'];

// Styles statiques pour les couleurs
const colorStyles = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    text: 'text-emerald-600',
    title: 'text-emerald-900',
    description: 'text-emerald-700'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    text: 'text-amber-600',
    title: 'text-amber-900',
    description: 'text-amber-700'
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    iconBg: 'bg-violet-100',
    text: 'text-violet-600',
    title: 'text-violet-900',
    description: 'text-violet-700'
  }
};

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
  const styles = colorStyles[reasonConfig.color as keyof typeof colorStyles];

  const handleChange = (field: keyof RecruitmentCauseDetail, value: any) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mt-6 space-y-6">
      <div className={`p-4 rounded-xl ${styles.bg} border ${styles.border}`}>
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${styles.iconBg}`}>
            <Icon className={`w-6 h-6 ${styles.text}`} />
          </div>
          <div className="flex-1">
            <h4 className={`text-lg font-semibold ${styles.title}`}>
              {reason}
            </h4>
            <p className={`text-sm ${styles.description}`}>
              {reasonConfig.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                value={details[`answer${index}`] || ''}
                onChange={(e) => handleChange(`answer${index}` as any, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg border-slate-300/70"
                placeholder="Votre réponse..."
              />
            </div>
          ))}
        </div>
      </div>

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
  const [salaryError, setSalaryError] = useState<string>('');
  
  const [searchJob, setSearchJob] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    department: user?.department || '',
    location: '',
    contractType: 'CDI',
    reason: 'Création de poste',
    salaryMin: '',
    salaryMax: '',
    requiredSkills: '',
    description: '',
    urgent: false,
    startDate: '',
    replacementName: '',
    replacementReason: '',
    level: 'Bac+2 (DUT, BTS)',
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

    // Vérifier les salaires seulement si ce n'est pas un stage ou alternance
    const isStageOrIntern = 
      formData.contractType === 'Stage' || 
      formData.contractType === 'Alternance' ||
      formData.title.toLowerCase().includes('stagiaire') ||
      formData.title.toLowerCase().includes('alternant');

    if (!isStageOrIntern) {
      if (!formData.salaryMin) {
        newErrors.salaryMin = 'Le salaire minimum est requis';
      }
      if (!formData.salaryMax) {
        newErrors.salaryMax = 'Le salaire maximum est requis';
      }
    }

    if (formData.salaryMin && formData.salaryMax) {
      const min = parseFloat(formData.salaryMin);
      const max = parseFloat(formData.salaryMax);
      if (min >= max) {
        setSalaryError('Le salaire minimum doit être inférieur au salaire maximum');
      } else if (min === max) {
        setSalaryError('Les salaires minimum et maximum doivent être différents');
      } else {
        setSalaryError('');
      }
    }

    if (recruitmentDetails) {
      if (!recruitmentDetails.subReason) {
        newErrors.subReason = 'Le type est requis';
      }
      if (!recruitmentDetails.description) {
        newErrors.detailedDescription = 'La description détaillée est requise';
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

    if (salaryError) {
      toast.error(salaryError);
      return;
    }

    setLoading(true);

    try {
      let finalValidationFlow = validationFlow;
      
      if (finalValidationFlow.length === 0) {
        if (formData.contractType === 'Stage' || 
            formData.contractType === 'Alternance' || 
            formData.contractType === 'Intérim' || 
            formData.contractType === 'CDD Court (<3 mois)' || 
            formData.contractType === 'Saisonnier') {
          finalValidationFlow = ['Manager'];
        } else if (formData.level === 'Baccalauréat' || formData.level === 'Bac+2 (DUT, BTS)') {
          finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
        } else if (formData.level === 'Master (Bac+5)' || formData.level === 'Diplôme d\'Ingénieur') {
          finalValidationFlow = ['Manager', 'Directeur', 'DRH', 'DAF'];
        } else if (formData.title.includes('Directeur') || formData.title.includes('Responsable')) {
          finalValidationFlow = ['DRH', 'DAF', 'DGA/DG'];
        } else {
          finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
        }
      }

      if (finalValidationFlow.length === 0) {
        finalValidationFlow = ['Manager', 'Directeur', 'DRH'];
      }

      let status = 'En attente';
      let current_validation_level = finalValidationFlow[0];

      if (finalValidationFlow.length === 1 && finalValidationFlow[0] === 'Manager') {
        status = 'Validées';
        current_validation_level = 'Validé';
      }

      const requestData = {
  title: formData.title.trim(),
  department: formData.department.trim(),
  location: formData.location.trim(),
  contract_type: formData.contractType,
  reason: formData.reason,
  reason_details: recruitmentDetails || {},
  salary_min: formData.salaryMin ? parseFloat(formData.salaryMin) : null,  // ⚠️ Attention: c'est salary_min (avec underscore)
  salary_max: formData.salaryMax ? parseFloat(formData.salaryMax) : null,  // ⚠️ Attention: c'est salary_max (avec underscore)
  required_skills: formData.requiredSkills 
    ? formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
    : [],
  description: formData.description.trim(),
  level: formData.level,
  experience: formData.experience,
  start_date: formData.startDate,
  remote_work: formData.remote || false,
  travel_required: formData.travelRequired || false,
  urgent: formData.urgent || (recruitmentDetails?.urgencyLevel === 'high' || recruitmentDetails?.urgencyLevel === 'critical'),
  priority: recruitmentDetails?.urgencyLevel || (formData.urgent ? 'high' : 'medium'),
  replacement_name: formData.replacementName?.trim() || null,
  replacement_reason: formData.replacementReason?.trim() || null,
  created_by: user?.id,
  created_by_name: user?.full_name || user?.email,
  created_by_role: user?.role || 'Manager',
  validation_flow: finalValidationFlow,
  status: status,
  current_validation_level: current_validation_level,
  created_at: new Date().toISOString()
    };

     console.log('📤 Envoi des données:', requestData); // Debug

      const res = await fetch('http://localhost:5000/api/recruitment/new-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || `Erreur ${res.status}: ${res.statusText}`);
      }

      if (status === 'Validées') {
        toast.success('Demande validée automatiquement !');
      } else {
        toast.success('Demande de recrutement créée avec succès !');
      }
      
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error('❌ Erreur lors de la création de la demande:', err);
      
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

  const getValidationFlow = (jobTitle: string, contractType: string): string[] => {
    const specificFlow = validationFlowsByJob[jobTitle];
    if (specificFlow) {
      return specificFlow;
    }

    if (contractType === 'Stage' || contractType === 'Alternance' || contractType === 'Intérim' || contractType === 'CDD Court (<3 mois)' || contractType === 'Saisonnier') {
      return ['Manager'];
    }

    return defaultValidationFlow;
  };

  const handleJobSelect = (job: string) => {
    handleChange('title', job);
    const circuit = getValidationFlow(job, formData.contractType);
    setValidationFlow(circuit);
    setShowJobDropdown(false);
    setSearchJob('');
  };

  useEffect(() => {
    if (formData.title) {
      const circuit = getValidationFlow(formData.title, formData.contractType);
      setValidationFlow(circuit);
    }
  }, [formData.contractType, formData.title]);

  const filteredJobs = jobTitlesList.filter(job => 
    job.toLowerCase().includes(searchJob.toLowerCase())
  );

  const filteredDepartments = departmentsList.filter(dept => 
    dept.toLowerCase().includes(searchDept.toLowerCase())
  );

  const filteredLocations = locationsList.filter(loc => 
    loc.toLowerCase().includes(searchLocation.toLowerCase())
  );

  // Vérifier si c'est un stage ou alternance pour les salaires
  const isStageOrIntern = 
    formData.contractType === 'Stage' || 
    formData.contractType === 'Alternance' ||
    formData.title.toLowerCase().includes('stagiaire') ||
    formData.title.toLowerCase().includes('alternant');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/30 my-8">
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              <div className="grid grid-cols-2 gap-4">
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
                      Niveau d'études
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
                {Object.keys(recruitmentReasons).map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>

              <RecruitmentCauseDetails
                reason={formData.reason}
                onDataChange={setRecruitmentDetails}
                errors={errors}
              />

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

              <div className="space-y-4">
                <div className="p-6 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
                  <div className="flex items-center mb-4 space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Fourchette salariale</h4>
                      <p className="text-sm text-slate-600">Salaire mensuel brut</p>
                    </div>
                  </div>

                  <SalaryRangeInput
                    minValue={formData.salaryMin}
                    maxValue={formData.salaryMax}
                    onMinChange={(value) => handleChange('salaryMin', value)}
                    onMaxChange={(value) => handleChange('salaryMax', value)}
                    error={salaryError}
                    currency="DT"
                    required={!isStageOrIntern}
                  />

                  {formData.title && !isStageOrIntern && (
                    <SalarySuggestions
                      jobTitle={formData.title}
                      experience={formData.experience}
                      onSelect={(min, max) => {
                        handleChange('salaryMin', min);
                        handleChange('salaryMax', max);
                        setSalaryError('');
                        toast.success('Fourchette salariale appliquée');
                      }}
                    />
                  )}

                  {(formData.salaryMin && formData.salaryMax && parseFloat(formData.salaryMin) < parseFloat(formData.salaryMax)) && (
                    <div className="p-3 mt-4 border rounded-lg bg-slate-50 border-slate-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Salaire mensuel brut</span>
                        <span className="font-semibold text-slate-900">
                          {new Intl.NumberFormat('fr-FR').format(parseFloat(formData.salaryMin))} - {new Intl.NumberFormat('fr-FR').format(parseFloat(formData.salaryMax))} DT
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-slate-600">Salaire annuel brut estimé</span>
                        <span className="font-semibold text-slate-900">
                          {new Intl.NumberFormat('fr-FR').format(parseFloat(formData.salaryMin) * 12)} - {new Intl.NumberFormat('fr-FR').format(parseFloat(formData.salaryMax) * 12)} DT
                        </span>
                      </div>
                    </div>
                  )}

                  {isStageOrIntern && (
                    <div className="p-3 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                      <p className="text-sm text-blue-700">
                        ℹ️ Pour les stages et alternances, la fourchette salariale n'est pas requise. Vous pourrez définir la gratification ou le salaire dans l'offre.
                      </p>
                    </div>
                  )}
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