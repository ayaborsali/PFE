// Composant affichant la liste des demandes de validation en attente pour le recruteur, avec un mode test pour simuler les différentes étapes de validation et les rôles
import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Edit2, MessageSquare, Eye,
  XCircle as XCircleIcon, Filter, Search,
  Clock, AlertCircle, Zap, Building, DollarSign,
  Users, Shield, Award, FileText, Sparkles,
  UserCheck, UserX, History
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
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
}

interface Props {
  onUpdate: () => void;
  searchTerm: string;
}

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
    ]
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

  const handleTestAction = (actionType: string, comment?: string) => {
    switch (actionType) {
      case 'validate':
        toast.success('✅ Demande validée avec succès !', {
          duration: 3000,
          position: 'top-right',
        });
        break;
      case 'reject':
        toast.error('❌ Demande refusée', {
          duration: 3000,
          position: 'top-right',
        });
        break;
      case 'modify':
        toast.success('📝 Modification enregistrée', {
          duration: 3000,
          position: 'top-right',
        });
        break;
      case 'comment':
        toast.success(`💬 Commentaire: "${comment || 'Ajouté avec succès'}"`, {
          duration: 3000,
          position: 'top-right',
        });
        break;
      default:
        toast.success(`Action: ${actionType}`, {
          duration: 2000,
          position: 'top-center',
        });
    }
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

  const handleQuickAction = (requestId: string, action: 'validate' | 'reject') => {
    // Manager ne peut pas valider ni refuser sa propre demande
    if (userRole.toLowerCase() === 'manager') {
      toast.error('Le Manager ne peut pas valider sa propre demande. La validation doit être faite par le Directeur.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    
    const comment = prompt(`${action === 'validate' ? 'Valider' : 'Refuser'} la demande - Entrez un commentaire:`, 
      action === 'validate' ? 'Je valide cette demande' : 'Je refuse cette demande');
    
    if (comment !== null) {
      handleTestAction(action, comment);
      
      // Simuler la mise à jour de l'état
      if (testMode && action === 'validate') {
        const nextLevel = getNextValidationLevel();
        if (nextLevel === 'COMPLETED') {
          toast.success('🎉 Validation finale ! La demande est complètement validée.', {
            duration: 4000,
            position: 'top-right',
          });
        } else {
          toast.success(`✅ Validé pour ${nextLevel}`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      }
    }
  };

  const handleModifyRequest = () => {
    const newTitle = prompt('Modifier le titre du poste:', exampleRequest.title);
    const newBudget = prompt('Modifier le budget (€):', exampleRequest.budget.toString());
    const newDescription = prompt('Modifier la description:', exampleRequest.description);
    
    if (newTitle || newBudget || newDescription) {
      const updatedRequests = requests.map(req => {
        if (req.id === exampleRequest.id) {
          return {
            ...req,
            title: newTitle || req.title,
            budget: newBudget ? parseInt(newBudget) : req.budget,
            description: newDescription || req.description,
            validation_history: [
              ...req.validation_history!,
              {
                action: 'MODIFIED',
                level: 'Manager',
                user: 'Jean Dupont',
                user_role: 'Manager',
                comment: 'Modification effectuée',
                timestamp: new Date().toISOString(),
              }
            ]
          };
        }
        return req;
      });
      
      setRequests(updatedRequests);
      handleTestAction('modify', 'Modification enregistrée avec succès');
    }
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
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
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                      ✓ Validé
                    </span>
                  ) : isCurrentLevel ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      À valider
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
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
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h5 className="font-medium text-slate-900 mb-2">Historique des validations</h5>
            <div className="space-y-2">
              {requests[0].validation_history
                .filter(h => h.action === 'VALIDATED')
                .map((history, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 bg-slate-50 rounded-lg">
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Test */}
      {testMode && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
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
              className="px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50"
            >
              Mode Production
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-amber-800 mb-2">Testez avec différents rôles :</p>
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
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-blue-700 font-medium">
                      En tant que Manager, vous êtes le créateur de cette demande.
                    </p>
                    <p className="text-sm text-blue-600">
                      La validation commencera au niveau Directeur. Vous pouvez uniquement modifier ou commenter.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={handleModifyRequest}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => {
                    const comment = prompt('Ajouter un commentaire:', 'À discuter avec le service RH');
                    if (comment !== null) handleTestAction('comment', comment);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Commenter</span>
                </button>
                <button
                  onClick={() => {
                    const comment = prompt('Commentaire de validation (test):', 'Excellent profil, je valide !');
                    if (comment !== null) handleTestAction('validate', comment);
                  }}
                  disabled
                  className="px-4 py-2 bg-gradient-to-r from-slate-300 to-slate-400 text-white text-sm font-medium rounded-lg flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Valider</span>
                </button>
                <button
                  onClick={() => {
                    const comment = prompt('Commentaire de refus (test):', 'Budget trop élevé pour ce poste');
                    if (comment !== null) handleTestAction('reject', comment);
                  }}
                  disabled
                  className="px-4 py-2 bg-gradient-to-r from-slate-300 to-slate-400 text-white text-sm font-medium rounded-lg flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Refuser</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    const comment = prompt('Commentaire de validation:', 'Excellent profil, je valide !');
                    if (comment !== null) handleTestAction('validate', comment);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Valider</span>
                </button>
                <button
                  onClick={() => {
                    const comment = prompt('Commentaire de refus:', 'Budget trop élevé pour ce poste');
                    if (comment !== null) handleTestAction('reject', comment);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-orange-600 transition-all flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Refuser</span>
                </button>
                <button
                  onClick={() => handleTestAction('modify')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => {
                    const comment = prompt('Ajouter un commentaire:', 'À discuter avec le service RH');
                    if (comment !== null) handleTestAction('comment', comment);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all flex items-center justify-center space-x-2"
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
      <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border border-blue-200/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Shield className="w-7 h-7 text-white" />
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
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {userRole.toLowerCase() === 'manager' ? 'Créateur' : validationLevel}
            </span>
            {canUserValidate() && (
              <button
                onClick={() => setSelectedRequest(requests[0])}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ouvrir le modal</span>
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
            className="bg-white border border-slate-200/70 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Informations de la demande */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
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
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {request.required_skills.length > 5 && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm">
                        +{request.required_skills.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Afficher la progression de la validation pour les rôles supérieurs */}
                {['rh', 'daf', 'dga'].includes(userRole.toLowerCase()) && renderValidationProgress()}
              </div>

              {/* Actions */}
              <div className="lg:w-80 space-y-3">
                {userRole.toLowerCase() === 'manager' ? (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <p className="text-sm font-medium text-amber-700">En attente de validation</p>
                      </div>
                      <p className="text-sm text-amber-600">
                        En tant que Manager, vous avez créé cette demande. 
                        Elle est maintenant en attente de validation par le Directeur.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleModifyRequest}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30"
                    >
                      <Edit2 className="w-5 h-5" />
                      <span>Modifier la demande</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Valider la demande</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleQuickAction(request.id, 'validate')}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 font-medium rounded-lg hover:from-emerald-200 hover:to-teal-200 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Valider</span>
                      </button>
                      <button
                        onClick={() => handleQuickAction(request.id, 'reject')}
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
                      onClick={() => handleTestAction('modify')}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-medium rounded-lg hover:from-blue-200 hover:to-cyan-200 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const comment = prompt('Ajouter un commentaire:');
                      if (comment !== null) {
                        handleTestAction('comment', comment);
                      }
                    }}
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
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune demande à valider</h3>
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
              handleTestAction('validate', 'Validation via modal complet');
            } else {
              fetchRequests();
              onUpdate();
            }
          }}
        />
      )}

      {/* Modal de détails */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Détails de la demande</h3>
                  <p className="text-slate-600 text-sm">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200/70 rounded-xl p-5">
                      <h4 className="font-semibold text-slate-900 mb-3">Informations principales</h4>
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

                    <div className="bg-white border border-slate-200/70 rounded-xl p-5">
                      <h4 className="font-semibold text-slate-900 mb-3">Détails du contrat</h4>
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
                    <div className="bg-white border border-slate-200/70 rounded-xl p-5">
                      <h4 className="font-semibold text-slate-900 mb-3">Budget et délai</h4>
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

                    <div className="bg-white border border-slate-200/70 rounded-xl p-5">
                      <h4 className="font-semibold text-slate-900 mb-3">Demandeur</h4>
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

                {/* Afficher la progression de la validation pour les rôles supérieurs */}
                {['rh', 'daf', 'dga'].includes(userRole.toLowerCase()) && (
                  <div className="bg-white border border-slate-200/70 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-900 mb-3">Progression de la validation</h4>
                    {renderValidationProgress()}
                  </div>
                )}

                {/* Description et compétences */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200/70 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-900 mb-3">Description</h4>
                    <p className="text-slate-700 whitespace-pre-line">{showDetailsModal.description}</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-xl p-5">
                    <h4 className="font-semibold text-slate-900 mb-3">Compétences requises</h4>
                    <div className="flex flex-wrap gap-2">
                      {showDetailsModal.required_skills?.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-700 rounded-lg text-sm"
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
                          handleModifyRequest();
                          setShowDetailsModal(null);
                        }}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30"
                      >
                        Modifier la demande
                      </button>
                      <button
                        onClick={() => setShowDetailsModal(null)}
                        className="px-8 py-3 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 font-medium rounded-xl hover:from-slate-300 hover:to-slate-400 transition-all"
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
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30"
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