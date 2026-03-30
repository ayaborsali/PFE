// Composant affichant la liste des demandes de validation en attente selon le rôle de l'utilisateur
import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, Edit2, MessageSquare, Eye,
  XCircle as XCircleIcon, Clock, AlertCircle,  DollarSign,
  Users,  FileText,
  UserCheck, History, X,  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RequestValidationModal from './RequestValidationModal';
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
  comments?: Comment[];
}

interface Comment {
  id: string;
  user: string;
  user_role: string;
  content: string;
  timestamp: string;
}

interface Props {
  onUpdate: () => void;
  searchTerm: string;
}

export default function ValidationRequestList({ onUpdate, searchTerm }: Props) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<Request | null>(null);
  const [validationLevel, setValidationLevel] = useState('');
  const [showValidationHistory, setShowValidationHistory] = useState(false);
  
  // États pour le mode édition
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Request>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  
  // États pour le mode commentaire
  const [commentingRequest, setCommentingRequest] = useState<Request | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  // États pour le mode validation/refus
  const [validationAction, setValidationAction] = useState<'validate' | 'reject' | null>(null);
  const [validationRequest, setValidationRequest] = useState<Request | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Déterminer le niveau de validation en fonction du rôle de l'utilisateur
  useEffect(() => {
    if (user?.role) {
      const level = getValidationLevelFromRole(user.role);
      setValidationLevel(level);
    }
  }, [user]);

  const fetchRequests = useCallback(async () => {
    if (!validationLevel) return; // Ne pas charger si pas de niveau
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Déterminer le rôle à passer à l'API
      let roleParam = user?.role?.toLowerCase() || '';
      
      console.log(`📡 Récupération des demandes pour le rôle: ${roleParam} (niveau: ${validationLevel})`);
      
      // Appel à l'API avec le rôle
      const response = await fetch(
  `${API}/api/validationRequests/validation-requests?role=${roleParam}`, 
  { headers }
);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${data.length} demande(s) récupérée(s)`);
      
      // Filtrer par recherche si nécessaire
      let filteredData = data;
      if (searchTerm) {
        filteredData = data.filter((item: any) => 
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Transformer les données pour correspondre à l'interface Request
      const transformedRequests = filteredData.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        department: item.department,
        location: item.location,
        contract_type: item.contract_type,
        reason: item.reason,
        budget: item.budget,
        required_skills: item.required_skills || [],
        description: item.description,
        urgent: item.urgent || false,
        status: item.status,
        current_validation_level: item.current_validation_level,
        created_by_name: item.created_by_name,
        created_by_role: item.created_by_role,
        created_at: item.created_at,
        replacement_name: item.replacement_name,
        replacement_reason: item.replacement_reason,
        level: item.level,
        experience: item.experience,
        remote_work: item.remote_work || false,
        estimated_time: item.estimated_time || '30 jours',
        validation_history: item.validation_history || [],
        comments: item.comments || []
      }));
      
      setRequests(transformedRequests);
    } catch (error) {
      console.error('❌ Error fetching validation requests:', error);
      toast.error('Erreur lors du chargement des demandes à valider');
    } finally {
      setLoading(false);
    }
  }, [validationLevel, searchTerm, user?.role]); // ✅ Dépendances correctes

  useEffect(() => {
    if (validationLevel) {
      fetchRequests();
    }
  }, [fetchRequests, validationLevel]); // ✅ fetchRequests ne change pas à chaque rendu

  const getValidationLevelFromRole = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'manager': return 'Manager';
      case 'directeur': return 'Directeur';
      case 'rh': return 'DRH';
      case 'daf': return 'DAF';
      case 'dga': return 'DGA/DG';
      default: return '';
    }
  };

  // Fonction pour ouvrir le modal d'édition
  const handleOpenEditModal = (request: Request) => {
    setEditingRequest(request);
    setEditFormData({
      title: request.title,
      department: request.department,
      location: request.location,
      contract_type: request.contract_type,
      budget: request.budget,
      description: request.description,
      level: request.level,
      experience: request.experience,
      remote_work: request.remote_work,
      estimated_time: request.estimated_time,
      urgent: request.urgent,
      required_skills: [...request.required_skills]
    });
    setShowEditModal(true);
  };

  // Fonction pour ouvrir le modal de commentaire
  const handleOpenCommentModal = (request: Request) => {
    setCommentingRequest(request);
    setCommentText('');
    setComments(request.comments || []);
    setShowCommentModal(true);
  };

  // Fonction pour ouvrir le modal de validation/refus
  const handleOpenValidationModal = (request: Request, action: 'validate' | 'reject') => {
    if (user?.role?.toLowerCase() === 'manager') {
      toast.error('Le Manager ne peut pas valider sa propre demande. La validation doit être faite par le Directeur.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    
    setValidationRequest(request);
    setValidationAction(action);
    setValidationComment(action === 'validate' ? 'Je valide cette demande' : 'Je refuse cette demande');
    setShowValidationModal(true);
  };

  // Fonction pour ajouter un commentaire
  const handleAddComment = () => {
    if (!commentText.trim() || !commentingRequest) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      user: user?.full_name || 'Utilisateur',
      user_role: user?.role || 'Inconnu',
      content: commentText,
      timestamp: new Date().toISOString()
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);

    // Mettre à jour la requête avec le nouveau commentaire
    const updatedRequests = requests.map(req => {
      if (req.id === commentingRequest.id) {
        return {
          ...req,
          comments: updatedComments
        };
      }
      return req;
    });

    setRequests(updatedRequests);
    setCommentText('');

    toast.success('💬 Commentaire ajouté avec succès', {
      duration: 3000,
      position: 'top-right',
    });
  };

  // Fonction pour valider ou refuser la demande (appel API)
  const handleValidationAction = async () => {
    if (!validationRequest || !validationAction) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const nextLevel = getNextValidationLevel();
      const endpoint = validationAction === 'validate' 
  ? `${API}/api/validationRequests/validation-requests/${validationRequest.id}/validate`
  : `${API}/api/validationRequests/validation-requests/${validationRequest.id}/reject`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          validator_name: user?.full_name || 'Utilisateur',
          validator_role: user?.role,
          comment: validationComment,
          next_level: nextLevel
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la validation');
      }
      
      const result = await response.json();
      
      // Afficher le message approprié
      if (validationAction === 'validate') {
        if (nextLevel === 'COMPLETED') {
          toast.success('🎉 Validation finale ! La demande est complètement validée et sera publiée automatiquement.', {
            duration: 5000,
            position: 'top-right',
          });
        } else {
          toast.success(`✅ Demande validée avec succès. Prochaine étape: ${nextLevel}`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      } else {
        toast.error('❌ Demande refusée', {
          duration: 3000,
          position: 'top-right',
        });
      }
      
      // Recharger les données
      fetchRequests();
      onUpdate();
      
      // Fermer les modals
      setShowValidationModal(false);
      setValidationRequest(null);
      setValidationAction(null);
      setValidationComment('');
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du traitement');
    }
  };

  // Fonction pour fermer le modal de commentaire
  const handleCloseCommentModal = () => {
    setShowCommentModal(false);
    setCommentingRequest(null);
    setCommentText('');
    setComments([]);
  };

  // Fonction pour gérer les changements dans le formulaire d'édition
  const handleEditFormChange = (field: keyof Request, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`${API}/api/recruitment-requests/${editingRequest.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }
      
      toast.success('📝 Demande modifiée avec succès', {
        duration: 3000,
        position: 'top-right',
      });
      
      setShowEditModal(false);
      setEditingRequest(null);
      fetchRequests();
      onUpdate();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const getPriorityColor = (urgent: boolean) => {
    return urgent 
      ? 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700' 
      : 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'inprogress': return 'bg-amber-100 text-amber-700';
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'validated': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getNextValidationLevel = (): string => {
    switch (validationLevel) {
      case 'Directeur': return 'DRH';
      case 'DRH': return 'DAF';
      case 'DAF': return 'DGA/DG';
      case 'DGA/DG': return 'COMPLETED';
      default: return '';
    }
  };

  const canUserValidate = (): boolean => {
    // Le manager ne peut pas valider (il est créateur)
    return user?.role?.toLowerCase() !== 'manager';
  };

  const getValidationStatus = (level: string): string => {
    const currentRequest = requests[0];
    if (!currentRequest?.validation_history) return 'PENDING';
    
    const validation = currentRequest.validation_history.find(
      (h: any) => h.level === level && h.action === 'VALIDATED'
    );
    return validation ? 'VALIDATED' : 'PENDING';
  };

  const renderValidationProgress = () => {
    const levels = ['Directeur', 'DRH', 'DAF', 'DGA/DG'];
    
    return (
      <div className="p-4 mt-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-900">Progression de la validation</h4>
          <button
            onClick={() => setShowValidationHistory(!showValidationHistory)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <History className="w-4 h-4" />
            <span>Historique</span>
          </button>
        </div>
        <div className="space-y-3">
          {levels.map((level) => {
            const status = getValidationStatus(level);
            const isCurrentLevel = level === validationLevel;
            
            return (
              <div key={level} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    status === 'VALIDATED' 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : isCurrentLevel
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {status === 'VALIDATED' ? (
                      <UserCheck className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{level}</p>
                    <p className="text-sm text-slate-500">
                      {status === 'VALIDATED' ? 'Validé' : isCurrentLevel ? 'En attente' : 'En attente'}
                    </p>
                  </div>
                </div>
                <div className="text-sm">
                  {status === 'VALIDATED' ? (
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      ✓ Validé
                    </span>
                  ) : isCurrentLevel ? (
                    <span className="px-2 py-1 text-blue-700 bg-blue-100 rounded-full">
                      À valider
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      En attente
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Historique de validation */}
        {showValidationHistory && requests[0]?.validation_history && (
          <div className="pt-4 mt-4 border-t border-slate-200">
            <h5 className="mb-2 font-medium text-slate-900">Historique des validations</h5>
            <div className="space-y-2">
              {requests[0].validation_history
                .filter((h: any) => h.action === 'VALIDATED')
                .map((history: any, index: number) => (
                  <div key={index} className="flex items-start p-2 space-x-3 rounded-lg bg-slate-50">
                    <div className={`p-1.5 rounded ${
                      history.level === 'Directeur' ? 'bg-blue-100' :
                      history.level === 'DRH' ? 'bg-violet-100' :
                      history.level === 'DAF' ? 'bg-amber-100' :
                      'bg-purple-100'
                    }`}>
                      <UserCheck className="w-3 h-3 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-slate-900">{history.user} ({history.level})</p>
                        <span className="text-xs text-slate-500">
                          {new Date(history.timestamp).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{history.comment}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liste des demandes */}
      {requests.length === 0 ? (
        <div className="py-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50">
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-900">Aucune demande à valider</h3>
          <p className="text-slate-600">
            {user?.role === 'manager'
              ? "Vous n'avez créé aucune demande pour le moment."
              : `Aucune demande en attente de validation au niveau ${validationLevel}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-6 transition-shadow bg-white border shadow-sm border-slate-200/70 rounded-xl hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                {/* Informations de la demande */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center mb-2 space-x-3">
                        <h4 className="text-lg font-bold text-slate-900">{request.title}</h4>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.urgent)}`}>
                          {request.urgent ? 'URGENT' : 'STANDARD'}
                        </div>
                      </div>
                      <p className="text-slate-600">{request.department} • {request.location}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.current_validation_level}
                      </span>
                      <button
                        onClick={() => setShowDetailsModal(request)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Contrat</p>
                        <p className="font-medium text-slate-900">{request.contract_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Budget</p>
                        <p className="font-medium text-slate-900">{request.budget?.toLocaleString()} €</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Demandeur</p>
                        <p className="font-medium text-slate-900">{request.created_by_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Date</p>
                        <p className="font-medium text-slate-900">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compétences */}
                  {request.required_skills && request.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {request.required_skills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm text-blue-700 rounded-lg bg-blue-50"
                        >
                          {skill}
                        </span>
                      ))}
                      {request.required_skills.length > 5 && (
                        <span className="px-3 py-1 text-sm rounded-lg bg-slate-100 text-slate-600">
                          +{request.required_skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Afficher les commentaires s'il y en a */}
                  {request.comments && request.comments.length > 0 && (
                    <div className="flex items-center mt-2 space-x-2 text-sm text-slate-500">
                      <MessageSquare className="w-4 h-4" />
                      <span>{request.comments.length} commentaire(s)</span>
                    </div>
                  )}

                  {/* Afficher la progression de la validation pour les rôles supérieurs */}
                  {['rh', 'daf', 'dga'].includes(user?.role?.toLowerCase() || '') && renderValidationProgress()}
                </div>

                {/* Actions selon le rôle */}
                <div className="space-y-3 lg:w-80">
                  {user?.role?.toLowerCase() === 'manager' ? (
                    // Actions pour le Manager (créateur)
                    <div className="space-y-3">
                      <div className="p-4 border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 rounded-xl">
                        <div className="flex items-center mb-2 space-x-2">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <p className="text-sm font-medium text-amber-700">En attente de validation</p>
                        </div>
                        <p className="text-sm text-amber-600">
                          En tant que Manager, vous avez créé cette demande. 
                          Elle est en attente de validation par les niveaux supérieurs.
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleOpenEditModal(request)}
                        className="flex items-center justify-center w-full px-6 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600"
                      >
                        <Edit2 className="w-5 h-5" />
                        <span>Modifier la demande</span>
                      </button>
                    </div>
                  ) : (
                    // Actions pour les validateurs (Directeur, DRH, DAF, DGA)
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenValidationModal(request, 'validate')}
                          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 font-medium rounded-lg hover:from-emerald-200 hover:to-teal-200 transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Valider</span>
                        </button>
                        <button
                          onClick={() => handleOpenValidationModal(request, 'reject')}
                          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 font-medium rounded-lg hover:from-red-200 hover:to-orange-200 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Refuser</span>
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(request)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-medium rounded-lg hover:from-blue-200 hover:to-cyan-200 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleOpenCommentModal(request)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 font-medium rounded-lg hover:from-violet-200 hover:to-purple-200 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Commenter</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de validation */}
      {selectedRequest && canUserValidate() && (
        <RequestValidationModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            setSelectedRequest(null);
            fetchRequests();
            onUpdate();
          }}
        />
      )}

      {/* Modal de validation/refus */}
      {showValidationModal && validationRequest && validationAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden border shadow-2xl bg-gradient-to-br from-white to-slate-50 rounded-2xl border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${
                  validationAction === 'validate' 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                    : 'bg-gradient-to-br from-red-500 to-orange-500'
                }`}>
                  {validationAction === 'validate' ? (
                    <ThumbsUp className="w-6 h-6 text-white" />
                  ) : (
                    <ThumbsDown className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {validationAction === 'validate' ? 'Valider la demande' : 'Refuser la demande'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {validationRequest.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowValidationModal(false);
                  setValidationRequest(null);
                  setValidationAction(null);
                  setValidationComment('');
                }}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Résumé de la demande */}
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Département</p>
                      <p className="font-medium text-slate-900">{validationRequest.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Budget</p>
                      <p className="font-medium text-slate-900">{validationRequest.budget?.toLocaleString()} €</p>
                    </div>
                  </div>
                </div>

                {/* Commentaire */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    {validationAction === 'validate' ? 'Commentaire de validation' : 'Motif du refus'} *
                  </label>
                  <textarea
                    value={validationComment}
                    onChange={(e) => setValidationComment(e.target.value)}
                    placeholder={validationAction === 'validate' 
                      ? "Expliquez pourquoi vous validez cette demande..." 
                      : "Expliquez le motif du refus..."}
                    className="w-full px-4 py-3 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>

                {/* Information supplémentaire */}
                {validationAction === 'validate' && (
                  <div className="p-4 rounded-lg bg-blue-50">
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Prochaine étape :</span>{' '}
                      {getNextValidationLevel() === 'COMPLETED' 
                        ? 'Cette validation finale clôturera le processus et publiera l\'offre.'
                        : `La demande sera transmise au niveau ${getNextValidationLevel()}.`}
                    </p>
                  </div>
                )}

                {validationAction === 'reject' && (
                  <div className="p-4 rounded-lg bg-red-50">
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Attention :</span>{' '}
                      Cette action est irréversible. La demande sera définitivement refusée.
                    </p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowValidationModal(false);
                      setValidationRequest(null);
                      setValidationAction(null);
                      setValidationComment('');
                    }}
                    className="px-6 py-2 font-medium transition-all rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleValidationAction}
                    disabled={!validationComment.trim()}
                    className={`flex items-center px-6 py-2 space-x-2 font-medium text-white transition-all rounded-lg ${
                      validationAction === 'validate' 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' 
                        : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {validationAction === 'validate' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirmer la validation</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Confirmer le refus</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Détails de la demande</h3>
                  <p className="text-sm text-slate-600">
                    {user?.role?.toLowerCase() === 'manager' 
                      ? 'Demande créée par vous'
                      : `Demande à valider au niveau ${validationLevel}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <XCircleIcon className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                      <h4 className="mb-3 font-semibold text-slate-900">Informations principales</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-slate-600">Poste</label>
                          <p className="font-bold text-slate-900">{showDetailsModal.title}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-600">Département</label>
                            <p className="font-medium text-slate-900">{showDetailsModal.department}</p>
                          </div>
                          <div>
                            <label className="text-sm text-slate-600">Localisation</label>
                            <p className="font-medium text-slate-900">{showDetailsModal.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                      <h4 className="mb-3 font-semibold text-slate-900">Détails du contrat</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-600">Type</label>
                            <p className="font-medium text-slate-900">{showDetailsModal.contract_type}</p>
                          </div>
                          <div>
                            <label className="text-sm text-slate-600">Niveau</label>
                            <p className="font-medium text-slate-900">{showDetailsModal.level}</p>
                          </div>
                          <div>
                            <label className="text-sm text-slate-600">Expérience</label>
                            <p className="font-medium text-slate-900">{showDetailsModal.experience}</p>
                          </div>
                          <div>
                            <label className="text-sm text-slate-600">Télétravail</label>
                            <p className="font-medium text-slate-900">{showDetailsModal.remote_work ? 'Oui' : 'Non'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                      <h4 className="mb-3 font-semibold text-slate-900">Budget et délai</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-slate-600">Budget annuel</label>
                          <p className="text-2xl font-bold text-slate-900">{showDetailsModal.budget?.toLocaleString()} €</p>
                        </div>
                        <div>
                          <label className="text-sm text-slate-600">Délai estimé</label>
                          <p className="font-medium text-slate-900">{showDetailsModal.estimated_time}</p>
                        </div>
                        <div>
                          <label className="text-sm text-slate-600">Priorité</label>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(showDetailsModal.urgent)}`}>
                            {showDetailsModal.urgent ? 'URGENT' : 'STANDARD'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                      <h4 className="mb-3 font-semibold text-slate-900">Demandeur</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-slate-600">Nom</label>
                          <p className="font-medium text-slate-900">{showDetailsModal.created_by_name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-600">Rôle</label>
                            <p className="font-medium text-slate-900">{showDetailsModal.created_by_role}</p>
                          </div>
                          <div>
                            <label className="text-sm text-slate-600">Date</label>
                            <p className="font-medium text-slate-900">
                              {new Date(showDetailsModal.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Afficher les commentaires */}
                {showDetailsModal.comments && showDetailsModal.comments.length > 0 && (
                  <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                    <h4 className="mb-3 font-semibold text-slate-900">Commentaires</h4>
                    <div className="space-y-3">
                      {showDetailsModal.comments.map((comment, index) => (
                        <div key={index} className="p-3 rounded-lg bg-slate-50">
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-slate-900">{comment.user}</span>
                            <span className="text-xs text-slate-500">
                              {new Date(comment.timestamp).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Afficher la progression de la validation pour les rôles supérieurs */}
                {['rh', 'daf', 'dga'].includes(user?.role?.toLowerCase() || '') && (
                  <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                    <h4 className="mb-3 font-semibold text-slate-900">Progression de la validation</h4>
                    {renderValidationProgress()}
                  </div>
                )}

                {/* Description et compétences */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                    <h4 className="mb-3 font-semibold text-slate-900">Description</h4>
                    <p className="whitespace-pre-line text-slate-700">{showDetailsModal.description}</p>
                  </div>
                  <div className="p-5 bg-white border border-slate-200/70 rounded-xl">
                    <h4 className="mb-3 font-semibold text-slate-900">Compétences requises</h4>
                    <div className="flex flex-wrap gap-2">
                      {showDetailsModal.required_skills?.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 text-sm text-blue-700 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="flex justify-center pt-4">
                  {user?.role?.toLowerCase() === 'manager' ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          handleOpenEditModal(showDetailsModal);
                          setShowDetailsModal(null);
                        }}
                        className="px-8 py-3 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600"
                      >
                        Modifier la demande
                      </button>
                      <button
                        onClick={() => setShowDetailsModal(null)}
                        className="px-8 py-3 font-medium transition-all bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-xl hover:from-slate-300 hover:to-slate-400"
                      >
                        Fermer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRequest(showDetailsModal);
                        setShowDetailsModal(null);
                      }}
                      className="px-8 py-3 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
                    >
                      Valider cette demande
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}