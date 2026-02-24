//manager soumettre la demande d'emploi et les détails de la demande

import { useState, useEffect } from 'react';
import { 
  X, Briefcase, Building, Users, DollarSign, Calendar, 
  FileText, Target, Zap, AlertCircle, CheckCircle, 
  TrendingUp, Globe, Shield, Clock, Award, Sparkles,
  ChevronDown, Search, MapPin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
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
  'Chargé d\'Affaires',
  
  // Direction & Administration
  'Assistant de Direction',
  'Office Manager',
  'Directeur Général',
  'Directeur Administratif',
  
  // Production & Logistique
  'Ingénieur Production',
  'Chef d\'équipe',
  'Responsable Logistique',
  'Magasinier',
  'Supply Chain Manager',
  'Planificateur',
  
  // Service Client
  'Conseiller Client',
  'Responsable Service Client',
  'Support Technique',
  'Téléconseiller'
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

const contractTypes = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim'];
const recruitmentReasons = [
  'Création de poste', 
  'Remplacement', 
  'Renforcement équipe', 
  'Nouveau projet', 
  'Départ', 
  'Augmentation activité',
  'Spécialisation'
];

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

export default function NewRequestModal({ onClose, onSuccess }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
    department: profile?.department || '',
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
    { level: 'Manager', color: 'bg-emerald-500', icon: Users },
    { level: 'Directeur', color: 'bg-blue-500', icon: Building },
    { level: 'DRH', color: 'bg-violet-500', icon: Shield },
    { level: 'DAF', color: 'bg-amber-500', icon: DollarSign },
    { level: 'DGA/DG', color: 'bg-purple-500', icon: Award }
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
    
    if (formData.reason === 'Remplacement' && !formData.replacementName.trim()) {
      newErrors.replacementName = 'Le nom de la personne remplacée est requis';
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
      const { error } = await supabase.from('recruitment_requests').insert({
        title: formData.title,
        department: formData.department,
        location: formData.location,
        contract_type: formData.contractType,
        reason: formData.reason,
        budget: formData.budget ? parseInt(formData.budget) : null,
        required_skills: formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s),
        description: formData.description,
        urgent: formData.urgent,
        status: 'Open',
        current_validation_level: 'Manager',
        created_by: profile?.id,
        created_by_name: profile?.full_name,
        created_by_role: profile?.role,
        replacement_name: formData.replacementName,
        replacement_reason: formData.replacementReason,
        start_date: formData.startDate,
        level: formData.level,
        experience: formData.experience,
        remote_work: formData.remote,
        travel_required: formData.travelRequired,
        estimated_time: formData.urgent ? '15 jours' : '30 jours'
      });

      if (error) throw error;
      
      toast.success('Demande créée avec succès !', {
        duration: 4000,
        position: 'top-right',
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
        }
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating request:', error);
      
      toast.error('Erreur lors de la création de la demande', {
        duration: 4000,
        position: 'top-right',
        icon: '❌',
        style: {
          background: '#ef4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
        }
      });
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
                            onClick={() => {
                              handleChange('title', job);
                              setShowJobDropdown(false);
                              setSearchJob('');
                            }}
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

              {/* Motif de recrutement */}
              <div className="p-6 bg-white border shadow-sm border-slate-200/70 rounded-2xl">
                <div className="flex items-center mb-4 space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-slate-900">Motif de recrutement</label>
                    <p className="text-sm text-slate-600">Contexte et justification</p>
                  </div>
                </div>
                <select
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  className="w-full px-4 py-3 mb-4 border rounded-lg bg-slate-50/50 border-slate-300/70"
                >
                  {recruitmentReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>

                {/* Champs conditionnels pour remplacement */}
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
            </div>

            {/* Quatrième ligne : Compétences requises */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

            {/* Circuit de validation */}
            <div className="pt-8 mt-8 border-t border-emerald-200">
              <h5 className="mb-4 font-semibold text-slate-900">Circuit de validation</h5>
              <div className="flex items-center justify-between">
                {validationLevels.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.level} className="relative flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center shadow-lg z-10`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-700">{item.level}</p>
                      {index < validationLevels.length - 1 && (
                        <div className="absolute top-5 left-12 w-16 h-0.5 bg-slate-300"></div>
                      )}
                    </div>
                  );
                })}
              </div>
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