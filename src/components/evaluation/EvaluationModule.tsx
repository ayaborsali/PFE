import { useState, useEffect } from 'react';
import { 
  Plus, BarChart3, Clock, CheckCircle, AlertCircle, 
  Users, TrendingUp, Filter, Download, Calendar,
  Award, Target, Star, UserCheck, RefreshCw,
  Edit, Send, MessageSquare, Mail, Bell
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import EvaluationList from './EvaluationList';
import NewEvaluationModal from './NewEvaluationModal';
import toast from 'react-hot-toast';

export default function EvaluationModule() {
  const { profile } = useAuth();
  const [showNewModal, setShowNewModal] = useState(false);
  const [stats, setStats] = useState({
    draft: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    total: 0,
    closureRate: 0, // Taux de clôture
    pendingN2Validation: 0, // En attente validation N+2
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    period: 'all',
    department: 'all',
    urgency: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [timeRange, setTimeRange] = useState('30days');
  const [contractNotifications, setContractNotifications] = useState([]);

  useEffect(() => {
    fetchStats();
    checkContractDeadlines();
    // Vérifier toutes les 24h pour les notifications automatiques
    const interval = setInterval(checkContractDeadlines, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Fonction pour vérifier les échéances de contrat à J-30
  const checkContractDeadlines = async () => {
    try {
      const today = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(today.getDate() + 30); // J-30

      const { data: contracts, error } = await supabase
        .from('employee_contracts')
        .select(`
          *,
          employee:employees(*),
          manager:profiles(*)
        `)
        .eq('status', 'active')
        .lte('end_date', thresholdDate.toISOString())
        .gt('end_date', today.toISOString());

      if (error) throw error;

      // Vérifier si une notification a déjà été envoyée pour chaque contrat
      const notificationsToSend = [];
      for (const contract of contracts) {
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('*')
          .eq('contract_id', contract.id)
          .eq('type', 'contract_reminder_30d')
          .single();

        if (!existingNotification && contract.manager?.email) {
          notificationsToSend.push(contract);
        }
      }

      // Envoyer les notifications par email
      for (const contract of notificationsToSend) {
        await sendContractNotification(contract);
      }

      setContractNotifications(notificationsToSend);
    } catch (error) {
      console.error('Erreur vérification contrats:', error);
    }
  };

  // Fonction pour envoyer une notification de contrat
  const sendContractNotification = async (contract) => {
    try {
      // Enregistrer la notification dans la base
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          type: 'contract_reminder_30d',
          contract_id: contract.id,
          recipient_id: contract.manager_id,
          recipient_email: contract.manager?.email,
          sent_at: new Date().toISOString(),
          status: 'sent',
          data: {
            employee_name: `${contract.employee?.first_name} ${contract.employee?.last_name}`,
            contract_end_date: contract.end_date,
            days_remaining: Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24))
          }
        });

      if (notifError) throw notifError;

      // Ici, intégrer avec votre service d'envoi d'emails
      // Exemple: await sendEmail({...})
      
      console.log(`Notification envoyée pour le contrat ${contract.id}`);
    } catch (error) {
      console.error('Erreur envoi notification:', error);
    }
  };

  // Fonction pour vérifier les délais de traitement (48h)
  const checkProcessingDeadlines = async () => {
    try {
      const now = new Date();
      const deadlineThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Récupérer les évaluations en attente depuis plus de 48h
      const { data: overdueEvaluations, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          manager:profiles(*),
          n2_manager:profiles!evaluations_n2_manager_id_fkey(*)
        `)
        .in('status', ['pending_n1', 'pending_n2'])
        .lte('last_status_change', deadlineThreshold.toISOString());

      if (error) throw error;

      // Envoyer des rappels pour chaque évaluation en retard
      for (const evaluation of overdueEvaluations) {
        await sendReminderNotification(evaluation);
      }
    } catch (error) {
      console.error('Erreur vérification délais:', error);
    }
  };

  // Fonction pour envoyer un rappel
  const sendReminderNotification = async (evaluation) => {
    const recipient = evaluation.status === 'pending_n1' 
      ? evaluation.manager 
      : evaluation.n2_manager;

    if (recipient?.email) {
      // Enregistrer le rappel
      await supabase
        .from('notifications')
        .insert({
          type: 'evaluation_reminder_48h',
          evaluation_id: evaluation.id,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

      // Ici, intégrer avec votre service d'envoi d'emails
      console.log(`Rappel envoyé à ${recipient.email} pour l'évaluation ${evaluation.id}`);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0);
      }

      // Récupérer toutes les évaluations avec leurs états
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Calculer le taux de clôture
      const completedEvaluations = evaluations.filter(e => e.status === 'completed').length;
      const inProgressEvaluations = evaluations.filter(e => 
        ['pending_n1', 'pending_n2', 'pending_drh', 'pending_daf', 'pending_dga'].includes(e.status)
      ).length;
      
      const closureRate = inProgressEvaluations > 0 
        ? Math.round((completedEvaluations / (completedEvaluations + inProgressEvaluations)) * 100)
        : 0;

      // Calculer les statistiques
      const statsData = {
        draft: evaluations.filter(e => e.status === 'draft').length,
        pending: evaluations.filter(e => e.status === 'pending_n1').length,
        inProgress: evaluations.filter(e => 
          ['pending_n1', 'pending_n2', 'pending_drh', 'pending_daf', 'pending_dga'].includes(e.status)
        ).length,
        completed: completedEvaluations,
        overdue: evaluations.filter(e => {
          const dueDate = new Date(e.due_date);
          return !['completed', 'cancelled'].includes(e.status) && dueDate < now;
        }).length,
        total: evaluations.length,
        closureRate,
        pendingN2Validation: evaluations.filter(e => e.status === 'pending_n2').length,
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer les actions de validation
  const handleValidationAction = async (evaluationId, action, level, comments = '') => {
    try {
      const { data: evaluation, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single();

      if (fetchError) throw fetchError;

      let newStatus = evaluation.status;
      let updateData = {};

      switch (action) {
        case 'modify':
          updateData = {
            status: 'draft',
            last_modified_by: profile.id,
            last_modified_at: new Date().toISOString(),
            comments: comments ? [...(evaluation.comments || []), {
              author: profile.id,
              author_name: `${profile.first_name} ${profile.last_name}`,
              content: comments,
              level: level,
              action: 'modify',
              timestamp: new Date().toISOString()
            }] : evaluation.comments
          };
          break;

        case 'validate':
          // Déterminer le prochain statut selon le niveau
          const nextStatus = getNextStatus(evaluation.status, level);
          updateData = {
            status: nextStatus,
            validated_at: new Date().toISOString(),
            validated_by: profile.id,
            last_status_change: new Date().toISOString(),
            comments: comments ? [...(evaluation.comments || []), {
              author: profile.id,
              author_name: `${profile.first_name} ${profile.last_name}`,
              content: comments,
              level: level,
              action: 'validate',
              timestamp: new Date().toISOString()
            }] : evaluation.comments
          };
          break;

        case 'comment':
          updateData = {
            comments: [...(evaluation.comments || []), {
              author: profile.id,
              author_name: `${profile.first_name} ${profile.last_name}`,
              content: comments,
              level: level,
              action: 'comment',
              timestamp: new Date().toISOString()
            }]
          };
          break;
      }

      const { error: updateError } = await supabase
        .from('evaluations')
        .update(updateData)
        .eq('id', evaluationId);

      if (updateError) throw updateError;

      toast.success(`Action "${action}" effectuée avec succès`);
      fetchStats();
    } catch (error) {
      console.error('Error handling validation action:', error);
      toast.error('Erreur lors de l\'action de validation');
    }
  };

  // Fonction pour déterminer le prochain statut
  const getNextStatus = (currentStatus, level) => {
    const statusFlow = {
      'pending_n1': 'pending_n2',
      'pending_n2': 'pending_drh',
      'pending_drh': 'pending_daf',
      'pending_daf': 'pending_dga',
      'pending_dga': 'completed'
    };
    return statusFlow[currentStatus] || currentStatus;
  };

  const handleExport = async () => {
    try {
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          employee:employees(*),
          manager:profiles(*),
          n2_manager:profiles!evaluations_n2_manager_id_fkey(*)
        `);

      if (error) throw error;

      // Calculer les statistiques de répartition
      const distributionByMotif = {};
      const distributionByDirection = {};
      const distributionBySite = {};

      evaluations.forEach(e => {
        // Répartition par motif
        distributionByMotif[e.evaluation_type] = (distributionByMotif[e.evaluation_type] || 0) + 1;
        
        // Répartition par direction
        distributionByDirection[e.department] = (distributionByDirection[e.department] || 0) + 1;
        
        // Répartition par site (si disponible)
        if (e.employee?.site) {
          distributionBySite[e.employee.site] = (distributionBySite[e.employee.site] || 0) + 1;
        }
      });

      // Créer le CSV avec les données d'évaluation
      const csvEvaluations = "data:text/csv;charset=utf-8," 
        + ["ID,Employé,Manager,N+2,Poste,Département,Type,Motif,Date d'échéance,Statut,Score,Date création,Date validation"].join(",") + "\n"
        + evaluations.map(e => 
          `${e.id},"${e.employee?.first_name || ''} ${e.employee?.last_name || ''}","${e.manager?.first_name || ''} ${e.manager?.last_name || ''}","${e.n2_manager?.first_name || ''} ${e.n2_manager?.last_name || ''}","${e.job_title || ''}","${e.department || ''}","${e.evaluation_type || ''}","${e.reason || ''}",${new Date(e.due_date).toLocaleDateString('fr-FR')},${e.status},${e.final_score || 'N/A'},${new Date(e.created_at).toLocaleDateString('fr-FR')},${e.validated_at ? new Date(e.validated_at).toLocaleDateString('fr-FR') : 'N/A'}`
        ).join("\n");

      // Créer un CSV pour les statistiques de répartition
      const csvStats = "data:text/csv;charset=utf-8," 
        + ["Type,Répartition,Valeur,Pourcentage"].join(",") + "\n"
        + [
          ...Object.entries(distributionByMotif).map(([motif, count]) => 
            `Motif,${motif},${count},${((count / evaluations.length) * 100).toFixed(2)}%`
          ),
          ...Object.entries(distributionByDirection).map(([direction, count]) => 
            `Direction,${direction},${count},${((count / evaluations.length) * 100).toFixed(2)}%`
          ),
          ...Object.entries(distributionBySite).map(([site, count]) => 
            `Site,${site},${count},${((count / evaluations.length) * 100).toFixed(2)}%`
          )
        ].join("\n");

      // Télécharger les deux fichiers
      const downloadCSV = (content, filename) => {
        const encodedUri = encodeURI(content);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      downloadCSV(csvEvaluations, `evaluations_kilani_${new Date().toISOString().split('T')[0]}.csv`);
      downloadCSV(csvStats, `statistiques_repartition_${new Date().toISOString().split('T')[0]}.csv`);
      
      toast.success('Exports CSV générés avec succès');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const canCreateEvaluation = () => {
    return profile?.role && ['Manager', 'Director', 'DRH', 'HR', 'Payroll'].includes(profile.role);
  };

  // Fonction pour extraire les données contractuelles
  const extractEmployeeContractData = async (employeeId) => {
    try {
      const { data: contract, error } = await supabase
        .from('employee_contracts')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      return contract;
    } catch (error) {
      console.error('Erreur extraction données contractuelles:', error);
      return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête avec actions */}
      <div className="p-6 border shadow-sm bg-gradient-to-br from-white to-slate-50 border-slate-200/70 rounded-2xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="flex items-center mb-2 space-x-3">
              <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Award className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Module d'Évaluation</h1>
                <p className="mt-1 text-slate-600">
                  Gestion des évaluations avec workflow de validation multi-niveaux
                  {contractNotifications.length > 0 && (
                    <span className="px-2 py-1 ml-2 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                      {contractNotifications.length} contrat(s) à échéance J-30
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 font-medium rounded-lg hover:from-slate-200 hover:to-gray-200 transition-all flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </button>
            
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 font-medium rounded-lg hover:from-violet-200 hover:to-purple-200 transition-all flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
            
            {canCreateEvaluation() && (
              <button
                onClick={() => setShowNewModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nouvelle évaluation</span>
              </button>
            )}
          </div>
        </div>

        {/* Période de temps */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Période :</span>
          </div>
          <div className="flex p-1 space-x-1 rounded-lg bg-slate-100">
            {['7days', '30days', '90days', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  timeRange === range
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === '7days' ? '7j' :
                 range === '30days' ? '30j' :
                 range === '90days' ? '90j' : '1an'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="p-5 border shadow-sm bg-gradient-to-br from-white to-blue-50 border-blue-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Filtres avancés</h3>
            <button
              onClick={() => setFilters({
                status: 'all',
                period: 'all',
                department: 'all',
                urgency: 'all',
              })}
              className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réinitialiser</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="pending_n1">En attente N+1</option>
                <option value="pending_n2">En attente N+2</option>
                <option value="pending_drh">En attente DRH</option>
                <option value="pending_daf">En attente DAF</option>
                <option value="pending_dga">En attente DGA</option>
                <option value="completed">Terminée</option>
                <option value="overdue">En retard</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Type d'évaluation</label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({...filters, period: e.target.value})}
                className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="contract_end">Fin de contrat</option>
                <option value="probation">Fin période d'essai</option>
                <option value="annual">Annuelle</option>
                <option value="midYear">Semestrielle</option>
                <option value="promotion">Promotion</option>
                <option value="exit">Sortie</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Département</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous départements</option>
                <option value="it">IT</option>
                <option value="sales">Commercial</option>
                <option value="marketing">Marketing</option>
                <option value="hr">RH</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Urgence</label>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters({...filters, urgency: e.target.value})}
                className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous</option>
                <option value="critical">Critique (≤ 3j)</option>
                <option value="high">Haute (≤ 7j)</option>
                <option value="medium">Moyenne (≤ 15j)</option>
                <option value="low">Basse (&gt; 15j)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard de statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
        <div className="p-5 transition-shadow border shadow-sm bg-gradient-to-br from-white to-slate-50 rounded-xl border-slate-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-sm text-slate-600">Évaluations</p>
        </div>

        <div className="p-5 transition-shadow border shadow-sm bg-gradient-to-br from-white to-amber-50 rounded-xl border-amber-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">
              En cours
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.inProgress}</p>
          <p className="mt-1 text-sm text-slate-600">À compléter</p>
        </div>

        <div className="p-5 transition-shadow border shadow-sm bg-gradient-to-br from-white to-rose-50 rounded-xl border-rose-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full">
              En retard
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.overdue}</p>
          <p className="mt-1 text-sm text-slate-600">Dépassées</p>
        </div>

        <div className="p-5 transition-shadow border shadow-sm bg-gradient-to-br from-white to-emerald-50 rounded-xl border-emerald-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
              Terminées
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.completed}</p>
          <p className="mt-1 text-sm text-slate-600">Finalisées</p>
        </div>

        <div className="p-5 transition-shadow border shadow-sm bg-gradient-to-br from-white to-slate-50 rounded-xl border-slate-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-slate-100 to-gray-100 rounded-lg">
              <Target className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              N+2
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.pendingN2Validation}</p>
          <p className="mt-1 text-sm text-slate-600">À valider N+2</p>
        </div>

        <div className="p-5 transition-shadow border border-blue-200 shadow-sm bg-gradient-to-br from-white to-blue-50 rounded-xl hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
              Clôture
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.closureRate}%</p>
          <p className="mt-1 text-sm text-slate-600">Taux de clôture</p>
        </div>

        <div className="p-5 transition-shadow border border-purple-200 shadow-sm bg-gradient-to-br from-white to-purple-50 rounded-xl hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full">
              Notifs
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{contractNotifications.length}</p>
          <p className="mt-1 text-sm text-slate-600">Contrats J-30</p>
        </div>

        <div className="p-5 transition-shadow border border-green-200 shadow-sm bg-gradient-to-br from-white to-green-50 rounded-xl hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
              Rappels
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">48h</p>
          <p className="mt-1 text-sm text-slate-600">Délai traitement</p>
        </div>
      </div>

      {/* Widgets supplémentaires */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Widget état de sortie */}
        <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">États de sortie</h3>
              <p className="text-sm text-slate-600">Statistiques de répartition</p>
            </div>
            <BarChart3 className="w-6 h-6 text-blue-500" />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">Taux de clôture</span>
                <span className="text-sm font-bold text-blue-600">{stats.closureRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200">
                <div 
                  className="h-2 transition-all duration-500 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  style={{ width: `${stats.closureRate}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="mb-1 text-xs text-slate-500">Évaluations en cours</p>
                <p className="text-lg font-bold text-slate-900">{stats.inProgress}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50">
                <p className="mb-1 text-xs text-emerald-500">Évaluations terminées</p>
                <p className="text-lg font-bold text-emerald-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Widget rappels automatiques */}
        <div className="p-6 border shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-amber-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-amber-900">Rappels automatiques</h3>
              <p className="text-sm text-amber-700/80">Système de notifications</p>
            </div>
            <Bell className="w-6 h-6 text-amber-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/50">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">Contrats à échéance J-30</p>
                  <p className="text-xs text-amber-700">Notification automatique au manager</p>
                </div>
              </div>
              <span className="px-2 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800">
                {contractNotifications.length}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/50">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-rose-600" />
                <div>
                  <p className="font-medium text-amber-900">Délai de traitement 48h</p>
                  <p className="text-xs text-amber-700">Rappel automatique si dépassé</p>
                </div>
              </div>
              <span className="px-2 py-1 text-sm font-medium rounded-full bg-rose-100 text-rose-800">
                Actif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste principale des évaluations */}
      <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
        <div className="border-b border-slate-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Toutes les évaluations</h3>
                  <p className="text-sm text-slate-600">
                    {stats.total} évaluations • {stats.closureRate}% taux de clôture • {stats.overdue} en retard
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={checkProcessingDeadlines}
                  className="p-2 transition-colors rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  title="Vérifier les rappels"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="p-2 transition-colors rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  title="Actualiser"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 font-medium text-slate-600">Chargement des évaluations...</p>
            </div>
          ) : (
            <EvaluationList 
              onUpdate={fetchStats} 
              filters={filters}
              onValidationAction={handleValidationAction}
              profile={profile}
            />
          )}
        </div>
      </div>

      {/* Modal de nouvelle évaluation */}
      {showNewModal && (
        <NewEvaluationModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            fetchStats();
            toast.success('Nouvelle évaluation créée avec succès');
          }}
          extractEmployeeData={extractEmployeeContractData}
        />
      )}
    </div>
  );
}