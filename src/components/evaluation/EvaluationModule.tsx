import { useState, useEffect } from 'react';
import { 
  Plus, BarChart3, Clock, CheckCircle, AlertCircle, 
  Users, TrendingUp, Filter, Download, Calendar,
  Award, Target, Star, UserCheck, RefreshCw,
  Edit, Send, MessageSquare, Mail, Bell,
  UserPlus, UserMinus, Briefcase, GraduationCap, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import EvaluationList from './EvaluationList';
import NewEvaluationModal from './NewEvaluationModal';
import ProbationEvaluationForm from './ProbationEvaluationForm';
import EmployeeSelector from './EmployeeSelector';
import toast from 'react-hot-toast';

export default function EvaluationModule() {
  const { profile } = useAuth();
  const [showNewModal, setShowNewModal] = useState(false);
  const [showProbationForm, setShowProbationForm] = useState(false);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeContract, setSelectedEmployeeContract] = useState(null);
  const [testMode, setTestMode] = useState(true); // Mode test activé par défaut
  const [stats, setStats] = useState({
    draft: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    total: 0,
    closureRate: 0,
    pendingN2Validation: 0,
    probationPending: 0,
    probationCompleted: 0,
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
  const [probationEmployees, setProbationEmployees] = useState([]);

  // Mocks de données pour le mode test
  const mockEmployees = [
    {
      id: 'emp-001',
      first_name: 'Jean',
      last_name: 'Dupont',
      position: 'Développeur Full Stack',
      department: 'Direction IT',
      site: 'Paris - Siège Social',
      probation_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      probation_evaluation_completed: false,
      status: 'active',
      contracts: [
        {
          id: 'contract-001',
          manager_id: 'manager-001',
          manager: {
            id: 'manager-001',
            first_name: 'Sophie',
            last_name: 'Martin',
            email: 'sophie.martin@kilani.com',
            role: 'Manager'
          }
        }
      ]
    },
    {
      id: 'emp-002',
      first_name: 'Marie',
      last_name: 'Laurent',
      position: 'Chef de projet',
      department: 'Direction IT',
      site: 'Lyon',
      probation_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      probation_evaluation_completed: false,
      status: 'active',
      contracts: [
        {
          id: 'contract-002',
          manager_id: 'manager-001',
          manager: {
            id: 'manager-001',
            first_name: 'Sophie',
            last_name: 'Martin',
            email: 'sophie.martin@kilani.com',
            role: 'Manager'
          }
        }
      ]
    },
    {
      id: 'emp-003',
      first_name: 'Thomas',
      last_name: 'Bernard',
      position: 'Commercial B2B',
      department: 'Direction Commerciale',
      site: 'Marseille',
      probation_end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      probation_evaluation_completed: false,
      status: 'active',
      contracts: [
        {
          id: 'contract-003',
          manager_id: 'manager-002',
          manager: {
            id: 'manager-002',
            first_name: 'Pierre',
            last_name: 'Durand',
            email: 'pierre.durand@kilani.com',
            role: 'Manager'
          }
        }
      ]
    },
    {
      id: 'emp-004',
      first_name: 'Julie',
      last_name: 'Petit',
      position: 'Assistante RH',
      department: 'Ressources Humaines',
      site: 'Paris - Siège Social',
      probation_end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      probation_evaluation_completed: false,
      status: 'active',
      contracts: [
        {
          id: 'contract-004',
          manager_id: 'manager-003',
          manager: {
            id: 'manager-003',
            first_name: 'Isabelle',
            last_name: 'Moreau',
            email: 'isabelle.moreau@kilani.com',
            role: 'Manager'
          }
        }
      ]
    }
  ];

  const mockContracts = [
    {
      id: 'contract-001',
      employee_id: 'emp-001',
      manager_id: 'manager-001',
      status: 'active',
      end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      employee: mockEmployees[0],
      manager: {
        id: 'manager-001',
        first_name: 'Sophie',
        last_name: 'Martin',
        email: 'sophie.martin@kilani.com',
        role: 'Manager'
      }
    },
    {
      id: 'contract-002',
      employee_id: 'emp-002',
      manager_id: 'manager-001',
      status: 'active',
      end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      employee: mockEmployees[1],
      manager: {
        id: 'manager-001',
        first_name: 'Sophie',
        last_name: 'Martin',
        email: 'sophie.martin@kilani.com',
        role: 'Manager'
      }
    },
    {
      id: 'contract-003',
      employee_id: 'emp-003',
      manager_id: 'manager-002',
      status: 'active',
      end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      employee: mockEmployees[2],
      manager: {
        id: 'manager-002',
        first_name: 'Pierre',
        last_name: 'Durand',
        email: 'pierre.durand@kilani.com',
        role: 'Manager'
      }
    }
  ];

  const mockEvaluations = [
    {
      id: 'eval-001',
      employee_id: 'emp-001',
      manager_id: 'manager-001',
      n2_manager_id: 'n2-001',
      evaluation_type: 'probation',
      status: 'pending_n1',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      last_status_change: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      department: 'Direction IT',
      job_title: 'Développeur Full Stack',
      final_score: null,
      comments: [
        {
          author: 'manager-001',
          author_name: 'Sophie Martin',
          content: 'Évaluation en attente de validation N+1',
          action: 'create',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'eval-002',
      employee_id: 'emp-002',
      manager_id: 'manager-001',
      n2_manager_id: 'n2-001',
      evaluation_type: 'probation',
      status: 'pending_n2',
      due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      last_status_change: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      department: 'Direction IT',
      job_title: 'Chef de projet',
      final_score: null,
      comments: [
        {
          author: 'manager-001',
          author_name: 'Sophie Martin',
          content: 'Validé N+1, en attente N+2',
          action: 'validate',
          level: 'N+1',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'eval-003',
      employee_id: 'emp-003',
      manager_id: 'manager-002',
      n2_manager_id: 'n2-002',
      evaluation_type: 'probation',
      status: 'completed',
      due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      last_status_change: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      validated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      validated_by: 'n2-002',
      department: 'Direction Commerciale',
      job_title: 'Commercial B2B',
      final_score: 4.2,
      comments: [
        {
          author: 'manager-002',
          author_name: 'Pierre Durand',
          content: 'Validation N+1',
          action: 'validate',
          level: 'N+1',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          author: 'n2-002',
          author_name: 'Marc Dubois',
          content: 'Validation finale',
          action: 'validate',
          level: 'N+2',
          timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'eval-004',
      employee_id: 'emp-004',
      manager_id: 'manager-003',
      n2_manager_id: 'n2-003',
      evaluation_type: 'annual',
      status: 'draft',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      last_status_change: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      department: 'Ressources Humaines',
      job_title: 'Assistante RH',
      final_score: null,
      comments: []
    },
    {
      id: 'eval-005',
      employee_id: 'emp-001',
      manager_id: 'manager-001',
      n2_manager_id: 'n2-001',
      evaluation_type: 'contract_end',
      status: 'pending_drh',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      last_status_change: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      department: 'Direction IT',
      job_title: 'Développeur Full Stack',
      final_score: null,
      comments: [
        {
          author: 'manager-001',
          author_name: 'Sophie Martin',
          content: 'Validé N+1',
          action: 'validate',
          level: 'N+1',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          author: 'n2-001',
          author_name: 'Claire Lefebvre',
          content: 'Validé N+2, transmission DRH',
          action: 'validate',
          level: 'N+2',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  ];

  const mockNotifications = [
    {
      id: 'notif-001',
      type: 'contract_reminder_30d',
      contract_id: 'contract-001',
      recipient_id: 'manager-001',
      recipient_email: 'sophie.martin@kilani.com',
      sent_at: new Date().toISOString(),
      status: 'sent',
      data: {
        employee_name: 'Jean Dupont',
        contract_end_date: mockContracts[0].end_date,
        days_remaining: 20
      }
    },
    {
      id: 'notif-002',
      type: 'contract_reminder_30d',
      contract_id: 'contract-002',
      recipient_id: 'manager-001',
      recipient_email: 'sophie.martin@kilani.com',
      sent_at: new Date().toISOString(),
      status: 'sent',
      data: {
        employee_name: 'Marie Laurent',
        contract_end_date: mockContracts[1].end_date,
        days_remaining: 10
      }
    },
    {
      id: 'notif-003',
      type: 'probation_reminder_30d',
      employee_id: 'emp-001',
      recipient_id: 'manager-001',
      recipient_email: 'sophie.martin@kilani.com',
      sent_at: new Date().toISOString(),
      status: 'sent',
      data: {
        employee_name: 'Jean Dupont',
        probation_end_date: mockEmployees[0].probation_end_date,
        days_remaining: 15
      }
    },
    {
      id: 'notif-004',
      type: 'probation_reminder_30d',
      employee_id: 'emp-002',
      recipient_id: 'manager-001',
      recipient_email: 'sophie.martin@kilani.com',
      sent_at: new Date().toISOString(),
      status: 'sent',
      data: {
        employee_name: 'Marie Laurent',
        probation_end_date: mockEmployees[1].probation_end_date,
        days_remaining: 5
      }
    },
    {
      id: 'notif-005',
      type: 'evaluation_reminder_48h',
      evaluation_id: 'eval-002',
      recipient_id: 'n2-001',
      recipient_email: 'claire.lefebvre@kilani.com',
      sent_at: new Date().toISOString(),
      status: 'sent'
    }
  ];

  useEffect(() => {
    if (testMode) {
      // Mode test - utiliser les mocks
      loadMockData();
    } else {
      // Mode production - récupérer de la base de données
      fetchStats();
      checkContractDeadlines();
      checkProbationPeriods();
    }
    
    // Vérifier toutes les 24h pour les notifications automatiques
    const interval = setInterval(() => {
      if (!testMode) {
        checkContractDeadlines();
        checkProbationPeriods();
      }
    }, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [timeRange, testMode]);

  // Charger les données mockées
  const loadMockData = () => {
    setLoading(true);
    
    // Statistiques mockées
    const mockStats = {
      draft: mockEvaluations.filter(e => e.status === 'draft').length,
      pending: mockEvaluations.filter(e => e.status === 'pending_n1').length,
      inProgress: mockEvaluations.filter(e => 
        ['pending_n1', 'pending_n2', 'pending_drh', 'pending_daf', 'pending_dga'].includes(e.status)
      ).length,
      completed: mockEvaluations.filter(e => e.status === 'completed').length,
      overdue: mockEvaluations.filter(e => {
        const dueDate = new Date(e.due_date);
        return !['completed', 'cancelled'].includes(e.status) && dueDate < new Date();
      }).length,
      total: mockEvaluations.length,
      closureRate: Math.round((mockEvaluations.filter(e => e.status === 'completed').length / mockEvaluations.length) * 100),
      pendingN2Validation: mockEvaluations.filter(e => e.status === 'pending_n2').length,
      probationPending: mockEmployees.filter(e => !e.probation_evaluation_completed && new Date(e.probation_end_date) > new Date()).length,
      probationCompleted: mockEvaluations.filter(e => e.evaluation_type === 'probation' && e.status === 'completed').length,
    };
    
    setStats(mockStats);
    setContractNotifications(mockNotifications.filter(n => n.type === 'contract_reminder_30d'));
    setProbationEmployees(mockEmployees.filter(e => !e.probation_evaluation_completed));
    
    setLoading(false);
  };

  // Fonction pour basculer entre mode test et production
  const toggleTestMode = () => {
    setTestMode(!testMode);
    if (!testMode) {
      loadMockData();
    } else {
      fetchStats();
      checkContractDeadlines();
      checkProbationPeriods();
    }
    toast.success(`Mode ${!testMode ? 'test' : 'production'} activé`, {
      duration: 2000,
      position: 'top-right',
    });
  };

  // Fonction pour vérifier les échéances de contrat à J-30
  const checkContractDeadlines = async () => {
    if (testMode) {
      // En mode test, utiliser les mocks
      const notificationsToSend = mockContracts.filter(contract => {
        const endDate = new Date(contract.end_date);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return daysRemaining <= 30 && daysRemaining > 0;
      });
      setContractNotifications(notificationsToSend);
      return;
    }

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
    if (testMode) {
      console.log('Mode test - Notification contrat simulée:', contract.id);
      return;
    }

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

      console.log(`Notification envoyée pour le contrat ${contract.id}`);
    } catch (error) {
      console.error('Erreur envoi notification:', error);
    }
  };

  // Fonction pour vérifier les périodes d'essai
  const checkProbationPeriods = async () => {
    if (testMode) {
      // En mode test, utiliser les mocks
      setProbationEmployees(mockEmployees.filter(e => !e.probation_evaluation_completed));
      return;
    }

    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Récupérer les employés avec des périodes d'essai actives
      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          *,
          contracts:employee_contracts(
            *,
            manager:profiles(*)
          )
        `)
        .eq('status', 'active')
        .lte('probation_end_date', thirtyDaysFromNow.toISOString())
        .gte('probation_end_date', today.toISOString());

      if (error) throw error;

      // Filtrer pour ne garder que ceux avec période d'essai
      const employeesWithProbation = employees.filter(emp => 
        emp.probation_end_date && 
        !emp.probation_evaluation_completed
      );

      setProbationEmployees(employeesWithProbation);

      // Vérifier les notifications pour périodes d'essai
      for (const employee of employeesWithProbation) {
        await checkProbationNotification(employee);
      }
    } catch (error) {
      console.error('Erreur vérification périodes d\'essai:', error);
    }
  };

  // Fonction pour vérifier/envoyer notification période d'essai
  const checkProbationNotification = async (employee) => {
    if (testMode) {
      console.log('Mode test - Notification période d\'essai simulée:', employee.id);
      return;
    }

    try {
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('type', 'probation_reminder_30d')
        .single();

      if (!existingNotification && employee.contracts?.[0]?.manager?.email) {
        // Enregistrer la notification
        await supabase
          .from('notifications')
          .insert({
            type: 'probation_reminder_30d',
            employee_id: employee.id,
            recipient_id: employee.contracts[0].manager_id,
            recipient_email: employee.contracts[0].manager.email,
            sent_at: new Date().toISOString(),
            status: 'sent',
            data: {
              employee_name: `${employee.first_name} ${employee.last_name}`,
              probation_end_date: employee.probation_end_date,
              days_remaining: Math.ceil((new Date(employee.probation_end_date) - new Date()) / (1000 * 60 * 60 * 24))
            }
          });

        console.log(`Notification période d'essai envoyée pour ${employee.first_name} ${employee.last_name}`);
      }
    } catch (error) {
      console.error('Erreur envoi notification période d\'essai:', error);
    }
  };

  // Fonction pour vérifier les délais de traitement (48h)
  const checkProcessingDeadlines = async () => {
    if (testMode) {
      // En mode test, utiliser les mocks
      const overdueEvaluations = mockEvaluations.filter(e => {
        const lastChange = new Date(e.last_status_change);
        const now = new Date();
        const hoursDiff = (now - lastChange) / (1000 * 60 * 60);
        return ['pending_n1', 'pending_n2'].includes(e.status) && hoursDiff > 48;
      });
      
      toast.success(`${overdueEvaluations.length} évaluation(s) en retard de traitement (mode test)`, {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

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

      toast.success(`${overdueEvaluations.length} rappel(s) envoyé(s)`);
    } catch (error) {
      console.error('Erreur vérification délais:', error);
    }
  };

  // Fonction pour envoyer un rappel
  const sendReminderNotification = async (evaluation) => {
    if (testMode) {
      console.log('Mode test - Rappel simulé pour évaluation:', evaluation.id);
      return;
    }

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

      console.log(`Rappel envoyé à ${recipient.email} pour l'évaluation ${evaluation.id}`);
    }
  };

  const fetchStats = async () => {
    if (testMode) {
      loadMockData();
      return;
    }

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

      // Récupérer les employés avec période d'essai en cours
      const { data: probationEmployees, error: probationError } = await supabase
        .from('employees')
        .select('*')
        .eq('probation_evaluation_completed', false)
        .not('probation_end_date', 'is', null);

      if (probationError) throw probationError;

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
        probationPending: probationEmployees?.length || 0,
        probationCompleted: evaluations.filter(e => e.evaluation_type === 'probation' && e.status === 'completed').length,
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
    if (testMode) {
      // Mode test - simuler l'action
      toast.success(`Action "${action}" simulée avec succès (mode test)`, {
        duration: 2000,
        position: 'top-right',
      });
      
      // Mettre à jour les stats mockées
      loadMockData();
      return;
    }

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

  // Fonction d'export
  const handleExport = async () => {
    if (testMode) {
      // Mode test - exporter les mocks
      const dataToExport = mockEvaluations;
      
      // Créer le CSV avec les données mockées
      const csvData = "data:text/csv;charset=utf-8," 
        + ["ID,Employé,Type,Date d'échéance,Statut,Score"].join(",") + "\n"
        + dataToExport.map(e => 
          `${e.id},"${e.job_title}","${e.evaluation_type}",${new Date(e.due_date).toLocaleDateString('fr-FR')},${e.status},${e.final_score || 'N/A'}`
        ).join("\n");

      const encodedUri = encodeURI(csvData);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `evaluations_test_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export test CSV généré avec succès');
      return;
    }

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

  // Fonction pour gérer le clic sur un employé
  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeSelector(false);
    
    if (testMode) {
      // Mode test - utiliser les contrats mockés
      const mockContract = mockContracts.find(c => c.employee_id === employee.id);
      setSelectedEmployeeContract(mockContract || null);
      setShowProbationForm(true);
      return;
    }
    
    // Récupérer les informations contractuelles
    const { data: contract } = await supabase
      .from('employee_contracts')
      .select(`
        *,
        manager:profiles(*)
      `)
      .eq('employee_id', employee.id)
      .eq('status', 'active')
      .single();

    setSelectedEmployeeContract(contract);
    setShowProbationForm(true);
  };

  // Fonction pour ouvrir le sélecteur d'employés
  const handleOpenProbationForm = () => {
    setShowEmployeeSelector(true);
  };

  // Fonction pour sauvegarder l'évaluation de période d'essai
  const handleSaveProbationEvaluation = async (evaluationData) => {
    if (testMode) {
      // Mode test - simuler la sauvegarde
      console.log('Mode test - Évaluation période d\'essai simulée:', evaluationData);
      toast.success('Évaluation de période d\'essai simulée avec succès (mode test)');
      setShowProbationForm(false);
      setSelectedEmployee(null);
      setSelectedEmployeeContract(null);
      loadMockData();
      return;
    }

    try {
      // Créer l'évaluation de période d'essai
      const { data: evaluation, error } = await supabase
        .from('evaluations')
        .insert({
          employee_id: selectedEmployee.id,
          manager_id: selectedEmployeeContract?.manager_id || profile.id,
          evaluation_type: 'probation',
          status: 'draft',
          due_date: selectedEmployee.probation_end_date,
          created_at: new Date().toISOString(),
          created_by: profile.id,
          department: selectedEmployee.department,
          job_title: selectedEmployee.position,
          probation_data: evaluationData,
          comments: [{
            author: profile.id,
            author_name: `${profile.first_name} ${profile.last_name}`,
            content: 'Création évaluation période d\'essai',
            action: 'create',
            timestamp: new Date().toISOString()
          }]
        })
        .select()
        .single();

      if (error) throw error;

      // Marquer l'employé comme ayant eu son évaluation de période d'essai
      await supabase
        .from('employees')
        .update({ 
          probation_evaluation_completed: true,
          probation_evaluation_id: evaluation.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmployee.id);

      toast.success('Évaluation de période d\'essai créée avec succès');
      setShowProbationForm(false);
      setSelectedEmployee(null);
      setSelectedEmployeeContract(null);
      fetchStats();
    } catch (error) {
      console.error('Erreur création évaluation période d\'essai:', error);
      toast.error('Erreur lors de la création de l\'évaluation');
    }
  };

  // Fonction pour extraire les données contractuelles
  const extractEmployeeContractData = async (employeeId) => {
    if (testMode) {
      // Mode test - retourner un contrat mocké
      return mockContracts.find(c => c.employee_id === employeeId) || null;
    }

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

  const canCreateEvaluation = () => {
    return profile?.role && ['Manager', 'Director', 'DRH', 'HR', 'Payroll'].includes(profile.role);
  };

  return (
    <div className="space-y-8">
      {/* Bannière Mode Test */}
      {testMode && (
        <div className="p-4 border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Mode Test Activé</h4>
                <p className="text-sm text-amber-700">
                  Données de démonstration affichées ({mockEvaluations.length} évaluations, {mockEmployees.length} employés, {mockNotifications.length} notifications)
                </p>
              </div>
            </div>
            <button
              onClick={toggleTestMode}
              className="px-4 py-2 text-sm font-medium bg-white border rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Mode Production
            </button>
          </div>
        </div>
      )}

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
                  {stats.probationPending > 0 && (
                    <span className="px-2 py-1 ml-2 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                      {stats.probationPending} période(s) d'essai J-30
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {!testMode && (
              <button
                onClick={toggleTestMode}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 font-medium rounded-lg hover:from-amber-200 hover:to-orange-200 transition-all flex items-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Mode Test</span>
              </button>
            )}

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

            {/* Nouveau bouton pour évaluation période d'essai */}
            <button
              onClick={handleOpenProbationForm}
              className="px-4 py-2.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-medium rounded-lg hover:from-green-200 hover:to-emerald-200 transition-all flex items-center space-x-2"
            >
              <GraduationCap className="w-5 h-5" />
              <span>Période d'essai</span>
              {stats.probationPending > 0 && (
                <span className="px-2 py-0.5 text-xs bg-green-200 text-green-800 rounded-full">
                  {stats.probationPending}
                </span>
              )}
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

        <div className="p-5 transition-shadow border border-green-200 shadow-sm bg-gradient-to-br from-white to-green-50 rounded-xl hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
              Période essai
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.probationPending}</p>
          <p className="mt-1 text-sm text-slate-600">À évaluer</p>
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
          <p className="text-3xl font-bold text-slate-900">{contractNotifications.length + probationEmployees.length}</p>
          <p className="mt-1 text-sm text-slate-600">Notifications</p>
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
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="mb-1 text-xs text-slate-500">En cours</p>
                <p className="text-lg font-bold text-slate-900">{stats.inProgress}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50">
                <p className="mb-1 text-xs text-emerald-500">Terminées</p>
                <p className="text-lg font-bold text-emerald-900">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <p className="mb-1 text-xs text-green-500">Période essai</p>
                <p className="text-lg font-bold text-green-900">{stats.probationCompleted}</p>
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
                <GraduationCap className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-amber-900">Périodes d'essai J-30</p>
                  <p className="text-xs text-amber-700">À évaluer prochainement</p>
                </div>
              </div>
              <span className="px-2 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                {probationEmployees.length}
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

      {/* Liste des périodes d'essai à évaluer */}
      {probationEmployees.length > 0 && (
        <div className="overflow-hidden bg-white border border-green-200 shadow-sm rounded-2xl">
          <div className="border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Périodes d'essai à évaluer</h3>
                    <p className="text-sm text-green-700">
                      {probationEmployees.length} employé(s) avec période d'essai se terminant dans les 30 jours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {probationEmployees.map((employee) => {
                const daysRemaining = Math.ceil((new Date(employee.probation_end_date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={employee.id}
                    onClick={() => handleEmployeeSelect(employee)}
                    className="p-4 transition-all border rounded-lg cursor-pointer border-slate-200 hover:shadow-md hover:border-green-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100">
                          <UserPlus className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 group-hover:text-green-700">
                            {employee.first_name} {employee.last_name}
                          </h4>
                          <p className="text-sm text-slate-600">{employee.position}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        daysRemaining <= 7 
                          ? 'bg-red-100 text-red-800'
                          : daysRemaining <= 15
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        J-{daysRemaining}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Fin période d'essai</span>
                        <span className="font-medium text-slate-900">
                          {new Date(employee.probation_end_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="w-full h-1.5 rounded-full bg-slate-100">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            daysRemaining <= 7 
                              ? 'bg-red-500'
                              : daysRemaining <= 15
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.max(0, 100 - (daysRemaining / 30 * 100))}%` }}
                        />
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmployeeSelect(employee);
                        }}
                        className="flex items-center justify-center w-full px-3 py-2 mt-2 space-x-2 text-sm font-medium text-green-700 transition-colors rounded-lg bg-green-50 hover:bg-green-100"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Évaluer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                    {testMode ? '(Mode test) ' : ''}{stats.total} évaluations • {stats.closureRate}% taux de clôture • {stats.overdue} en retard
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
              testMode={testMode}
              mockEvaluations={testMode ? mockEvaluations : undefined}
            />
          )}
        </div>
      </div>

      {/* Modal de sélection d'employé */}
      {showEmployeeSelector && (
        <EmployeeSelector
          onClose={() => setShowEmployeeSelector(false)}
          onSelect={handleEmployeeSelect}
          filterType="probation"
          title="Sélectionner un employé pour l'évaluation de période d'essai"
          testMode={testMode}
          mockEmployees={testMode ? mockEmployees : undefined}
        />
      )}

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
          testMode={testMode}
          mockEmployees={testMode ? mockEmployees : undefined}
        />
      )}

      {/* Modal d'évaluation de période d'essai */}
      {showProbationForm && selectedEmployee && (
        <ProbationEvaluationForm
          employee={selectedEmployee}
          contract={selectedEmployeeContract}
          onClose={() => {
            setShowProbationForm(false);
            setSelectedEmployee(null);
            setSelectedEmployeeContract(null);
          }}
          onSave={handleSaveProbationEvaluation}
          testMode={testMode}
        />
      )}
    </div>
  );
}