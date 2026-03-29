
//Ce composant affiche une fenêtre popup contenant toutes les informations d’une demande de recrutement.

import { useState } from 'react';
import { 
  X, CheckCircle, XCircle, Edit2, MessageSquare, 
  Clock, User, Building, FileText, Target,
  AlertCircle, Send, History, Shield, Award, DollarSign, Users,
  UserCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Request {
  id: string;
  title: string;
  department: string;
  location: string;
  contract_type: string;
  reason: string;
  budget: number;
  required_skills: string[];
  description: string;
  urgent: boolean;
  status: string;
  current_validation_level: string;
  created_by_name: string;
  created_by_role: string;
  created_at: string;
  replacement_name?: string;
  replacement_reason?: string;
  level: string;
  experience: string;
  remote_work: boolean;
  estimated_time: string;
  validation_history?: any[];
}

interface Props {
  request: Request;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestValidationModal({ request, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'validate' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    title: request.title,
    department: request.department,
    budget: request.budget,
    description: request.description,
  });

  const validationFlow = [
    { level: 'Manager', color: 'bg-emerald-500', icon: Users, completed: true },
    { level: 'Directeur', color: 'bg-blue-500', icon: Building, completed: ['Directeur', 'DRH', 'DAF', 'DGA/DG'].includes(request.current_validation_level) },
    { level: 'DRH', color: 'bg-violet-500', icon: Shield, completed: ['DRH', 'DAF', 'DGA/DG'].includes(request.current_validation_level) },
    { level: 'DAF', color: 'bg-amber-500', icon: DollarSign, completed: ['DAF', 'DGA/DG'].includes(request.current_validation_level) },
    { level: 'DGA/DG', color: 'bg-purple-500', icon: Award, completed: request.current_validation_level === 'DGA/DG' },
  ];

  const getNextLevel = () => {
    const currentIndex = validationFlow.findIndex(v => v.level === request.current_validation_level);
    return currentIndex < validationFlow.length - 1 ? validationFlow[currentIndex + 1] : null;
  };

  const handleValidation = async () => {
    if (!action) return;
    
    setLoading(true);
    try {
      const nextLevel = getNextLevel();
      const isFinalValidation = nextLevel === null;

      const { error } = await supabase
        .from('recruitment_requests')
        .update({
          current_validation_level: isFinalValidation ? 'COMPLETED' : nextLevel?.level,
          status: action === 'validate' 
            ? (isFinalValidation ? 'Validated' : 'InProgress')
            : 'Rejected',
          validation_history: [
            ...(request.validation_history || []),
            {
              action: action === 'validate' ? 'VALIDATED' : 'REJECTED',
              level: request.current_validation_level,
              user: user?.full_name,
              user_role: UserCircle2?.role,
              comment: comment,
              timestamp: new Date().toISOString(),
            }
          ],
          ...(action === 'validate' && {
            last_validated_by: user?.full_name,
            last_validated_at: new Date().toISOString(),
          }),
          ...(action === 'reject' && {
            rejected_by: user?.full_name,
            rejected_at: new Date().toISOString(),
            rejection_reason: comment,
          }),
          ...(isEditing && {
            title: editableData.title,
            department: editableData.department,
            budget: editableData.budget,
            description: editableData.description,
          }),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success(
        action === 'validate' 
          ? isFinalValidation 
            ? 'Demande validée avec succès !' 
            : 'Demande validée au niveau actuel'
          : 'Demande refusée',
        { duration: 4000, position: 'top-right' }
      );

      setAction(null);
      setComment('');
      setIsEditing(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Erreur lors du traitement de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('recruitment_requests')
        .update({
          title: editableData.title,
          department: editableData.department,
          budget: editableData.budget,
          description: editableData.description,
          validation_history: [
            ...(request.validation_history || []),
            {
              action: 'MODIFIED',
              level: request.current_validation_level,
              user: user?.full_name,
              user_role: user?.role,
              comment: 'Modifications apportées par le validateur',
              timestamp: new Date().toISOString(),
            }
          ],
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Modifications enregistrées', { duration: 3000, position: 'top-right' });
      setIsEditing(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = ['rh', 'daf', 'directeur'].includes(user?.role?.toLowerCase() || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Validation de demande</h3>
              <p className="text-sm text-slate-600">
                Niveau actuel: {request.current_validation_level}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Circuit de validation */}
            <div className="flex items-center justify-between mb-6">
              {validationFlow.map((item, index) => {
                const Icon = item.icon;
                const isCurrent = item.level === request.current_validation_level;
                return (
                  <div key={item.level} className="relative flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      item.completed
                        ? item.color
                        : isCurrent
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-emerald-500/30'
                        : 'bg-slate-200'
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-xs font-medium mt-2 ${
                      isCurrent ? 'text-emerald-700' : item.completed ? 'text-slate-700' : 'text-slate-500'
                    }`}>
                      {item.level}
                    </span>
                    {index < validationFlow.length - 1 && (
                      <div className={`absolute top-5 left-12 w-16 h-0.5 ${
                        validationFlow[index + 1].completed ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                  <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span>Poste</span>
                  </h4>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.title}
                      onChange={(e) => setEditableData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="font-bold text-slate-900">{request.title}</p>
                  )}
                </div>

                <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                  <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                    <Building className="w-5 h-5 text-emerald-500" />
                    <span>Département</span>
                  </h4>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.department}
                      onChange={(e) => setEditableData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{request.department}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                  <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                    <span>Budget</span>
                  </h4>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editableData.budget}
                      onChange={(e) => setEditableData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="font-bold text-slate-900">{request.budget?.toLocaleString()} €</p>
                  )}
                </div>

                <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                  <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                    <MapPin className="w-5 h-5 text-violet-500" />
                    <span>Localisation</span>
                  </h4>
                  <p className="font-medium text-slate-900">{request.location}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
              <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span>Description</span>
              </h4>
              {isEditing ? (
                <textarea
                  value={editableData.description}
                  onChange={(e) => setEditableData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="whitespace-pre-line text-slate-700">{request.description}</p>
              )}
            </div>

            {/* Compétences */}
            {request.required_skills && request.required_skills.length > 0 && (
              <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span>Compétences requises</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {request.required_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 text-sm text-blue-700 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions de validation */}
            {!isEditing ? (
              <>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setAction('validate')}
                    className="flex items-center justify-center flex-1 px-6 py-3 space-x-2 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Valider</span>
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    className="flex items-center justify-center flex-1 px-6 py-3 space-x-2 font-medium text-white transition-all bg-gradient-to-r from-red-500 to-orange-500 rounded-xl hover:from-red-600 hover:to-orange-600"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Refuser</span>
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center px-6 py-3 space-x-2 font-medium transition-all text-slate-700 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl hover:from-slate-200 hover:to-slate-300"
                    >
                      <Edit2 className="w-5 h-5" />
                      <span>Modifier</span>
                    </button>
                  )}
                </div>

                {action && (
                  <div className="p-5 border bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200/70 rounded-xl">
                    <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <span>Commentaire {action === 'validate' ? 'de validation' : 'de refus'}</span>
                    </h4>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Ajoutez votre commentaire..."
                      className="w-full px-4 py-3 mb-4 border rounded-lg resize-none border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <button
                      onClick={handleValidation}
                      disabled={loading}
                      className="flex items-center justify-center w-full px-6 py-3 space-x-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                          <span>Traitement...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Confirmer</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex items-center justify-center flex-1 px-6 py-3 space-x-2 font-medium text-white transition-all bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Enregistrer les modifications</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditableData({
                      title: request.title,
                      department: request.department,
                      budget: request.budget,
                      description: request.description,
                    });
                  }}
                  className="flex items-center justify-center flex-1 px-6 py-3 space-x-2 font-medium transition-all text-slate-700 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl hover:from-slate-200 hover:to-slate-300"
                >
                  <X className="w-5 h-5" />
                  <span>Annuler</span>
                </button>
              </div>
            )}

            {/* Historique des validations */}
            {request.validation_history && request.validation_history.length > 0 && (
              <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                <h4 className="flex items-center mb-4 space-x-2 font-semibold text-slate-900">
                  <History className="w-5 h-5 text-amber-500" />
                  <span>Historique des validations</span>
                </h4>
                <div className="space-y-3">
                  {request.validation_history.map((item: any, index: number) => (
                    <div key={index} className="flex items-start p-3 space-x-3 rounded-lg bg-slate-50">
                      <div className={`p-1.5 rounded-full ${
                        item.action === 'VALIDATED' ? 'bg-emerald-100' :
                        item.action === 'REJECTED' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}>
                        {item.action === 'VALIDATED' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : item.action === 'REJECTED' ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900">{item.user} ({item.user_role})</p>
                          <span className="text-xs text-slate-500">
                            {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{item.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}