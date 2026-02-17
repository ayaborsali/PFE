import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, User, Eye, Edit, CheckCircle, MessageSquare, AlertCircle, Mail } from 'lucide-react';
import EvaluationDetailModal from './EvaluationDetailModal';
import toast from 'react-hot-toast';

interface Props {
  onUpdate: () => void;
  filters?: {
    status: string;
    period: string;
    department: string;
    urgency: string;
  };
  onValidationAction?: (evaluationId: string, action: string, level: string, comments?: string) => Promise<void>;
  profile?: any;
}

interface Evaluation {
  id: string;
  employee_id: string;
  manager_id: string;
  n2_manager_id: string;
  status: string;
  evaluation_type: string;
  evaluation_reason: string;
  contract_end_date: string;
  current_validation_level: string;
  created_at: string;
  due_date: string;
  last_status_change: string;
  comments: any[];
  employee?: {
    full_name: string;
    department?: string;
    position?: string;
    contract_type?: string;
  };
  manager?: {
    full_name: string;
    email?: string;
  };
  n2_manager?: {
    full_name: string;
    email?: string;
  };
  department?: string;
  job_title?: string;
}

export default function EvaluationList({ onUpdate, filters = {
  status: 'all',
  period: 'all',
  department: 'all',
  urgency: 'all'
}, onValidationAction, profile }: Props) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{action: string, level: string} | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchEvaluations();
  }, [filters]);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('evaluations')
        .select(`
          *,
          employee:profiles!evaluations_employee_id_fkey(full_name, department, position, contract_type),
          manager:profiles!evaluations_manager_id_fkey(full_name, email),
          n2_manager:profiles!evaluations_n2_manager_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters.status !== 'all') {
        if (filters.status === 'overdue') {
          query = query.lt('due_date', new Date().toISOString())
                       .not('status', 'eq', 'completed');
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.period !== 'all') {
        query = query.eq('evaluation_type', filters.period);
      }

      if (filters.department !== 'all') {
        query = query.eq('department', filters.department);
      }

      if (filters.urgency !== 'all') {
        const now = new Date();
        const urgencyMap = {
          'critical': 3,
          'high': 7,
          'medium': 15,
          'low': 365
        };
        const days = urgencyMap[filters.urgency as keyof typeof urgencyMap];
        const dateLimit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        query = query.lte('due_date', dateLimit.toISOString())
                     .gte('due_date', now.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (evaluation: Evaluation) => {
    const now = new Date();
    const dueDate = new Date(evaluation.due_date);
    const isOverdue = dueDate < now && !['completed', 'cancelled'].includes(evaluation.status);
    
    if (isOverdue) {
      return {
        className: 'bg-red-100 text-red-700 border border-red-200',
        text: 'En retard',
        icon: AlertCircle
      };
    }

    const styles: Record<string, { className: string; text: string }> = {
      'draft': { className: 'bg-slate-100 text-slate-700', text: 'Brouillon' },
      'pending_n1': { className: 'bg-amber-100 text-amber-700', text: 'En attente N+1' },
      'pending_n2': { className: 'bg-orange-100 text-orange-700', text: 'En attente N+2' },
      'pending_drh': { className: 'bg-blue-100 text-blue-700', text: 'En attente DRH' },
      'pending_daf': { className: 'bg-indigo-100 text-indigo-700', text: 'En attente DAF' },
      'pending_dga': { className: 'bg-purple-100 text-purple-700', text: 'En attente DGA' },
      'completed': { className: 'bg-green-100 text-green-700', text: 'Terminée' },
      'cancelled': { className: 'bg-gray-100 text-gray-700', text: 'Annulée' }
    };

    return {
      ...styles[evaluation.status] || styles.draft,
      icon: Clock
    };
  };

  const getLevelName = (level: string) => {
    const levels: Record<string, string> = {
      'pending_n1': 'N+1',
      'pending_n2': 'N+2',
      'pending_drh': 'DRH',
      'pending_daf': 'DAF',
      'pending_dga': 'DGA',
      'completed': 'Complété'
    };
    return levels[level] || level;
  };

  const getUrgencyLevel = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { level: 'overdue', label: 'En retard', color: 'text-red-600' };
    if (diffDays <= 3) return { level: 'critical', label: 'Critique', color: 'text-red-500' };
    if (diffDays <= 7) return { level: 'high', label: 'Élevée', color: 'text-orange-500' };
    if (diffDays <= 15) return { level: 'medium', label: 'Moyenne', color: 'text-yellow-500' };
    return { level: 'low', label: 'Basse', color: 'text-green-500' };
  };

  const getAvailableActions = (evaluation: Evaluation) => {
    const { status } = evaluation;
    const userRole = profile?.role;
    const userId = profile?.id;
    
    const actions = [];

    // Vérifier les permissions de modification
    const canModify = (
      (status === 'draft' && evaluation.manager_id === userId) ||
      (status === 'pending_n1' && evaluation.manager_id === userId) ||
      (status === 'pending_n2' && evaluation.n2_manager_id === userId) ||
      (['pending_drh', 'pending_daf', 'pending_dga'].includes(status) && 
       ['DRH', 'DAF', 'DGA', 'HR', 'Payroll'].includes(userRole))
    );

    if (canModify) {
      actions.push({
        name: 'Modifier',
        icon: Edit,
        color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        action: 'modify',
        level: status.replace('pending_', '')
      });
    }

    // Vérifier les permissions de validation
    const canValidate = (
      (status === 'pending_n1' && evaluation.manager_id === userId) ||
      (status === 'pending_n2' && evaluation.n2_manager_id === userId) ||
      (status === 'pending_drh' && userRole === 'DRH') ||
      (status === 'pending_daf' && userRole === 'DAF') ||
      (status === 'pending_dga' && userRole === 'DGA')
    );

    if (canValidate) {
      actions.push({
        name: 'Valider',
        icon: CheckCircle,
        color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
        action: 'validate',
        level: status.replace('pending_', '')
      });
    }

    // Vérifier les permissions pour les commentaires
    const canComment = (
      evaluation.manager_id === userId ||
      evaluation.n2_manager_id === userId ||
      ['DRH', 'DAF', 'DGA', 'HR', 'Payroll'].includes(userRole) ||
      (status === 'draft' && evaluation.manager_id === userId)
    );

    if (canComment) {
      actions.push({
        name: 'Commenter',
        icon: MessageSquare,
        color: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        action: 'comment',
        level: status.replace('pending_', '') || 'draft'
      });
    }

    return actions;
  };

  const handleActionClick = async (evaluation: Evaluation, action: {action: string, level: string, name: string}) => {
    setSelectedEvaluation(evaluation);
    setSelectedAction(action);
    
    if (action.action === 'comment' || action.name === 'Commenter') {
      setShowCommentModal(true);
    } else {
      const comment = prompt(`Ajouter un commentaire pour "${action.name}" :`);
      if (onValidationAction) {
        await onValidationAction(
          evaluation.id,
          action.action,
          action.level,
          comment || ''
        );
        fetchEvaluations();
        onUpdate();
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (selectedEvaluation && selectedAction && onValidationAction) {
      await onValidationAction(
        selectedEvaluation.id,
        selectedAction.action,
        selectedAction.level,
        commentText
      );
      setShowCommentModal(false);
      setCommentText('');
      fetchEvaluations();
      onUpdate();
      toast.success('Commentaire ajouté avec succès');
    }
  };

  const checkProcessingDeadline = (evaluation: Evaluation) => {
    if (!evaluation.last_status_change) return false;
    const lastChange = new Date(evaluation.last_status_change);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 48 && !['completed', 'cancelled'].includes(evaluation.status);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Eye className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 font-medium text-slate-600">Chargement des évaluations...</p>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100">
          <Eye className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">Aucune évaluation trouvée</h3>
        <p className="max-w-md mx-auto text-slate-600">
          {filters.status !== 'all' || filters.department !== 'all' 
            ? 'Aucune évaluation ne correspond aux filtres sélectionnés.' 
            : 'Commencez par créer votre première évaluation.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {evaluations.map((evaluation) => {
          const statusBadge = getStatusBadge(evaluation);
          const urgency = getUrgencyLevel(evaluation.due_date);
          const actions = getAvailableActions(evaluation);
          const needsReminder = checkProcessingDeadline(evaluation);
          const StatusIcon = statusBadge.icon;

          return (
            <div
              key={evaluation.id}
              className="p-5 transition-all bg-white border border-slate-200 rounded-xl hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-3 space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{evaluation.employee?.full_name}</h3>
                      <div className="flex items-center mt-1 space-x-3">
                        <span className="text-sm text-slate-600">
                          {evaluation.job_title || evaluation.employee?.position}
                        </span>
                        <span className="text-sm text-slate-500">•</span>
                        <span className="text-sm text-slate-600">
                          {evaluation.department || evaluation.employee?.department}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}>
                      <StatusIcon className="inline w-3 h-3 mr-1" />
                      {statusBadge.text}
                    </span>
                    
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgency.color} bg-opacity-10`}>
                      <Clock className="inline w-3 h-3 mr-1" />
                      {urgency.label}
                    </span>
                    
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-700">
                      {getLevelName(evaluation.current_validation_level)}
                    </span>
                    
                    {needsReminder && (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-rose-100 text-rose-700">
                        <Mail className="inline w-3 h-3 mr-1" />
                        Rappel envoyé
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-sm font-medium text-slate-700">Manager</p>
                      <p className="text-sm text-slate-900">{evaluation.manager?.full_name}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-medium text-slate-700">Motif</p>
                      <p className="text-sm text-slate-900">{evaluation.evaluation_reason}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-medium text-slate-700">Type</p>
                      <p className="text-sm text-slate-900">{evaluation.evaluation_type}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-medium text-slate-700">Date échéance</p>
                      <p className="text-sm text-slate-900">
                        {new Date(evaluation.contract_end_date || evaluation.due_date).toLocaleDateString('fr-FR')}
                        <span className={`ml-2 text-xs ${urgency.color}`}>
                          ({urgency.label})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    Créé le {new Date(evaluation.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  {evaluation.last_status_change && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm text-slate-600">
                        Dernier changement: {new Date(evaluation.last_status_change).toLocaleDateString('fr-FR')}
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {actions.length > 0 ? (
                    <div className="flex items-center space-x-2">
                      {actions.map((action) => (
                        <button
                          key={`${action.action}-${action.level}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(evaluation, action);
                          }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center space-x-1.5 transition-all ${action.color}`}
                        >
                          <action.icon className="w-4 h-4" />
                          <span>{action.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">Aucune action disponible</span>
                  )}
                  
                  <button
                    onClick={() => setSelectedEvaluation(evaluation)}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center space-x-1.5 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Détails</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de commentaire */}
      {showCommentModal && selectedEvaluation && selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Ajouter un commentaire
            </h3>
            <p className="mb-4 text-sm text-slate-600">
              Évaluation de {selectedEvaluation.employee?.full_name} • Action: {selectedAction.name}
            </p>
            
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Saisissez votre commentaire ici..."
              className="w-full h-32 px-3 py-2 mb-4 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setCommentText('');
                }}
                className="px-4 py-2 font-medium transition-colors rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={!commentText.trim()}
                className="px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détail */}
      {selectedEvaluation && !showCommentModal && (
        <EvaluationDetailModal
          evaluation={selectedEvaluation}
          onClose={() => setSelectedEvaluation(null)}
          onUpdate={() => {
            fetchEvaluations();
            onUpdate();
          }}
          onValidationAction={onValidationAction}
          profile={profile}
        />
      )}
    </>
  );
}