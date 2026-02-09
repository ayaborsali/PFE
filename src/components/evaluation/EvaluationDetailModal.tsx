import { useState, useEffect } from 'react';
import { X, Check, Clock, User, FileText, Calendar, Target, MessageSquare, ArrowRight, Shield, Award, AlertCircle, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  evaluation: any;
  onClose: () => void;
  onUpdate: () => void;
}

const validationLevels = ['Manager', 'Director', 'DRH', 'DAF', 'DGA', 'DG'];
const roleColors: Record<string, string> = {
  'Manager': 'bg-emerald-100 text-emerald-700',
  'Director': 'bg-blue-100 text-blue-700',
  'DRH': 'bg-violet-100 text-violet-700',
  'DAF': 'bg-amber-100 text-amber-700',
  'DGA': 'bg-rose-100 text-rose-700',
  'DG': 'bg-indigo-100 text-indigo-700'
};

export default function EvaluationDetailModal({ evaluation, onClose, onUpdate }: Props) {
  const { profile } = useAuth();
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
    if (!comment.trim()) return;
    
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

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error validating:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'InProgress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl shadow-slate-900/10 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
        {/* Header avec glassmorphism */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-b border-slate-200/50 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Évaluation de période d'essai
              </h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(evaluation.status)}`}>
                  {evaluation.status}
                </span>
                <div className="flex items-center space-x-1 text-sm text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Échéance: {formatDate(evaluation.contract_end_date)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Barre de progression */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900">Circuit de validation</h4>
              <span className="text-sm text-slate-500">Étape {currentStep + 1}/{validationLevels.length}</span>
            </div>
            
            <div className="relative">
              <div className="absolute top-4 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>
              <div className="absolute top-4 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" 
                style={{ width: `${(currentStep / (validationLevels.length - 1)) * 100}%` }}>
              </div>
              
              <div className="flex justify-between relative z-10">
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
                          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
                        ) : (
                          <div className="w-4 h-4 bg-slate-300 rounded-full"></div>
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
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid d'informations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Employé évalué</p>
                  <p className="font-bold text-lg text-slate-900">{evaluation.employee?.full_name}</p>
                  <p className="text-sm text-slate-600">{evaluation.employee?.position}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Manager évaluateur</p>
                  <p className="font-bold text-lg text-slate-900">{evaluation.manager?.full_name}</p>
                  <p className="text-sm text-slate-600">{evaluation.manager?.department}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Target className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Motif d'évaluation</p>
                  <p className="font-bold text-lg text-slate-900">{evaluation.evaluation_reason}</p>
                  <p className="text-sm text-slate-600">Fin de période d'essai</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Dates importantes</p>
                  <p className="font-bold text-slate-900">Début: {formatDate(evaluation.contract_start_date)}</p>
                  <p className="font-bold text-slate-900">Fin: {formatDate(evaluation.contract_end_date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des validations */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-6 h-6 text-slate-700" />
              <h4 className="font-bold text-lg text-slate-900">Historique des validations</h4>
            </div>
            
            <div className="space-y-4">
              {validations.length > 0 ? (
                validations.map((validation, index) => (
                  <div 
                    key={validation.id} 
                    className="relative bg-gradient-to-r from-white to-slate-50 border border-slate-200/70 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                        {index < validations.length - 1 && (
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-emerald-300 to-transparent"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-slate-900">{validation.profiles?.full_name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs font-medium px-3 py-1 rounded-full ${roleColors[validation.validator_role] || 'bg-slate-100 text-slate-700'}`}>
                                {validation.validator_role}
                              </span>
                              <span className="text-xs text-slate-500">
                                {validation.profiles?.department}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-emerald-600">{validation.action}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(validation.action_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {validation.comment && (
                          <div className="mt-3 p-3 bg-slate-50/70 rounded-lg border border-slate-200/50">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5" />
                              <p className="text-sm text-slate-700">{validation.comment}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/50">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">Aucune validation enregistrée</p>
                  <p className="text-sm text-slate-400 mt-1">La validation commencera avec le manager</p>
                </div>
              )}
            </div>
          </div>

          {/* Zone de validation */}
          {canValidate && (
            <div className="border-t border-slate-200/70 pt-8 mt-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <Award className="w-6 h-6 text-blue-600" />
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">Votre tour de validation</h4>
                    <p className="text-sm text-slate-600">Vous êtes actuellement le valideur désigné</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Commentaire (obligatoire)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-200 resize-none shadow-sm"
                      placeholder="Exprimez votre avis sur cette évaluation..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">Minimum 10 caractères</span>
                      <span className={`text-xs ${comment.length >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {comment.length}/10
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-blue-200/50">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Prochaine étape: </span>
                      {currentStep < validationLevels.length - 1 ? 
                        <span className="font-bold text-blue-600">{validationLevels[currentStep + 1]}</span> : 
                        <span className="font-bold text-emerald-600">Terminé</span>
                      }
                    </div>
                    
                    <button
                      onClick={handleValidate}
                      disabled={loading || comment.trim().length < 10}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="relative flex items-center space-x-2">
                        <span>{loading ? 'Validation en cours...' : 'Valider et transmettre'}</span>
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message si non autorisé à valider */}
          {!canValidate && evaluation.status !== 'Completed' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-6 text-center">
              <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="font-medium text-slate-900">En attente de validation</p>
              <p className="text-slate-600">
                Actuellement en attente de validation par le{' '}
                <span className="font-bold text-amber-700">{evaluation.current_validation_level}</span>
              </p>
            </div>
          )}

          {/* Message si complété */}
          {evaluation.status === 'Completed' && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl p-6 text-center">
              <Award className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <p className="font-bold text-lg text-emerald-900">Évaluation complétée !</p>
              <p className="text-slate-700 mt-1">
                Validée avec succès le {formatDate(evaluation.completed_at)}
              </p>
              <div className="inline-flex items-center space-x-2 mt-3 px-4 py-2 bg-white/80 rounded-full border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Processus terminé</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}