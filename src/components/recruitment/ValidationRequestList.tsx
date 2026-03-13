// Composant affichant la liste des demandes de validation en attente pour le recruteur, avec un mode test pour simuler les différentes étapes de validation et les rôles
import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Edit2, MessageSquare, Eye,
  XCircle as XCircleIcon, Filter, Search,
  Clock, AlertCircle, Zap, Building, DollarSign,
  Users, Shield, Award, FileText, Sparkles,
  UserCheck, UserX, History, Save, X, Send, ThumbsUp, ThumbsDown
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

// Listes prédéfinies pour les sélections
const POSTE_OPTIONS = [
  'Développeur Full Stack Senior',
  'Développeur Frontend React',
  'Développeur Backend Node.js',
  'Chef de projet IT',
  'Product Owner',
  'Scrum Master',
  'Data Scientist',
  'Data Engineer',
  'DevOps Engineer',
  'Architecte Solution',
  'UI/UX Designer',
  'Technical Lead',
  'Ingénieur Cybersécurité',
  'Administrateur Système',
  'Business Analyst',
  'Chargé de recrutement',
  'Chargé de formation',
  'Gestionnaire de paie',
  'Comptable',
  'Contrôleur de gestion',
  'Responsable Marketing',
  'Community Manager',
  'Commercial B2B',
  'Chef de produit',
  'Assistante de direction',
  'Office Manager'
];

const DEPARTEMENT_OPTIONS = [
  'Direction IT',
  'Direction Marketing',
  'Direction Commerciale',
  'Direction RH',
  'Direction Financière',
  'Direction Administrative',
  'Direction Technique',
  'Direction des Opérations',
  'Direction Juridique',
  'Direction de la Communication',
  'Service Recrutement',
  'Service Formation',
  'Service Paie',
  'Service Comptabilité',
  'Service Contrôle de Gestion',
  'Service Commercial',
  'Service Marketing Digital',
  'Service Support Client',
  'Service R&D'
];

const LOCALISATION_OPTIONS = [
  'Paris',
  'Lyon',
  'Marseille',
  'Toulouse',
  'Bordeaux',
  'Lille',
  'Nantes',
  'Strasbourg',
  'Montpellier',
  'Rennes',
  'Grenoble',
  'Rouen',
  'Nice',
  'Toulon',
  'Aix-en-Provence',
  'Télétravail full remote',
  'Télétravail partiel'
];

export default function ValidationRequestList({ onUpdate, searchTerm }: Props) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<Request | null>(null);
  const [validationLevel, setValidationLevel] = useState('Manager');
  const [testMode, setTestMode] = useState(true);
  const [userRole, setUserRole] = useState('manager');
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

  // États pour le mode validation/refus
  const [validationAction, setValidationAction] = useState<'validate' | 'reject' | null>(null);
  const [validationRequest, setValidationRequest] = useState<Request | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Exemple de demande pour le test
  const exampleRequest: Request = {
    id: 'example-001',
    title: 'Développeur Full Stack Senior',
    department: 'Direction IT',
    location: 'Paris',
    contract_type: 'CDI',
    reason: 'Création de poste',
    budget: 65000,
    required_skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'MongoDB'],
    description: `Responsabilités :
• Développement d'applications web modernes en React et Node.js
• Architecture microservices et API REST
• Conception et maintenance de bases de données
• Collaboration avec les équipes produit et design
• Mentoring des développeurs juniors
• Participation aux revues de code et pair programming

Profil recherché :
• Minimum 5 ans d'expérience en développement full stack
• Expertise en React et écosystème JavaScript moderne
• Expérience avec Node.js et frameworks associés
• Connaissance des services cloud AWS
• Bonne compréhension des principes Agile/Scrum
• Excellentes compétences en communication`,
    urgent: true,
    status: 'InProgress',
    current_validation_level: 'Directeur',
    created_by_name: 'Jean Dupont',
    created_by_role: 'Manager',
    created_at: new Date().toISOString(),
    level: 'Senior',
    experience: '5-8 ans',
    remote_work: true,
    estimated_time: '30 jours',
    validation_history: [
      {
        action: 'CREATED',
        level: 'Manager',
        user: 'Jean Dupont',
        user_role: 'Manager',
        comment: 'Demande initiale créée',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    comments: []
  };

  useEffect(() => {
    const level = getCurrentValidationLevel();
    setValidationLevel(level);
    
    if (testMode) {
      // Mode test - utiliser l'exemple avec l'historique de validation mis à jour
      const updatedExample = getUpdatedExampleRequest(level);
      setRequests([updatedExample]);
      setLoading(false);
    } else {
      // Mode production - récupérer de la base de données
      fetchRequests();
    }
  }, [profile, testMode, userRole]);

  const getUpdatedExampleRequest = (level: string) => {
    const baseRequest = {
      ...exampleRequest,
      current_validation_level: userRole.toLowerCase() === 'manager' ? 'Directeur' : level,
    };

    // Ajouter l'historique de validation selon le rôle
    let validationHistory = [...exampleRequest.validation_history!];
    
    // Si on est DRH, DAF ou DGA, ajouter la validation du Directeur
    if (['rh', 'daf', 'dga'].includes(userRole.toLowerCase())) {
      if (!validationHistory.some(h => h.level === 'Directeur' && h.action === 'VALIDATED')) {
        validationHistory.push({
          action: 'VALIDATED',
          level: 'Directeur',
          user: 'Sophie Martin',
          user_role: 'Directeur',
          comment: 'Validé après analyse budgétaire',
          timestamp: new Date(Date.now() - 43200000).toISOString(), // Il y a 12 heures
        });
      }
    }

    // Si on est DAF ou DGA, ajouter la validation du DRH
    if (['daf', 'dga'].includes(userRole.toLowerCase())) {
      if (!validationHistory.some(h => h.level === 'DRH' && h.action === 'VALIDATED')) {
        validationHistory.push({
          action: 'VALIDATED',
          level: 'DRH',
          user: 'Marie Laurent',
          user_role: 'DRH',
          comment: 'Validé - Profil conforme aux besoins RH',
          timestamp: new Date(Date.now() - 21600000).toISOString(), // Il y a 6 heures
        });
      }
    }

    // Si on est DGA, ajouter la validation du DAF
    if (userRole.toLowerCase() === 'dga') {
      if (!validationHistory.some(h => h.level === 'DAF' && h.action === 'VALIDATED')) {
        validationHistory.push({
          action: 'VALIDATED',
          level: 'DAF',
          user: 'Thomas Bernard',
          user_role: 'DAF',
          comment: 'Budget approuvé et provisionné',
          timestamp: new Date(Date.now() - 10800000).toISOString(), // Il y a 3 heures
        });
      }
    }

    return {
      ...baseRequest,
      validation_history: validationHistory
    };
  };

  const getCurrentValidationLevel = () => {
    const role = userRole.toLowerCase();
    switch (role) {
      case 'manager': return 'Manager';
      case 'directeur': return 'Directeur';
      case 'rh': return 'DRH';
      case 'daf': return 'DAF';
      case 'dga': return 'DGA/DG';
      default: return 'Manager';
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from('recruitment_requests')
        .select('*')
        .eq('status', 'InProgress')
        .eq('current_validation_level', validationLevel)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query.or(`title.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching validation requests:', error);
      toast.error('Erreur lors du chargement des demandes à valider');
    } finally {
      setLoading(false);
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
    if (userRole.toLowerCase() === 'manager') {
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
      user: profile?.full_name || 'Utilisateur',
      user_role: userRole,
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

  // Fonction pour valider ou refuser la demande
  const handleValidationAction = () => {
    if (!validationRequest || !validationAction) return;

    // Mettre à jour l'historique de validation
    const updatedRequests = requests.map(req => {
      if (req.id === validationRequest.id) {
        const nextLevel = getNextValidationLevel();
        const isCompleted = nextLevel === 'COMPLETED';
        
        const updatedRequest = {
          ...req,
          status: validationAction === 'validate' 
            ? (isCompleted ? 'Validated' : 'InProgress')
            : 'Rejected',
          current_validation_level: validationAction === 'validate' && !isCompleted 
            ? nextLevel 
            : req.current_validation_level,
          validation_history: [
            ...(req.validation_history || []),
            {
              action: validationAction === 'validate' ? 'VALIDATED' : 'REJECTED',
              level: validationLevel,
              user: profile?.full_name || 'Utilisateur',
              user_role: userRole,
              comment: validationComment,
              timestamp: new Date().toISOString(),
            }
          ]
        };
        return updatedRequest;
      }
      return req;
    });

    setRequests(updatedRequests);
    setShowValidationModal(false);
    setValidationRequest(null);
    setValidationAction(null);
    setValidationComment('');

    if (validationAction === 'validate') {
      const nextLevel = getNextValidationLevel();
      if (nextLevel === 'COMPLETED') {
        toast.success('🎉 Validation finale ! La demande est complètement validée.', {
          duration: 4000,
          position: 'top-right',
        });
      } else {
        toast.success(`✅ Demande validée avec succès pour ${nextLevel}`, {
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

  // Fonction pour gérer l'ajout d'une compétence
  const handleAddSkill = (skill: string) => {
    if (skill && !editFormData.required_skills?.includes(skill)) {
      setEditFormData(prev => ({
        ...prev,
        required_skills: [...(prev.required_skills || []), skill]
      }));
    }
  };

  // Fonction pour supprimer une compétence
  const handleRemoveSkill = (skillToRemove: string) => {
    setEditFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = () => {
    if (!editingRequest) return;

    // Mettre à jour la requête avec les nouvelles données
    const updatedRequests = requests.map(req => {
      if (req.id === editingRequest.id) {
        const updatedRequest = {
          ...req,
          ...editFormData,
          validation_history: [
            ...(req.validation_history || []),
            {
              action: 'MODIFIED',
              level: 'Manager',
              user: req.created_by_name,
              user_role: 'Manager',
              comment: 'Modification effectuée via l\'interface',
              timestamp: new Date().toISOString(),
            }
          ]
        };
        return updatedRequest;
      }
      return req;
    });
    
    setRequests(updatedRequests);
    setShowEditModal(false);
    setEditingRequest(null);
    
    toast.success('📝 Demande modifiée avec succès', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const getPriorityColor = (urgent: boolean) => {
    return urgent 
      ? 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700' 
      : 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inprogress': return 'bg-amber-100 text-amber-700';
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'validated': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const testWithRole = (role: string) => {
    let level = '';
    switch (role.toLowerCase()) {
      case 'manager': 
        level = 'Manager';
        setUserRole('manager');
        break;
      case 'directeur': 
        level = 'Directeur';
        setUserRole('directeur');
        break;
      case 'rh': 
        level = 'DRH';
        setUserRole('rh');
        break;
      case 'daf': 
        level = 'DAF';
        setUserRole('daf');
        break;
      case 'dga': 
        level = 'DGA/DG';
        setUserRole('dga');
        break;
      default: 
        level = 'Manager';
        setUserRole('manager');
    }
    
    setValidationLevel(level);
    
    const updatedExample = getUpdatedExampleRequest(level);
    
    setRequests([updatedExample]);
    
    toast.success(`Mode test: ${role.toUpperCase()}`, {
      duration: 2000,
      position: 'top-center',
    });
  };

  const getNextValidationLevel = () => {
    switch (validationLevel) {
      case 'Directeur': return 'DRH';
      case 'DRH': return 'DAF';
      case 'DAF': return 'DGA/DG';
      case 'DGA/DG': return 'COMPLETED';
      default: return '';
    }
  };

  const canUserValidate = () => {
    // Dans le workflow réel, le manager ne peut pas valider sa propre demande
    // La validation commence au niveau Directeur
    return userRole.toLowerCase() !== 'manager';
  };

  const getValidationStatus = (level: string) => {
    const currentRequest = requests[0];
    if (!currentRequest?.validation_history) return 'PENDING';
    
    const validation = currentRequest.validation_history.find(
      h => h.level === level && h.action === 'VALIDATED'
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
          {levels.map((level, index) => {
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
                    ) : isCurrentLevel ? (
                      <Clock className="w-4 h-4" />
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
                .filter(h => h.action === 'VALIDATED')
                .map((history, index) => (
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
      {/* Mode Test */}
      {testMode && (
        <div className="p-4 border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Mode Test Activé</h4>
                <p className="text-sm text-amber-700">
                  {userRole.toLowerCase() === 'manager' 
                    ? 'Manager: Vous ne pouvez pas valider votre propre demande' 
                    : 'Testez toutes les fonctionnalités avec cette demande exemple'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTestMode(false)}
              className="px-4 py-2 text-sm font-medium bg-white border rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Mode Production
            </button>
          </div>
          
          <div className="mb-4">
            <p className="mb-2 text-sm text-amber-800">Testez avec différents rôles :</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => testWithRole('manager')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  userRole === 'manager' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                👨‍💼 Manager (Créateur)
              </button>
              <button
                onClick={() => testWithRole('directeur')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  userRole === 'directeur' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                👔 Directeur (1er validateur)
              </button>
              <button
                onClick={() => testWithRole('rh')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  userRole === 'rh' 
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white' 
                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                }`}
              >
                👩‍💼 DRH
              </button>
              <button
                onClick={() => testWithRole('daf')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  userRole === 'daf' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                💰 DAF
              </button>
              <button
                onClick={() => testWithRole('dga')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  userRole === 'dga' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                🎯 DGA/DG
              </button>
            </div>
          </div>
          
          {userRole.toLowerCase() === 'manager' ? (
            <div className="space-y-4">
              <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      En tant que Manager, vous êtes le créateur de cette demande.
                    </p>
                    <p className="text-sm text-blue-600">
                      La validation commencera au niveau Directeur. Vous pouvez uniquement modifier ou commenter.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <button
                  onClick={() => handleOpenEditModal(requests[0])}
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleOpenCommentModal(requests[0])}
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Commenter</span>
                </button>
                <button
                  disabled
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-sm font-medium text-white rounded-lg opacity-50 cursor-not-allowed bg-gradient-to-r from-slate-300 to-slate-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Valider</span>
                </button>
                <button
                  disabled
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-sm font-medium text-white rounded-lg opacity-50 cursor-not-allowed bg-gradient-to-r from-slate-300 to-slate-400"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Refuser</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <button
                  onClick={() => handleOpenValidationModal(requests[0], 'validate')}
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Valider</span>
                </button>
                <button
                  onClick={() => handleOpenValidationModal(requests[0], 'reject')}
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Refuser</span>
                </button>
                <button
                  onClick={() => handleOpenEditModal(requests[0])}
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleOpenCommentModal(requests[0])}
                  className="flex items-center justify-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Commenter</span>
                </button>
              </div>
              
              {/* Afficher la progression de la validation pour les rôles supérieurs */}
              {['rh', 'daf', 'dga'].includes(userRole.toLowerCase()) && renderValidationProgress()}
            </div>
          )}
        </div>
      )}

      {/* En-tête */}
      <div className="p-6 border bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border-blue-200/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Shield className="text-white w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">Validation en attente</h3>
              <p className="text-blue-700">
                {userRole.toLowerCase() === 'manager' 
                  ? 'Vous avez créé cette demande. En attente de validation par le Directeur'
                  : `${requests.length} demande(s) en attente de validation au niveau ${validationLevel}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
              {userRole.toLowerCase() === 'manager' ? 'Créateur' : validationLevel}
            </span>
            {canUserValidate() && (
              <button
                onClick={() => setSelectedRequest(requests[0])}
                className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ouvrir la demande</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
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
                {['rh', 'daf', 'dga'].includes(userRole.toLowerCase()) && renderValidationProgress()}
              </div>

              {/* Actions */}
              <div className="space-y-3 lg:w-80">
                {userRole.toLowerCase() === 'manager' ? (
                  <div className="space-y-3">
                    <div className="p-4 border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 rounded-xl">
                      <div className="flex items-center mb-2 space-x-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <p className="text-sm font-medium text-amber-700">En attente de validation</p>
                      </div>
                      <p className="text-sm text-amber-600">
                        En tant que Manager, vous avez créé cette demande. 
                        Elle est maintenant en attente de validation par le Directeur.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleOpenEditModal(request)}
                      className="flex items-center justify-center w-full px-6 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/30"
                    >
                      <Edit2 className="w-5 h-5" />
                      <span>Modifier la demande</span>
                    </button>
                  </div>
                ) : (
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
                  </>
                )}

                <div className="flex space-x-2">
                  {userRole.toLowerCase() !== 'manager' && (
                    <button
                      onClick={() => handleOpenEditModal(request)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-medium rounded-lg hover:from-blue-200 hover:to-cyan-200 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenCommentModal(request)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 font-medium rounded-lg hover:from-violet-200 hover:to-purple-200 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Commenter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {requests.length === 0 && !testMode && (
        <div className="py-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50">
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-900">Aucune demande à valider</h3>
          <p className="text-slate-600">
            {userRole.toLowerCase() === 'manager'
              ? 'Vous n\'avez aucune demande en cours de validation'
              : `Vous n'avez aucune demande en attente de validation au niveau ${validationLevel}`}
          </p>
        </div>
      )}

      {/* Modal de validation */}
      {selectedRequest && canUserValidate() && (
        <RequestValidationModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            setSelectedRequest(null);
            if (testMode) {
              handleValidationAction();
            } else {
              fetchRequests();
              onUpdate();
            }
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
                        ? 'Cette validation finale clôturera le processus.'
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

      {/* Modal d'édition avec listes déroulantes */}
      {showEditModal && editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Modifier la demande</h3>
                  <p className="text-sm text-slate-600">
                    Modifiez les informations de la demande de recrutement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                {/* Informations principales avec listes déroulantes */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Titre du poste *
                      </label>
                      <select
                        value={editFormData.title || ''}
                        onChange={(e) => handleEditFormChange('title', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionnez un poste</option>
                        {POSTE_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Département *
                      </label>
                      <select
                        value={editFormData.department || ''}
                        onChange={(e) => handleEditFormChange('department', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionnez un département</option>
                        {DEPARTEMENT_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Localisation *
                      </label>
                      <select
                        value={editFormData.location || ''}
                        onChange={(e) => handleEditFormChange('location', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionnez une localisation</option>
                        {LOCALISATION_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Type de contrat *
                      </label>
                      <select
                        value={editFormData.contract_type || ''}
                        onChange={(e) => handleEditFormChange('contract_type', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Stage">Stage</option>
                        <option value="Alternance">Alternance</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Budget annuel (€) *
                      </label>
                      <input
                        type="number"
                        value={editFormData.budget || ''}
                        onChange={(e) => handleEditFormChange('budget', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Niveau *
                      </label>
                      <select
                        value={editFormData.level || ''}
                        onChange={(e) => handleEditFormChange('level', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Junior">Junior</option>
                        <option value="Confirmé">Confirmé</option>
                        <option value="Senior">Senior</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Expérience requise *
                      </label>
                      <select
                        value={editFormData.experience || ''}
                        onChange={(e) => handleEditFormChange('experience', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="0-2 ans">0-2 ans</option>
                        <option value="2-5 ans">2-5 ans</option>
                        <option value="5-8 ans">5-8 ans</option>
                        <option value="8+ ans">8+ ans</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Délai estimé *
                      </label>
                      <input
                        type="text"
                        value={editFormData.estimated_time || ''}
                        onChange={(e) => handleEditFormChange('estimated_time', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ex: 30 jours"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editFormData.remote_work || false}
                          onChange={(e) => handleEditFormChange('remote_work', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Télétravail possible</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editFormData.urgent || false}
                          onChange={(e) => handleEditFormChange('urgent', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Urgent</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Compétences */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Compétences requises
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editFormData.required_skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 text-sm text-blue-700 rounded-lg bg-blue-50"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Ajouter une compétence..."
                      className="flex-1 px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="newSkillInput"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          handleAddSkill(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('newSkillInput') as HTMLInputElement;
                        if (input.value) {
                          handleAddSkill(input.value);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Description du poste *
                  </label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez les responsabilités, le profil recherché, etc."
                  />
                </div>
                
                {/* Boutons d'action */}
                <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 font-medium transition-all rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center px-6 py-2 space-x-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de commentaire */}
      {showCommentModal && commentingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Commentaires</h3>
                  <p className="text-sm text-slate-600">
                    {commentingRequest.title}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseCommentModal}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {/* Liste des commentaires existants */}
              <div className="mb-6 space-y-4">
                {comments.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="mt-2 text-slate-500">Aucun commentaire pour le moment</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-white border rounded-lg border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900">{comment.user}</span>
                          <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                            {comment.user_role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-slate-700">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Zone de saisie du commentaire */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex space-x-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Écrivez votre commentaire..."
                  className="flex-1 px-4 py-2 border rounded-lg resize-none border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end mt-3 space-x-2">
                <button
                  onClick={handleCloseCommentModal}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-200 hover:bg-slate-300"
                >
                  Fermer
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer</span>
                </button>
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
                    {userRole.toLowerCase() === 'manager' 
                      ? 'Demande créée par vous - En attente de validation'
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
                {['rh', 'daf', 'dga'].includes(userRole.toLowerCase()) && (
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
                  {userRole.toLowerCase() === 'manager' ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          handleOpenEditModal(showDetailsModal);
                          setShowDetailsModal(null);
                        }}
                        className="px-8 py-3 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/30"
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
                      className="px-8 py-3 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30"
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