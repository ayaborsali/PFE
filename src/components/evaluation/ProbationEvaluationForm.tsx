import { useState } from 'react';
import { 
  X, Save, Send, AlertCircle, CheckCircle, Clock,
  User, Briefcase, Calendar, Star, TrendingUp,
  MessageSquare, Award, Target, ThumbsUp, ThumbsDown,
  AlertTriangle, FileText, Users, GraduationCap,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProbationEvaluationForm({ 
  employee, 
  contract, 
  onClose, 
  onSave 
}) {
  const [formData, setFormData] = useState({
    // Informations générales
    evaluationDate: new Date().toISOString().split('T')[0],
    evaluator: contract?.manager?.first_name + ' ' + contract?.manager?.last_name || '',
    
    // Critères d'évaluation
    professionalSkills: {
      technicalCompetence: 3,
      productivity: 3,
      qualityOfWork: 3,
      problemSolving: 3,
      adaptability: 3,
    },
    
    behavioralSkills: {
      teamwork: 3,
      communication: 3,
      punctuality: 3,
      initiative: 3,
      stressManagement: 3,
    },
    
    integration: {
      companyCulture: 3,
      ruleCompliance: 3,
      relationshipWithColleagues: 3,
      relationshipWithHierarchy: 3,
    },
    
    // Appréciation générale
    strengths: [''],
    areasForImprovement: [''],
    
    // Décision finale
    decision: 'pending', // 'validate', 'extend', 'terminate', 'pending'
    extensionDuration: '',
    comments: '',
    additionalRemarks: '',
    
    // Recommandations
    trainingNeeds: [''],
    objectives: [''],
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const criteriaOptions = [
    { value: 1, label: 'Insuffisant', color: 'red', icon: ThumbsDown },
    { value: 2, label: 'À améliorer', color: 'orange', icon: AlertTriangle },
    { value: 3, label: 'Satisfaisant', color: 'blue', icon: CheckCircle },
    { value: 4, label: 'Bon', color: 'green', icon: Star },
    { value: 5, label: 'Excellent', color: 'emerald', icon: Award },
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedArrayChange = (field, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const calculateSectionAverage = (section) => {
    const values = Object.values(formData[section]);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(1);
  };

  const calculateOverallAverage = () => {
    const profAvg = parseFloat(calculateSectionAverage('professionalSkills'));
    const behavAvg = parseFloat(calculateSectionAverage('behavioralSkills'));
    const integAvg = parseFloat(calculateSectionAverage('integration'));
    return ((profAvg + behavAvg + integAvg) / 3).toFixed(1);
  };

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 4) return 'bg-emerald-100';
    if (score >= 3) return 'bg-blue-100';
    if (score >= 2) return 'bg-amber-100';
    return 'bg-rose-100';
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.decision === 'extend' && !formData.extensionDuration) {
      toast.error('Veuillez indiquer la durée de prolongation');
      return;
    }

    setLoading(true);
    try {
      // Calculer les scores
      const professionalScore = calculateSectionAverage('professionalSkills');
      const behavioralScore = calculateSectionAverage('behavioralSkills');
      const integrationScore = calculateSectionAverage('integration');
      const overallScore = calculateOverallAverage();

      // Préparer les données pour la sauvegarde
      const evaluationData = {
        ...formData,
        scores: {
          professional: professionalScore,
          behavioral: behavioralScore,
          integration: integrationScore,
          overall: overallScore
        },
        submittedAt: new Date().toISOString(),
        employeeId: employee.id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        contractId: contract?.id
      };

      await onSave(evaluationData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde de l\'évaluation');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionColor = (decision) => {
    switch(decision) {
      case 'validate': return 'text-emerald-600 border-emerald-200 bg-emerald-50';
      case 'extend': return 'text-amber-600 border-amber-200 bg-amber-50';
      case 'terminate': return 'text-rose-600 border-rose-200 bg-rose-50';
      default: return 'text-slate-600 border-slate-200 bg-slate-50';
    }
  };

  const getDecisionIcon = (decision) => {
    switch(decision) {
      case 'validate': return CheckCircle;
      case 'extend': return Clock;
      case 'terminate': return AlertCircle;
      default: return AlertTriangle;
    }
  };

  const DecisionIcon = getDecisionIcon(formData.decision);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl mx-4 my-8">
        <div className="overflow-hidden bg-white shadow-2xl rounded-2xl">
          {/* En-tête */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-cyan-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Évaluation de période d'essai
                  </h2>
                  <p className="text-blue-100">
                    {employee.first_name} {employee.last_name} • {employee.position}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 transition-colors rounded-lg hover:bg-white/20"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Informations employé */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b bg-slate-50 border-slate-200">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Employé:</span>
              <span className="text-sm font-medium text-slate-900">
                {employee.first_name} {employee.last_name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Poste:</span>
              <span className="text-sm font-medium text-slate-900">{employee.position}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Date d'évaluation:</span>
              <input
                type="date"
                value={formData.evaluationDate}
                onChange={(e) => setFormData({...formData, evaluationDate: e.target.value})}
                className="text-sm font-medium bg-transparent border-0 text-slate-900 focus:ring-0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Fin période d'essai:</span>
              <span className="text-sm font-medium text-slate-900">
                {new Date(employee.probation_end_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Barre de progression (supprimée - plus nécessaire) */}

          {/* Contenu du formulaire - TOUTES LES SECTIONS AFFICHÉES */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Compétences professionnelles */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Compétences professionnelles
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">Moyenne:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getScoreBgColor(calculateSectionAverage('professionalSkills'))
                  } ${getScoreColor(calculateSectionAverage('professionalSkills'))}`}>
                    {calculateSectionAverage('professionalSkills')}/5
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {Object.entries(formData.professionalSkills).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-700">
                        {key === 'technicalCompetence' && 'Compétence technique'}
                        {key === 'productivity' && 'Productivité'}
                        {key === 'qualityOfWork' && 'Qualité du travail'}
                        {key === 'problemSolving' && 'Résolution de problèmes'}
                        {key === 'adaptability' && 'Adaptabilité'}
                      </label>
                      <span className={`text-sm font-medium ${
                        getScoreColor(value)
                      }`}>
                        {value}/5
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleInputChange('professionalSkills', key, score)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            value === score
                              ? `bg-${criteriaOptions[score-1].color}-500 text-white shadow-md`
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {criteriaOptions[value-1].label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Compétences comportementales */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Compétences comportementales
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">Moyenne:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getScoreBgColor(calculateSectionAverage('behavioralSkills'))
                  } ${getScoreColor(calculateSectionAverage('behavioralSkills'))}`}>
                    {calculateSectionAverage('behavioralSkills')}/5
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {Object.entries(formData.behavioralSkills).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-700">
                        {key === 'teamwork' && 'Travail en équipe'}
                        {key === 'communication' && 'Communication'}
                        {key === 'punctuality' && 'Ponctualité / Assiduité'}
                        {key === 'initiative' && 'Initiative / Proactivité'}
                        {key === 'stressManagement' && 'Gestion du stress'}
                      </label>
                      <span className={`text-sm font-medium ${
                        getScoreColor(value)
                      }`}>
                        {value}/5
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleInputChange('behavioralSkills', key, score)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            value === score
                              ? `bg-${criteriaOptions[score-1].color}-500 text-white shadow-md`
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {criteriaOptions[value-1].label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Intégration */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Intégration dans l'entreprise
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">Moyenne:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getScoreBgColor(calculateSectionAverage('integration'))
                  } ${getScoreColor(calculateSectionAverage('integration'))}`}>
                    {calculateSectionAverage('integration')}/5
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {Object.entries(formData.integration).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-700">
                        {key === 'companyCulture' && 'Culture d\'entreprise'}
                        {key === 'ruleCompliance' && 'Respect des règles'}
                        {key === 'relationshipWithColleagues' && 'Relations avec collègues'}
                        {key === 'relationshipWithHierarchy' && 'Relations avec hiérarchie'}
                      </label>
                      <span className={`text-sm font-medium ${
                        getScoreColor(value)
                      }`}>
                        {value}/5
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleInputChange('integration', key, score)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            value === score
                              ? `bg-${criteriaOptions[score-1].color}-500 text-white shadow-md`
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {criteriaOptions[value-1].label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Score global */}
            <div className="mb-8">
              <div className="p-6 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900">Score global</h4>
                    <p className="text-sm text-blue-700">Moyenne générale de l'évaluation</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(calculateOverallAverage())}`}>
                      {calculateOverallAverage()}
                    </div>
                    <p className="text-sm text-slate-600">/5</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Professionnel</p>
                    <p className={`text-lg font-semibold ${getScoreColor(calculateSectionAverage('professionalSkills'))}`}>
                      {calculateSectionAverage('professionalSkills')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Comportemental</p>
                    <p className={`text-lg font-semibold ${getScoreColor(calculateSectionAverage('behavioralSkills'))}`}>
                      {calculateSectionAverage('behavioralSkills')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Intégration</p>
                    <p className={`text-lg font-semibold ${getScoreColor(calculateSectionAverage('integration'))}`}>
                      {calculateSectionAverage('integration')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Points forts */}
            <div className="mb-8">
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Points forts
              </label>
              {formData.strengths.map((strength, index) => (
                <div key={index} className="flex mb-2 space-x-2">
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => handleNestedArrayChange('strengths', index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Bonne capacité d'adaptation..."
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('strengths', index)}
                    className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('strengths')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                + Ajouter un point fort
              </button>
            </div>

            {/* Axes d'amélioration */}
            <div className="mb-8">
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Axes d'amélioration
              </label>
              {formData.areasForImprovement.map((area, index) => (
                <div key={index} className="flex mb-2 space-x-2">
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => handleNestedArrayChange('areasForImprovement', index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Renforcer la communication..."
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('areasForImprovement', index)}
                    className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('areasForImprovement')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                + Ajouter un axe d'amélioration
              </button>
            </div>

            {/* Décision finale */}
            <div className="mb-8">
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Décision finale
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'validate', label: 'Valider la période d\'essai', icon: CheckCircle, color: 'emerald' },
                  { value: 'extend', label: 'Prolonger la période d\'essai', icon: Clock, color: 'amber' },
                  { value: 'terminate', label: 'Mettre fin à la période d\'essai', icon: AlertCircle, color: 'rose' },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.decision === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFormData({...formData, decision: option.value})}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        isSelected ? `text-${option.color}-600` : 'text-slate-400'
                      }`} />
                      <p className={`text-sm font-medium ${
                        isSelected ? `text-${option.color}-700` : 'text-slate-600'
                      }`}>
                        {option.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              {formData.decision === 'extend' && (
                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Durée de prolongation
                  </label>
                  <select
                    value={formData.extensionDuration}
                    onChange={(e) => setFormData({...formData, extensionDuration: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une durée</option>
                    <option value="1month">1 mois</option>
                    <option value="2months">2 mois</option>
                    <option value="3months">3 mois</option>
                  </select>
                </div>
              )}
            </div>

            {/* Commentaires */}
            <div className="mb-8">
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Commentaires généraux
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Ajoutez vos commentaires sur l'évaluation..."
              />
            </div>

            {/* Remarques additionnelles */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Remarques additionnelles
              </label>
              <textarea
                value={formData.additionalRemarks}
                onChange={(e) => setFormData({...formData, additionalRemarks: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>

          {/* Pied de page avec navigation simplifiée */}
          <div className="flex items-center justify-end px-6 py-4 border-t bg-slate-50 border-slate-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Annuler
              </button>
              
              <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="flex items-center px-6 py-2 space-x-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enregistrer l'évaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation (identique) */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white rounded-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            
            <h3 className="mb-2 text-xl font-bold text-center text-slate-900">
              Confirmer l'évaluation
            </h3>
            
            <p className="mb-6 text-center text-slate-600">
              Vous êtes sur le point de finaliser l'évaluation de période d'essai pour{' '}
              <span className="font-semibold">{employee.first_name} {employee.last_name}</span>.
              Cette action est irréversible.
            </p>

            <div className={`p-4 mb-6 rounded-lg ${getDecisionColor(formData.decision)}`}>
              <div className="flex items-center space-x-3">
                <DecisionIcon className={`w-5 h-5 ${
                  formData.decision === 'validate' ? 'text-emerald-600' :
                  formData.decision === 'extend' ? 'text-amber-600' :
                  'text-rose-600'
                }`} />
                <div>
                  <p className="text-sm font-medium">
                    {formData.decision === 'validate' && 'Validation de la période d\'essai'}
                    {formData.decision === 'extend' && 'Prolongation de la période d\'essai'}
                    {formData.decision === 'terminate' && 'Fin de la période d\'essai'}
                  </p>
                  {formData.decision === 'extend' && formData.extensionDuration && (
                    <p className="text-xs opacity-75">
                      Durée: {
                        formData.extensionDuration === '1month' ? '1 mois' :
                        formData.extensionDuration === '2months' ? '2 mois' : '3 mois'
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}