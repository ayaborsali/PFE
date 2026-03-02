import { useState, useEffect } from 'react';
import { 
  X, Check, Clock, User, FileText, Calendar, Target, 
  MessageSquare, ArrowRight, Shield, Award, AlertCircle, UserCheck,
  Star, TrendingUp, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  evaluation: any;
  onClose: () => void;
  onUpdate: () => void;
  onValidationAction?: (evaluationId: string, action: string, level: string, comments?: string) => Promise<void>;
  profile?: any;
}

const validationLevels = ['Manager', 'Directeur', 'DRH', 'DAF', 'DGA', 'DG'];
const roleColors: Record<string, string> = {
  'Manager': 'bg-emerald-100 text-emerald-700',
  'Directeur': 'bg-blue-100 text-blue-700',
  'DRH': 'bg-violet-100 text-violet-700',
  'DAF': 'bg-amber-100 text-amber-700',
  'DGA': 'bg-rose-100 text-rose-700',
  'DG': 'bg-indigo-100 text-indigo-700'
};

export default function EvaluationDetailModal({ evaluation, onClose, onUpdate, onValidationAction, profile }: Props) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [validations, setValidations] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    fetchValidations();
    const stepIndex = validationLevels.indexOf(evaluation.current_validation_level);
    setCurrentStep(stepIndex > -1 ? stepIndex : 0);
  }, [evaluation.id]);

  const fetchValidations = async () => {
    const { data } = await supabase
      .from('validation_workflows')
      .select('*, profiles(full_name, role, department)')
      .eq('request_id', evaluation.id)
      .eq('request_type', 'Evaluation')
      .order('created_at', { ascending: true });

    setValidations(data || []);
  };

  const canValidate = profile?.role === evaluation.current_validation_level && evaluation.status !== 'Completed';

  const handleValidate = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }
    
    setLoading(true);
    try {
      await supabase.from('validation_workflows').insert({
        request_id: evaluation.id,
        request_type: 'Evaluation',
        validator_id: profile?.id,
        validator_role: profile?.role,
        action: 'Approved',
        comment: comment.trim(),
        action_date: new Date().toISOString(),
      });

      const currentLevelIndex = validationLevels.indexOf(evaluation.current_validation_level);
      const nextLevel = currentLevelIndex < validationLevels.length - 1
        ? validationLevels[currentLevelIndex + 1]
        : evaluation.current_validation_level;

      await supabase
        .from('evaluations')
        .update({
          current_validation_level: nextLevel,
          status: currentLevelIndex === validationLevels.length - 1 ? 'Completed' : 'InProgress',
          completed_at: currentLevelIndex === validationLevels.length - 1 ? new Date().toISOString() : null,
        })
        .eq('id', evaluation.id);

      toast.success('Évaluation validée avec succès');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error validating:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }
    
    setLoading(true);
    try {
      await supabase.from('validation_workflows').insert({
        request_id: evaluation.id,
        request_type: 'Evaluation',
        validator_id: profile?.id,
        validator_role: profile?.role,
        action: 'Rejected',
        comment: comment.trim(),
        action_date: new Date().toISOString(),
      });

      await supabase
        .from('evaluations')
        .update({
          status: 'Rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: profile?.id,
        })
        .eq('id', evaluation.id);

      toast.success('Évaluation refusée');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Erreur lors du refus');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'InProgress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-emerald-600';
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-amber-600';
    return 'text-rose-600';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const averageScore = evaluation.final_score || 
    (evaluation.probation_data?.scores?.overall || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
                Détails de l'évaluation
              </h3>
              <div className="flex items-center mt-1 space-x-3">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(evaluation.status)}`}>
                  {evaluation.status === 'draft' ? 'Brouillon' :
                   evaluation.status === 'pending_n1' ? 'En attente N+1' :
                   evaluation.status === 'pending_n2' ? 'En attente N+2' :
                   evaluation.status === 'pending_drh' ? 'En attente DRH' :
                   evaluation.status === 'pending_daf' ? 'En attente DAF' :
                   evaluation.status === 'pending_dga' ? 'En attente DGA' :
                   evaluation.status === 'completed' ? 'Terminée' : evaluation.status}
                </span>
                <div className="flex items-center space-x-1 text-sm text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Échéance: {formatDate(evaluation.due_date)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 transition-all duration-200 hover:bg-slate-100 rounded-xl hover:scale-105"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Barre de progression */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900">Circuit de validation</h4>
                <span className="text-sm text-slate-500">Étape {currentStep + 1}/{validationLevels.length}</span>
              </div>
              
              <div className="relative">
                <div className="absolute left-0 right-0 h-1 top-4 bg-slate-200"></div>
                <div className="absolute left-0 h-1 top-4 bg-gradient-to-r from-blue-500 to-indigo-600" 
                  style={{ width: `${(currentStep / (validationLevels.length - 1)) * 100}%` }}>
                </div>
                
                <div className="relative z-10 flex justify-between">
                  {validationLevels.map((level, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isValidated = validations.some(v => v.validator_role === level);
                    
                    return (
                      <div key={level} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-600 shadow-lg shadow-emerald-500/30' 
                            : isCurrent
                            ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/30'
                            : 'bg-white border-slate-300'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse"></div>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                          )}
                        </div>
                        <span className={`text-xs font-medium mt-2 ${
                          isCompleted ? 'text-emerald-700' : 
                          isCurrent ? 'text-blue-600 font-bold' : 
                          'text-slate-500'
                        }`}>
                          {level}
                        </span>
                        {isValidated && (
                          <div className="mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Score global */}
            {averageScore > 0 && (
              <div className="p-6 border bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${
                      averageScore >= 4 ? 'bg-emerald-100' :
                      averageScore >= 3 ? 'bg-blue-100' :
                      'bg-amber-100'
                    }`}>
                      <Award className={`w-6 h-6 ${
                        averageScore >= 4 ? 'text-emerald-600' :
                        averageScore >= 3 ? 'text-blue-600' :
                        'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Score global</p>
                      <div className="flex items-baseline space-x-2">
                        <span className={`text-3xl font-bold ${
                          averageScore >= 4 ? 'text-emerald-600' :
                          averageScore >= 3 ? 'text-blue-600' :
                          'text-amber-600'
                        }`}>
                          {averageScore}
                        </span>
                        <span className="text-sm text-slate-500">/5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    {evaluation.probation_data?.scores && (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Professionnel</p>
                          <p className={`text-lg font-semibold ${getScoreColor(evaluation.probation_data.scores.professional)}`}>
                            {evaluation.probation_data.scores.professional}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Comportemental</p>
                          <p className={`text-lg font-semibold ${getScoreColor(evaluation.probation_data.scores.behavioral)}`}>
                            {evaluation.probation_data.scores.behavioral}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Intégration</p>
                          <p className={`text-lg font-semibold ${getScoreColor(evaluation.probation_data.scores.integration)}`}>
                            {evaluation.probation_data.scores.integration}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Informations principales */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Employé évalué</p>
                    <p className="text-lg font-bold text-slate-900">
                      {evaluation.employee?.full_name || 'Non spécifié'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {evaluation.job_title || evaluation.employee?.position}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Manager évaluateur</p>
                    <p className="text-lg font-bold text-slate-900">
                      {evaluation.manager?.full_name || 'Non spécifié'}
                    </p>
                    <p className="text-sm text-slate-600">{evaluation.manager?.department}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-violet-100">
                    <Target className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Motif d'évaluation</p>
                    <p className="text-lg font-bold text-slate-900">
                      {evaluation.evaluation_reason || evaluation.evaluation_type}
                    </p>
                    <p className="text-sm text-slate-600">
                      {evaluation.evaluation_type === 'probation' ? 'Fin de période d\'essai' :
                       evaluation.evaluation_type === 'contract_end' ? 'Fin de contrat' :
                       evaluation.evaluation_type === 'annual' ? 'Annuelle' :
                       evaluation.evaluation_type}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Dates importantes</p>
                    <p className="font-bold text-slate-900">
                      Créée le: {formatDate(evaluation.created_at)}
                    </p>
                    <p className="font-bold text-slate-900">
                      Échéance: {formatDate(evaluation.due_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Données de l'évaluation (pour période d'essai) */}
            {evaluation.probation_data && (
              <div className="space-y-6">
                {/* Compétences professionnelles */}
                {evaluation.probation_data.professionalSkills && (
                  <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                    <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-slate-900">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <span>Compétences professionnelles</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {Object.entries(evaluation.probation_data.professionalSkills).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-sm font-medium text-slate-700">
                            {key === 'technicalCompetence' ? 'Compétence technique' :
                             key === 'productivity' ? 'Productivité' :
                             key === 'qualityOfWork' ? 'Qualité du travail' :
                             key === 'problemSolving' ? 'Résolution de problèmes' :
                             key === 'adaptability' ? 'Adaptabilité' : key}
                          </span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (value as number)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compétences comportementales */}
                {evaluation.probation_data.behavioralSkills && (
                  <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                    <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-slate-900">
                      <Heart className="w-5 h-5 text-violet-600" />
                      <span>Compétences comportementales</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {Object.entries(evaluation.probation_data.behavioralSkills).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-sm font-medium text-slate-700">
                            {key === 'teamwork' ? 'Travail en équipe' :
                             key === 'communication' ? 'Communication' :
                             key === 'punctuality' ? 'Ponctualité' :
                             key === 'initiative' ? 'Initiative' :
                             key === 'stressManagement' ? 'Gestion du stress' : key}
                          </span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (value as number)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Intégration */}
                {evaluation.probation_data.integration && (
                  <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                    <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-slate-900">
                      <Coffee className="w-5 h-5 text-amber-600" />
                      <span>Intégration dans l'entreprise</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {Object.entries(evaluation.probation_data.integration).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <span className="text-sm font-medium text-slate-700">
                            {key === 'companyCulture' ? 'Culture d\'entreprise' :
                             key === 'ruleCompliance' ? 'Respect des règles' :
                             key === 'relationshipWithColleagues' ? 'Relations collègues' :
                             key === 'relationshipWithHierarchy' ? 'Relations hiérarchie' : key}
                          </span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (value as number)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Points forts et axes d'amélioration */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {evaluation.probation_data.strengths && evaluation.probation_data.strengths.length > 0 && (
                    <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                      <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                        <ThumbsUp className="w-5 h-5 text-emerald-600" />
                        <span>Points forts</span>
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.probation_data.strengths.map((strength: string, index: number) => (
                          strength.trim() !== '' && (
                            <li key={index} className="flex items-start space-x-2 text-sm text-slate-700">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></div>
                              <span>{strength}</span>
                            </li>
                          )
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.probation_data.areasForImprovement && evaluation.probation_data.areasForImprovement.length > 0 && (
                    <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                      <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                        <ThumbsDown className="w-5 h-5 text-amber-600" />
                        <span>Axes d'amélioration</span>
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.probation_data.areasForImprovement.map((area: string, index: number) => (
                          area.trim() !== '' && (
                            <li key={index} className="flex items-start space-x-2 text-sm text-slate-700">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div>
                              <span>{area}</span>
                            </li>
                          )
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Commentaires généraux */}
                {evaluation.probation_data.comments && (
                  <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                    <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span>Commentaires généraux</span>
                    </h4>
                    <p className="text-sm text-slate-700">{evaluation.probation_data.comments}</p>
                  </div>
                )}

                {/* Décision */}
                {evaluation.probation_data.decision && (
                  <div className="p-5 border bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200/50 rounded-xl">
                    <h4 className="flex items-center mb-3 space-x-2 font-semibold text-indigo-900">
                      <Award className="w-5 h-5 text-indigo-600" />
                      <span>Décision finale</span>
                    </h4>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        evaluation.probation_data.decision === 'validate' ? 'bg-emerald-100 text-emerald-700' :
                        evaluation.probation_data.decision === 'extend' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {evaluation.probation_data.decision === 'validate' ? 'Période d\'essai validée' :
                         evaluation.probation_data.decision === 'extend' ? `Prolongée (${evaluation.probation_data.extensionDuration})` :
                         'Période d\'essai non validée'}
                      </span>
                      {evaluation.probation_data.extensionDuration && (
                        <span className="text-sm text-slate-600">
                          Durée: {
                            evaluation.probation_data.extensionDuration === '1month' ? '1 mois' :
                            evaluation.probation_data.extensionDuration === '2months' ? '2 mois' :
                            evaluation.probation_data.extensionDuration === '3months' ? '3 mois' :
                            evaluation.probation_data.extensionDuration
                          }
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Historique des validations */}
            {validations.length > 0 && (
              <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-slate-900">
                  <Shield className="w-5 h-5 text-slate-700" />
                  <span>Historique des validations</span>
                </h4>
                
                <div className="space-y-3">
                  {validations.map((validation, index) => (
                    <div key={validation.id} className="flex items-start p-3 space-x-3 rounded-lg bg-slate-50">
                      <div className={`p-1.5 rounded ${
                        validation.action === 'Approved' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {validation.action === 'Approved' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900">
                            {validation.profiles?.full_name} ({validation.validator_role})
                          </p>
                          <span className="text-xs text-slate-500">
                            {new Date(validation.action_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            validation.action === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {validation.action}
                          </span>
                        </div>
                        {validation.comment && (
                          <p className="mt-2 text-sm text-slate-600">{validation.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zone de validation */}
            {canValidate && evaluation.status !== 'completed' && (
              <div className="pt-6 mt-6 border-t border-slate-200/70">
                <div className="p-6 border bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 rounded-2xl">
                  <h4 className="mb-4 text-lg font-bold text-slate-900">
                    Votre tour de validation
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700">
                        <MessageSquare className="inline w-4 h-4 mr-1" />
                        Commentaire (obligatoire)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 transition-all bg-white border outline-none resize-none border-slate-300/70 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        placeholder="Exprimez votre avis sur cette évaluation..."
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">Minimum 10 caractères</span>
                        <span className={`text-xs ${comment.length >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {comment.length}/10
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleValidate}
                        disabled={loading || comment.trim().length < 10}
                        className="flex items-center justify-center flex-1 px-6 py-3 space-x-2 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                            <span>Traitement...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            <span>Valider et transmettre</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={loading || comment.trim().length < 10}
                        className="flex items-center justify-center flex-1 px-6 py-3 space-x-2 font-medium text-white transition-all bg-gradient-to-r from-red-500 to-orange-500 rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                            <span>Traitement...</span>
                          </>
                        ) : (
                          <>
                            <X className="w-5 h-5" />
                            <span>Refuser</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message si non autorisé à valider */}
            {!canValidate && evaluation.status !== 'Completed' && evaluation.status !== 'rejected' && (
              <div className="p-6 text-center border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50 rounded-2xl">
                <Clock className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <p className="font-medium text-slate-900">En attente de validation</p>
                <p className="text-slate-600">
                  Actuellement en attente de validation par le{' '}
                  <span className="font-bold text-amber-700">{evaluation.current_validation_level}</span>
                </p>
              </div>
            )}

            {/* Message si complété */}
            {evaluation.status === 'completed' && (
              <div className="p-6 text-center border bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200/50 rounded-2xl">
                <Award className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
                <p className="text-lg font-bold text-emerald-900">Évaluation complétée !</p>
                <p className="mt-1 text-slate-700">
                  Validée avec succès le {formatDate(evaluation.completed_at)}
                </p>
                <div className="inline-flex items-center px-4 py-2 mt-3 space-x-2 border rounded-full bg-white/80 border-emerald-200">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Processus terminé</span>
                </div>
              </div>
            )}

            {/* Message si refusé */}
            {evaluation.status === 'rejected' && (
              <div className="p-6 text-center border bg-gradient-to-r from-red-50 to-rose-50 border-red-200/50 rounded-2xl">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                <p className="text-lg font-bold text-red-900">Évaluation refusée</p>
                <p className="mt-1 text-slate-700">
                  Refusée le {formatDate(evaluation.rejected_at)}
                </p>
              </div>
            )}

            {/* Bouton de fermeture */}
            <div className="flex justify-center pt-4">
              <button
                onClick={onClose}
                className="px-8 py-3 font-medium transition-all bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-xl hover:from-slate-300 hover:to-slate-400"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}