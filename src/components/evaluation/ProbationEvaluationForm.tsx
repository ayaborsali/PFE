import { useState } from 'react';
import { 
  X, Save, Send, AlertCircle, CheckCircle, Clock,
  User, Briefcase, Calendar, Star, TrendingUp,
  MessageSquare, Award, Target, ThumbsUp, ThumbsDown,
  AlertTriangle, FileText, Users, GraduationCap,
  ChevronRight, ChevronLeft, Sparkles, Zap, Heart,
  Lightbulb, Rocket, Shield, Coffee, Users2, Brain,
  Target as TargetIcon, Trophy, Medal, ThumbsUp as ThumbsUpIcon,
  BarChart3, PieChart, Activity, TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProbationEvaluationForm({ 
  employee, 
  contract, 
  onClose, 
  onSave 
}) {
  const [formData, setFormData] = useState({
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
    
    strengths: [''],
    areasForImprovement: [''],
    
    decision: 'pending',
    extensionDuration: '',
    comments: '',
    additionalRemarks: '',
    
    trainingNeeds: [''],
    objectives: [''],
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState('professionalSkills');

  // Configuration détaillée des critères d'évaluation
  const evaluationCriteria = {
    professionalSkills: {
      title: 'Compétences professionnelles',
      icon: Briefcase,
      color: 'blue',
      description: 'Évaluation des compétences techniques et de la performance',
      items: [
        { 
          key: 'technicalCompetence', 
          label: 'Compétence technique',
          description: 'Maîtrise des outils, technologies et méthodes propres au poste',
          icon: Brain,
          levels: [
            'Maîtrise insuffisante des outils de base',
            'Connaissances de base acquises, besoin d\'accompagnement',
            'Bonne maîtrise des outils courants',
            'Excellente maîtrise technique, autonome',
            'Expert reconnu, force de proposition'
          ]
        },
        { 
          key: 'productivity', 
          label: 'Productivité',
          description: 'Volume de travail et respect des délais',
          icon: Zap,
          levels: [
            'Production très insuffisante',
            'Production en dessous des attentes',
            'Production conforme aux objectifs',
            'Production supérieure aux attentes',
            'Production exceptionnelle'
          ]
        },
        { 
          key: 'qualityOfWork', 
          label: 'Qualité du travail',
          description: 'Précision, soin et fiabilité des livrables',
          icon: Trophy,
          levels: [
            'Travail bâclé, nombreuses erreurs',
            'Qualité irrégulière, besoin de contrôle',
            'Travail soigné et conforme',
            'Très bonne qualité, peu d\'erreurs',
            'Excellence, travail sans faille'
          ]
        },
        { 
          key: 'problemSolving', 
          label: 'Résolution de problèmes',
          description: 'Capacité à analyser et résoudre les difficultés',
          icon: Lightbulb,
          levels: [
            'Bloqué face aux problèmes',
            'Difficulté à trouver des solutions',
            'Résout les problèmes courants',
            'Propose des solutions pertinentes',
            'Anticipe et résout proactivement'
          ]
        },
        { 
          key: 'adaptability', 
          label: 'Adaptabilité',
          description: 'Capacité à s\'adapter aux changements',
          icon: TargetIcon,
          levels: [
            'Résiste au changement',
            'S\'adapte difficilement',
            'S\'adapte aux changements',
            'S\'adapte rapidement',
            'Proactif face aux changements'
          ]
        },
      ]
    },
    behavioralSkills: {
      title: 'Compétences comportementales',
      icon: Heart,
      color: 'violet',
      description: 'Évaluation des soft skills et du savoir-être',
      items: [
        { 
          key: 'teamwork', 
          label: 'Travail en équipe',
          description: 'Collaboration et esprit d\'équipe',
          icon: Users2,
          levels: [
            'Travaille en isolation',
            'Difficulté à collaborer',
            'Bon esprit d\'équipe',
            'Très bonne collaboration',
            'Fédère et motive l\'équipe'
          ]
        },
        { 
          key: 'communication', 
          label: 'Communication',
          description: 'Clarté et qualité des échanges',
          icon: MessageSquare,
          levels: [
            'Communication problématique',
            'Communication à améliorer',
            'Communication claire',
            'Très bonne communicante',
            'Excellent communicateur'
          ]
        },
        { 
          key: 'punctuality', 
          label: 'Ponctualité / Assiduité',
          description: 'Respect des horaires et présence',
          icon: Clock,
          levels: [
            'Absentéisme fréquent',
            'Retards réguliers',
            'Ponctuel et assidu',
            'Très ponctuel, fiable',
            'Exemplaire'
          ]
        },
        { 
          key: 'initiative', 
          label: 'Initiative / Proactivité',
          description: 'Capacité à proposer et agir',
          icon: Rocket,
          levels: [
            'Aucune initiative',
            'Rarement proactif',
            'Prend des initiatives',
            'Très proactif',
            'Force de proposition constante'
          ]
        },
        { 
          key: 'stressManagement', 
          label: 'Gestion du stress',
          description: 'Comportement sous pression',
          icon: Shield,
          levels: [
            'Débordé facilement',
            'Stress visible',
            'Gère le stress',
            'Très bonne gestion',
            'Imperturbable'
          ]
        },
      ]
    },
    integration: {
      title: 'Intégration dans l\'entreprise',
      icon: Coffee,
      color: 'amber',
      description: 'Évaluation de l\'intégration et des relations',
      items: [
        { 
          key: 'companyCulture', 
          label: 'Culture d\'entreprise',
          description: 'Adhésion aux valeurs et culture',
          icon: Users,
          levels: [
            'Rejet des valeurs',
            'Compréhension limitée',
            'Bonne adhésion',
            'Très bonne intégration',
            'Ambassadeur des valeurs'
          ]
        },
        { 
          key: 'ruleCompliance', 
          label: 'Respect des règles',
          description: 'Application des procédures',
          icon: Shield,
          levels: [
            'Non-respect constant',
            'Respect insuffisant',
            'Respecte les règles',
            'Applique rigoureusement',
            'Exemplaire'
          ]
        },
        { 
          key: 'relationshipWithColleagues', 
          label: 'Relations avec collègues',
          description: 'Qualité des interactions',
          icon: Users2,
          levels: [
            'Relations conflictuelles',
            'Relations distantes',
            'Bonnes relations',
            'Très bonnes relations',
            'Apprécié de tous'
          ]
        },
        { 
          key: 'relationshipWithHierarchy', 
          label: 'Relations avec hiérarchie',
          description: 'Qualité des échanges avec N+1',
          icon: User,
          levels: [
            'Relations conflictuelles',
            'Communication limitée',
            'Bon échange',
            'Très bonne relation',
            'Relation de confiance'
          ]
        },
      ]
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-emerald-600';
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 4.5) return 'bg-emerald-100';
    if (score >= 4) return 'bg-green-100';
    if (score >= 3) return 'bg-blue-100';
    if (score >= 2) return 'bg-amber-100';
    return 'bg-rose-100';
  };

  const getScoreGradient = (score) => {
    if (score >= 4) return 'from-green-500 to-emerald-500';
    if (score >= 3) return 'from-blue-500 to-cyan-500';
    if (score >= 2) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
  };

  const getScoreIcon = (score) => {
    if (score >= 4.5) return Trophy;
    if (score >= 4) return Award;
    if (score >= 3) return ThumbsUp;
    if (score >= 2) return TrendingDown;
    return AlertTriangle;
  };

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

  const handleSubmit = async () => {
    if (formData.decision === 'extend' && !formData.extensionDuration) {
      toast.error('Veuillez indiquer la durée de prolongation');
      return;
    }

    setLoading(true);
    try {
      const professionalScore = calculateSectionAverage('professionalSkills');
      const behavioralScore = calculateSectionAverage('behavioralSkills');
      const integrationScore = calculateSectionAverage('integration');
      const overallScore = calculateOverallAverage();

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

  // Composant pour afficher une jauge de progression
  const ScoreGauge = ({ score }) => {
    const percentage = (score / 5) * 100;
    const ScoreIcon = getScoreIcon(score);
    
    return (
      <div className="relative flex items-center justify-center w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-slate-200"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - percentage / 100)}`}
            className={`text-${getScoreColor(score).replace('text-', '')}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <ScoreIcon className={`w-4 h-4 ${getScoreColor(score)}`} />
        </div>
      </div>
    );
  };

  // Composant pour les boutons de notation
  const RatingButton = ({ score, currentValue, onClick, label }) => {
    const isSelected = currentValue === score;
    const colors = [
      { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', hover: 'hover:bg-rose-200' },
      { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', hover: 'hover:bg-orange-200' },
      { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', hover: 'hover:bg-blue-200' },
      { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', hover: 'hover:bg-green-200' },
      { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', hover: 'hover:bg-emerald-200' },
    ];

    return (
      <button
        onClick={() => onClick(score)}
        className={`relative flex-1 py-3 rounded-lg font-medium transition-all ${
          isSelected
            ? `${colors[score-1].bg} ${colors[score-1].border} border-2 scale-105 shadow-md`
            : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <div className="flex flex-col items-center">
          <span className={`text-lg font-bold ${isSelected ? colors[score-1].text : 'text-slate-700'}`}>
            {score}
          </span>
          <span className={`text-xs ${isSelected ? colors[score-1].text : 'text-slate-500'}`}>
            {label}
          </span>
        </div>
        {isSelected && (
          <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">
            <CheckCircle className={`w-4 h-4 ${colors[score-1].text}`} />
          </div>
        )}
      </button>
    );
  };

  const overallScore = calculateOverallAverage();
  const OverallScoreIcon = getScoreIcon(overallScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-6xl mx-4 my-8">
        <div className="overflow-hidden bg-white shadow-2xl rounded-2xl">
          {/* En-tête */}
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-white">
                      Évaluation de période d'essai
                    </h2>
                  </div>
                  <p className="text-indigo-100">
                    {employee.first_name} {employee.last_name} • {employee.position}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 transition-all rounded-lg hover:bg-white/20 hover:scale-110"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Score global */}
          <div className="px-8 py-4 border-b bg-gradient-to-r from-indigo-50 to-cyan-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${getScoreBgColor(overallScore)}`}>
                  <OverallScoreIcon className={`w-6 h-6 ${getScoreColor(overallScore)}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Score global</p>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                      {overallScore}
                    </span>
                    <span className="text-sm text-slate-500">/5</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-6">
                {Object.entries(evaluationCriteria).map(([key, section]) => {
                  const avg = calculateSectionAverage(key);
                  return (
                    <div key={key} className="text-center">
                      <p className="text-xs text-slate-500">{section.title}</p>
                      <p className={`text-lg font-semibold ${getScoreColor(avg)}`}>
                        {avg}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation des sections */}
          <div className="flex px-8 pt-4 space-x-2 border-b border-slate-200">
            {Object.entries(evaluationCriteria).map(([key, section]) => {
              const Icon = section.icon;
              const avg = calculateSectionAverage(key);
              const isActive = activeSection === key;
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition-all ${
                    isActive
                      ? `bg-${section.color}-50 text-${section.color}-700 border-b-2 border-${section.color}-500`
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? `text-${section.color}-600` : 'text-slate-400'}`} />
                  <span className="text-sm font-medium">{section.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getScoreBgColor(avg)} ${getScoreColor(avg)}`}>
                    {avg}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Contenu du formulaire */}
          <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
            {/* Afficher la section active uniquement */}
            {Object.entries(evaluationCriteria).map(([sectionKey, section]) => {
              if (sectionKey !== activeSection) return null;
              
              const Icon = section.icon;
              const sectionAvg = calculateSectionAverage(sectionKey);
              
              return (
                <div key={sectionKey} className="space-y-6">
                  {/* En-tête de section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl bg-${section.color}-100`}>
                        <Icon className={`w-6 h-6 text-${section.color}-600`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                        <p className="text-sm text-slate-500">{section.description}</p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${getScoreBgColor(sectionAvg)}`}>
                      <span className={`text-sm font-medium ${getScoreColor(sectionAvg)}`}>
                        Moyenne: {sectionAvg}/5
                      </span>
                    </div>
                  </div>

                  {/* Grille des critères */}
                  <div className="grid grid-cols-1 gap-6">
                    {section.items.map((criterion) => {
                      const CriterionIcon = criterion.icon;
                      const value = formData[sectionKey][criterion.key];
                      const currentLevel = criterion.levels[value - 1];
                      
                      return (
                        <div
                          key={criterion.key}
                          className="p-6 transition-all bg-white border rounded-xl border-slate-200 hover:border-slate-300 hover:shadow-md"
                        >
                          {/* En-tête du critère */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg bg-${section.color}-50`}>
                                <CriterionIcon className={`w-5 h-5 text-${section.color}-600`} />
                              </div>
                              <div>
                                <h4 className="text-base font-semibold text-slate-900">
                                  {criterion.label}
                                </h4>
                                <p className="text-sm text-slate-500">
                                  {criterion.description}
                                </p>
                              </div>
                            </div>
                            <ScoreGauge score={value} />
                          </div>

                          {/* Barre de progression visuelle */}
                          <div className="mb-4">
                            <div className="flex justify-between mb-1 text-xs text-slate-500">
                              <span>Insuffisant</span>
                              <span>Excellent</span>
                            </div>
                            <div className="relative h-2 rounded-full bg-slate-200">
                              <div
                                className={`absolute h-2 rounded-full bg-gradient-to-r ${getScoreGradient(value)}`}
                                style={{ width: `${(value / 5) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Niveau actuel avec description */}
                          <div className={`p-3 mb-4 rounded-lg ${getScoreBgColor(value)}`}>
                            <p className={`text-sm font-medium ${getScoreColor(value)}`}>
                              {currentLevel}
                            </p>
                          </div>

                          {/* Boutons de notation */}
                          <div className="flex space-x-2">
                            <RatingButton
                              score={1}
                              currentValue={value}
                              onClick={(score) => handleInputChange(sectionKey, criterion.key, score)}
                              label="Insuffisant"
                            />
                            <RatingButton
                              score={2}
                              currentValue={value}
                              onClick={(score) => handleInputChange(sectionKey, criterion.key, score)}
                              label="À améliorer"
                            />
                            <RatingButton
                              score={3}
                              currentValue={value}
                              onClick={(score) => handleInputChange(sectionKey, criterion.key, score)}
                              label="Satisfaisant"
                            />
                            <RatingButton
                              score={4}
                              currentValue={value}
                              onClick={(score) => handleInputChange(sectionKey, criterion.key, score)}
                              label="Bon"
                            />
                            <RatingButton
                              score={5}
                              currentValue={value}
                              onClick={(score) => handleInputChange(sectionKey, criterion.key, score)}
                              label="Excellent"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pied de page */}
          <div className="flex items-center justify-between px-8 py-4 border-t bg-slate-50 border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-200"
            >
              Annuler
            </button>
            
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="flex items-center px-6 py-2 space-x-2 text-sm font-medium text-white rounded-lg shadow-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 shadow-emerald-500/30"
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

      {/* Modal de confirmation (simplifié) */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100">
              <AlertTriangle className="w-10 h-10 text-amber-600" />
            </div>
            
            <h3 className="mb-2 text-xl font-bold text-center text-slate-900">
              Confirmer l'évaluation
            </h3>
            
            <p className="mb-6 text-center text-slate-600">
              Vous êtes sur le point de finaliser l'évaluation pour{' '}
              <span className="font-semibold text-indigo-600">
                {employee.first_name} {employee.last_name}
              </span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-3 text-sm font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-3 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50"
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