//manager soumettre la demande d'emploi et les détails de la demande

import { useState, useEffect } from 'react';
import { 
  X, Briefcase, Building, Users, DollarSign, Calendar, 
  FileText, Target, Zap, AlertCircle, CheckCircle, 
  TrendingUp, Globe, Shield, Clock, Award, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const contractTypes = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'];
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
  'Management', 'Communication', 'Anglais', 'Projet'
];

export default function NewRequestModal({ onClose, onSuccess }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre du poste est requis';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = 'Le département est requis';
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
      
      // Utiliser toast au lieu de alert
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
      onClose(); // Fermer le modal après succès
    } catch (error) {
      console.error('Error creating request:', error);
      
      // Utiliser toast pour l'erreur aussi
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

  const nextStep = () => {
    if (step === 1 && formData.title && formData.department) {
      setStep(2);
    } else if (step === 2 && formData.description) {
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return Target;
      case 2: return FileText;
      case 3: return Users;
      default: return CheckCircle;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/30 my-8">
        {/* En-tête */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-xl border-b border-slate-200/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-white to-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Nouvelle demande de recrutement
                </h3>
                <p className="text-slate-600 mt-1">Formulaire intelligent - Étape {step}/3</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105 group"
            >
              <X className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </button>
          </div>

          {/* Barre de progression */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((stepNumber) => {
                const StepIcon = getStepIcon(stepNumber);
                const isActive = stepNumber <= step;
                const isCurrent = stepNumber === step;
                
                return (
                  <div key={stepNumber} className="flex flex-col items-center relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                        : 'bg-slate-200'
                    } ${isCurrent ? 'scale-110 ring-2 ring-emerald-500/30' : ''}`}>
                      <StepIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className={`text-sm font-medium mt-2 ${
                      isActive ? 'text-emerald-700' : 'text-slate-500'
                    }`}>
                      {stepNumber === 1 ? 'Informations' : stepNumber === 2 ? 'Description' : 'Validation'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Étape 1 : Informations de base */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Titre du poste */}
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <label className="block text-lg font-semibold text-slate-900">Titre du poste</label>
                        <p className="text-sm text-slate-600">Nom précis et attractif</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-50/50 border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all ${
                        errors.title ? 'border-red-300' : 'border-slate-300/70'
                      }`}
                      placeholder="Ex: Développeur Full Stack Senior"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600 flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.title}</span>
                      </p>
                    )}
                  </div>

                  {/* Détails organisationnels */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm">
                      <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-3">
                        <Building className="w-4 h-4" />
                        <span>Direction/Département</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-50/50 border rounded-lg ${
                          errors.department ? 'border-red-300' : 'border-slate-300/70'
                        }`}
                        placeholder="Ex: Direction IT"
                      />
                    </div>

                    <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm">
                      <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-3">
                        <Globe className="w-4 h-4" />
                        <span>Localisation</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-300/70 rounded-lg"
                        placeholder="Ex: Paris, Lyon..."
                      />
                    </div>
                  </div>
                </div>

                {/* Détails du contrat */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border border-blue-200/50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">Détails du contrat</h4>
                        <p className="text-sm text-blue-700">Informations contractuelles</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Type de contrat
                        </label>
                        <select
                          value={formData.contractType}
                          onChange={(e) => handleChange('contractType', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300/70 rounded-lg"
                        >
                          {contractTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Niveau
                        </label>
                        <select
                          value={formData.level}
                          onChange={(e) => handleChange('level', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300/70 rounded-lg"
                        >
                          {['Stagiaire', 'Junior', 'Confirmé', 'Senior', 'Expert', 'Lead'].map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Expérience requise
                        </label>
                        <select
                          value={formData.experience}
                          onChange={(e) => handleChange('experience', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300/70 rounded-lg"
                        >
                          {['0-1 an', '1-3 ans', '3-5 ans', '5-8 ans', '8+ ans'].map(exp => (
                            <option key={exp} value={exp}>{exp}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Date de début souhaitée
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleChange('startDate', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300/70 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Options de travail */}
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
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
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.title || !formData.department}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 : Description et compétences */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Description détaillée */}
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl flex items-center justify-center">
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
                      <p className="mt-2 text-sm text-red-600 flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.description}</span>
                      </p>
                    )}
                    <div className="mt-3 text-sm text-slate-500">
                      <p>💡 Conseils : Soyez précis sur les missions quotidiennes, les résultats attendus, et les compétences techniques requises.</p>
                    </div>
                  </div>

                  {/* Motif de recrutement */}
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center">
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
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-300/70 rounded-lg mb-4"
                    >
                      {recruitmentReasons.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>

                    {/* Champs conditionnels pour remplacement */}
                    {formData.reason === 'Remplacement' && (
                      <div className="space-y-4 mt-4 p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-200/50 rounded-xl">
                        <div>
                          <label className="block text-sm font-medium text-amber-800 mb-2">
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
                          <label className="block text-sm font-medium text-amber-800 mb-2">
                            Raison du remplacement
                          </label>
                          <textarea
                            value={formData.replacementReason}
                            onChange={(e) => handleChange('replacementReason', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg"
                            rows={2}
                            placeholder="Départ, mutation, promotion, arrêt maladie..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compétences requises */}
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center">
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
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                      
                      <textarea
                        value={formData.requiredSkills}
                        onChange={(e) => handleChange('requiredSkills', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-300/70 rounded-lg resize-none"
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
                              className="group flex items-center space-x-1 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 px-3 py-2 rounded-lg"
                            >
                              <span className="text-sm text-blue-700">{skill.trim()}</span>
                              <button
                                type="button"
                                onClick={() => removeSkill(skill.trim())}
                                className="text-blue-500 hover:text-red-500 transition-colors"
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
                    <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <label className="block text-lg font-semibold text-slate-900">Budget annuel (€)</label>
                          <p className="text-sm text-slate-600">Rémunération brute annuelle</p>
                        </div>
                      </div>
                      <input
                        type="number"
                        value={formData.budget}
                        onChange={(e) => handleChange('budget', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-300/70 rounded-lg"
                        placeholder="Ex: 45000"
                      />
                    </div>

                    <div className="bg-gradient-to-br from-red-50/50 to-orange-50/50 border border-red-200/50 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl flex items-center justify-center">
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
                        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700">
                            ⚡ <span className="font-medium">Mode accéléré activé :</span> 
                            La demande sera traitée en priorité avec un délai estimé de 15 jours.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.description}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Aperçu et validation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200/50 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-emerald-900">Aperçu de votre demande</h4>
                    <p className="text-emerald-700">Vérifiez les informations avant soumission</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white/80 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 mb-2">Poste</p>
                      <p className="text-lg font-semibold text-slate-900">{formData.title}</p>
                    </div>
                    
                    <div className="bg-white/80 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 mb-2">Département</p>
                      <p className="font-medium text-slate-900">{formData.department}</p>
                      <p className="text-sm text-slate-600 mt-1">{formData.location}</p>
                    </div>
                    
                    <div className="bg-white/80 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 mb-2">Contrat</p>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-slate-900">{formData.contractType}</span>
                        <span className="text-slate-500">•</span>
                        <span className="font-medium text-slate-900">{formData.level}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-600">{formData.experience}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/80 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 mb-2">Budget estimé</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formData.budget ? `${parseInt(formData.budget).toLocaleString()} €` : 'Non spécifié'}
                      </p>
                    </div>
                    
                    <div className="bg-white/80 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 mb-2">Statut</p>
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full ${formData.urgent ? 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          {formData.urgent ? 'URGENT' : 'STANDARD'}
                        </div>
                        {formData.remote && (
                          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700">
                            TÉLÉTRAVAIL
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white/80 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 mb-2">Début souhaité</p>
                      <p className="font-medium text-slate-900">
                        {new Date(formData.startDate).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Circuit de validation */}
                <div className="mt-8 pt-8 border-t border-emerald-200">
                  <h5 className="font-semibold text-slate-900 mb-4">Circuit de validation</h5>
                  <div className="flex items-center justify-between">
                    {validationLevels.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.level} className="flex flex-col items-center relative">
                          <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center shadow-lg z-10`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-xs font-medium text-slate-700 mt-2">{item.level}</p>
                          {index < validationLevels.length - 1 && (
                            <div className="absolute top-5 left-12 w-16 h-0.5 bg-slate-300"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Retour
                </button>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                  >
                    <span className="relative flex items-center space-x-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            </div>
          )}
        </form>
      </div>
    </div>
  );
}