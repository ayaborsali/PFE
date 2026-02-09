import { useState } from 'react';
import { 
  X, CheckCircle, XCircle, Edit2, MessageSquare, 
  Clock, User, Building, FileText, Target,
  AlertCircle, Send, History, ChevronRight,
  Shield, Award, DollarSign, Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
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
}

interface Props {
  request: Request;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestValidationModal({ request, onClose, onSuccess }: Props) {
  const { profile } = useAuth();
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
    { level: 'Directeur', color: 'bg-blue-500', icon: Building, completed: request.current_validation_level === 'Directeur' || request.current_validation_level === 'DRH' || request.current_validation_level === 'DAF' || request.current_validation_level === 'DGA/DG' },
    { level: 'DRH', color: 'bg-violet-500', icon: Shield, completed: request.current_validation_level === 'DRH' || request.current_validation_level === 'DAF' || request.current_validation_level === 'DGA/DG' },
    { level: 'DAF', color: 'bg-amber-500', icon: DollarSign, completed: request.current_validation_level === 'DAF' || request.current_validation_level === 'DGA/DG' },
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
              user: profile?.full_name,
              user_role: profile?.role,
              comment: comment,
              timestamp: new Date().toISOString(),
            }
          ],
          ...(action === 'validate' && {
            last_validated_by: profile?.full_name,
            last_validated_at: new Date().toISOString(),
          }),
          ...(action === 'reject' && {
            rejected_by: profile?.full_name,
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
        {
          duration: 4000,
          position: 'top-right',
        }
      );

      onSuccess();
      onClose();
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
              user: profile?.full_name,
              user_role: profile?.role,
              comment: 'Modifications apportées par le validateur',
              timestamp: new Date().toISOString(),
            }
          ],
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Modifications enregistrées', {
        duration: 3000,
        position: 'top-right',
      });

      setIsEditing(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = ['rh', 'daf', 'directeur'].includes(profile?.role?.toLowerCase() || '');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-white/30 my-8">
        {/* En-tête */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-xl border-b border-slate-200/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={`p-4 rounded-2xl shadow-xl ${
                  request.urgent 
                    ? 'bg-gradient-to-br from-red-500 to-orange-500' 
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}>
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-white to-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Validation de demande
                </h3>
                <p className="text-slate-600 mt-1">
                  Niveau actuel : <span className="font-semibold text-emerald-700">{request.current_validation_level}</span>
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105 group"
            >
              <X className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </button>
          </div>

          {/* Circuit de validation */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {validationFlow.map((item, index) => {
                const Icon = item.icon;
                const isCurrent = item.level === request.current_validation_level;
                
                return (
                  <div key={item.level} className="flex flex-col items-center relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
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
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Informations de la demande */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Colonne gauche - Détails */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Poste à pourvoir</h4>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableData.title}
                          onChange={(e) => setEditableData(prev => ({ ...prev, title: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      ) : (
                        <p className="text-lg font-bold text-slate-900">{request.title}</p>
                      )}
                    </div>
                  </div>
                  {request.urgent && (
                    <div className="px-3 py-1 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 rounded-full text-sm font-medium">
                      URGENT
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Département</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableData.department}
                        onChange={(e) => setEditableData(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    ) : (
                      <p className="font-medium text-slate-900">{request.department}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Localisation</label>
                    <p className="font-medium text-slate-900">{request.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Type de contrat</label>
                    <p className="font-medium text-slate-900">{request.contract_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Niveau</label>
                    <p className="font-medium text-slate-900">{request.level} • {request.experience}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Budget et conditions</h4>
                    <p className="text-sm text-slate-600">Éléments financiers et contractuels</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Budget annuel estimé</label>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editableData.budget}
                          onChange={(e) => setEditableData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                        <span className="text-slate-700">€</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">{request.budget?.toLocaleString()} €</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-slate-600 mb-1">Télétravail</label>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.remote_work 
                          ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {request.remote_work ? 'OUI' : 'NON'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-slate-600 mb-1">Délai estimé</label>
                      <p className="font-medium text-slate-900">{request.estimated_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite - Description et compétences */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Description du poste</h4>
                      <p className="text-sm text-slate-600">Missions et responsabilités</p>
                    </div>
                  </div>
                  {canEdit && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    value={editableData.description}
                    onChange={(e) => setEditableData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg resize-none min-h-[200px]"
                  />
                ) : (
                  <p className="text-slate-700 whitespace-pre-line">{request.description}</p>
                )}
              </div>

              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Compétences requises</h4>
                    <p className="text-sm text-slate-600">Techniques et comportementales</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {request.required_skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-700 rounded-lg text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Informations du demandeur */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/70 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Demandeur</h4>
                    <p className="text-sm text-slate-600">Initiateur de la demande</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Nom</label>
                    <p className="font-medium text-slate-900">{request.created_by_name}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-slate-600 mb-1">Rôle</label>
                      <p className="font-medium text-slate-900">{request.created_by_role}</p>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-slate-600 mb-1">Date</label>
                      <p className="font-medium text-slate-900">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone d'action */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200/50 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-emerald-900">Action de validation</h4>
                <p className="text-emerald-700">
                  En tant que {profile?.role}, vous pouvez {getNextLevel() ? 'valider pour le prochain niveau' : 'donner la validation finale'}
                </p>
              </div>
            </div>

            {/* Commentaire */}
            <div className="mb-6">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-3">
                <MessageSquare className="w-4 h-4" />
                <span>Commentaire (optionnel)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg resize-none"
                rows={3}
                placeholder="Ajoutez un commentaire pour justifier votre décision..."
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setAction('validate')}
                  disabled={loading || isEditing}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all ${
                    action === 'validate'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 hover:from-emerald-200 hover:to-teal-200'
                  } ${loading || isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    {getNextLevel() 
                      ? `Valider pour ${getNextLevel()?.level}` 
                      : 'Validation finale'}
                  </span>
                </button>

                <button
                  onClick={() => setAction('reject')}
                  disabled={loading || isEditing}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all ${
                    action === 'reject'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 hover:from-red-200 hover:to-orange-200'
                  } ${loading || isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <XCircle className="w-5 h-5" />
                  <span>Refuser la demande</span>
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {isEditing && canEdit && (
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer modifications'}
                  </button>
                )}
                
                {isEditing && (
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
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {/* Bouton de soumission */}
            {action && (
              <div className="mt-6 pt-6 border-t border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-slate-600">
                    <History className="w-4 h-4" />
                    <span className="text-sm">
                      {action === 'validate' 
                        ? 'La demande sera transmise au niveau suivant'
                        : 'La demande sera marquée comme refusée'}
                    </span>
                  </div>
                  <button
                    onClick={handleValidation}
                    disabled={loading}
                    className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                  >
                    <span className="relative flex items-center space-x-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Traitement en cours...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Confirmer {action === 'validate' ? 'la validation' : 'le refus'}</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Historique de validation */}
          {request.validation_history && request.validation_history.length > 0 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Historique des validations</h4>
              <div className="space-y-4">
                {request.validation_history.map((item: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50/50 rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.action === 'VALIDATED' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : item.action === 'REJECTED'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.action === 'VALIDATED' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : item.action === 'REJECTED' ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Edit2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-slate-900">
                          {item.user} ({item.user_role})
                        </p>
                        <span className="text-sm text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.action === 'VALIDATED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.action === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.action === 'VALIDATED' ? 'VALIDÉ' : item.action === 'REJECTED' ? 'REFUSÉ' : 'MODIFIÉ'}
                        </span>
                        <span className="text-sm text-slate-600">Niveau: {item.level}</span>
                      </div>
                      {item.comment && (
                        <p className="text-slate-600 text-sm">{item.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}