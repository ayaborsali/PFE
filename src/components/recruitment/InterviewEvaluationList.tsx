// InterviewEvaluationList.tsx - Liste des entretiens et évaluation des candidats

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  // Icônes de base
  Briefcase, X, Save, Send, AlertCircle, CheckCircle, Clock,
  User, Calendar, Star, TrendingUp, MessageSquare, Award, 
  Target, ThumbsUp, ThumbsDown, AlertTriangle, FileText, 
  Users, GraduationCap, ChevronRight, ChevronLeft, Filter, 
  Download, Mail, Phone, MapPin, Building, UserCheck,
  Edit, Trash2, Eye, Plus, Search, RefreshCw,
  
  // Icônes supplémentaires manquantes
  CalendarDays, HelpCircle, XCircle, UserX, Video, 
  ExternalLink, Brain, BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Types
interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  current_position: string;
  experience_years: number;
  skills: string[];
  education: string;
  languages: string[];
  match_score: number;
  ai_analysis?: {
    cultural_fit?: number;
    growth_potential?: number;
    technical_depth?: number;
    recommendations?: string[];
  };
  tags?: string[];
  cv_file_url?: string;
  avatar_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

interface Interview {
  id: string;
  candidate_id: string;
  candidate?: Candidate;
  job_title: string;
  job_id?: string;
  interview_date: string;
  interview_time: string;
  interview_type: 'video' | 'phone' | 'in_person';
  interviewers: Interviewer[];
  duration: number;
  location?: string;
  meeting_link?: string;
  meeting_password?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  evaluation?: InterviewEvaluation;
  created_at: string;
  updated_at?: string;
  notes?: string;
  send_invitation: boolean;
  reminder_emails: boolean;
  reminder_sent?: boolean;
  feedback_provided?: boolean;
  feedback_deadline?: string;
}

interface Interviewer {
  email: string;
  name: string;
  role?: string;
  avatar?: string;
  confirmed?: boolean;
}

interface InterviewEvaluation {
  id: string;
  interview_id: string;
  technical_skills: number; // 1-5
  communication: number; // 1-5
  problem_solving: number; // 1-5
  cultural_fit: number; // 1-5
  leadership: number; // 1-5
  motivation: number; // 1-5
  team_collaboration: number; // 1-5
  adaptability: number; // 1-5
  strengths: string[];
  weaknesses: string[];
  observations: string;
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  next_steps: string[];
  salary_discussion?: number;
  salary_currency?: 'EUR' | 'USD' | 'GBP' | 'CHF' | 'TND';
  availability?: string;
  notice_period?: string;
  additional_notes?: string;
  evaluated_by: string;
  evaluated_by_name?: string;
  evaluated_at: string;
  attachments?: string[];
  rating?: number;
}

interface EvaluationFormData {
  candidate_id: string;
  candidate_name: string;
  interview_id: string;
  job_title: string;
  
  // Scores
  technical_skills: number;
  communication: number;
  problem_solving: number;
  cultural_fit: number;
  leadership: number;
  motivation: number;
  team_collaboration: number;
  adaptability: number;
  
  // Évaluations qualitatives
  strengths: string[];
  weaknesses: string[];
  observations: string;
  
  // Recommandation
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  next_steps: string[];
  
  // Détails supplémentaires
  salary_discussion?: number;
  salary_currency: 'EUR' | 'USD' | 'GBP' | 'CHF' | 'TND';
  availability?: string;
  notice_period?: string;
  additional_notes: string;
}

interface InterviewStats {
  scheduled: number;
  completed: number;
  cancelled: number;
  no_show: number;
  total: number;
  averageScore: number;
  averageTechnicalScore: number;
  averageSoftSkillsScore: number;
  acceptanceRate: number;
  upcomingThisWeek: number;
  completionRate: number;
}

export default function InterviewEvaluationList({ searchTerm: externalSearchTerm }: { searchTerm?: string }) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormData>({
    candidate_id: '',
    candidate_name: '',
    interview_id: '',
    job_title: '',
    technical_skills: 3,
    communication: 3,
    problem_solving: 3,
    cultural_fit: 3,
    leadership: 3,
    motivation: 3,
    team_collaboration: 3,
    adaptability: 3,
    strengths: [''],
    weaknesses: [''],
    observations: '',
    recommendation: 'maybe',
    next_steps: [''],
    salary_currency: 'EUR',
    additional_notes: ''
  });

  // Statistiques
  const [stats, setStats] = useState<InterviewStats>({
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    total: 0,
    averageScore: 0,
    averageTechnicalScore: 0,
    averageSoftSkillsScore: 0,
    acceptanceRate: 0,
    upcomingThisWeek: 0,
    completionRate: 0
  });

  // Options
  const statusOptions = [
    { value: 'all', label: 'Tous les statuts', icon: Calendar },
    { value: 'scheduled', label: 'Planifiés', icon: CalendarDays, color: 'blue' },
    { value: 'completed', label: 'Terminés', icon: CheckCircle, color: 'emerald' },
    { value: 'cancelled', label: 'Annulés', icon: XCircle, color: 'red' },
    { value: 'rescheduled', label: 'Reportés', icon: RefreshCw, color: 'amber' },
    { value: 'no_show', label: 'Absence', icon: UserX, color: 'rose' }
  ];

  const typeOptions = [
    { value: 'all', label: 'Tous types' },
    { value: 'video', label: 'Visioconférence', icon: Video },
    { value: 'phone', label: 'Téléphonique', icon: Phone },
    { value: 'in_person', label: 'Présentiel', icon: MapPin }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'score', label: 'Score IA' },
    { value: 'name', label: 'Nom' },
    { value: 'status', label: 'Statut' },
    { value: 'type', label: 'Type' }
  ];

  const currencyOptions = [
    { value: 'EUR', label: '€', symbol: '€' },
    { value: 'USD', label: '$', symbol: '$' },
    { value: 'GBP', label: '£', symbol: '£' },
    { value: 'CHF', label: 'CHF', symbol: 'CHF' },
    { value: 'TND', label: 'DT', symbol: 'DT' }
  ];

  useEffect(() => {
    fetchInterviews();
  }, []);

  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  useEffect(() => {
    filterInterviews();
    calculateStats();
  }, [interviews, searchTerm, statusFilter, typeFilter, dateRange, sortBy, sortOrder]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Données enrichies
      const demoInterviews: Interview[] = [
        {
          id: 'int-001',
          candidate_id: 'demo-001',
          candidate: {
            id: 'demo-001',
            first_name: 'Marie',
            last_name: 'Dubois',
            email: 'marie.dubois@email.com',
            phone: '+33 6 12 34 56 78',
            location: 'Paris',
            current_position: 'Développeuse Full Stack Senior',
            experience_years: 8,
            skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'GraphQL', 'PostgreSQL'],
            education: 'Master Informatique - Polytechnique',
            languages: ['Français', 'Anglais (C1)', 'Espagnol (B2)'],
            match_score: 92,
            tags: ['React Expert', 'Senior', 'Full Stack', 'Cloud'],
            linkedin_url: 'https://linkedin.com/in/marie-dubois'
          },
          job_title: 'Développeur Full Stack Senior',
          interview_date: '2026-03-15',
          interview_time: '14:00',
          interview_type: 'video',
          interviewers: [
            { email: 'jean.dupont@company.com', name: 'Jean Dupont', role: 'CTO', confirmed: true },
            { email: 'sophie.martin@company.com', name: 'Sophie Martin', role: 'Lead Dev', confirmed: true }
          ],
          duration: 60,
          meeting_link: 'https://meet.google.com/abc-defg-hij',
          meeting_password: '123456',
          status: 'scheduled',
          created_at: new Date().toISOString(),
          send_invitation: true,
          reminder_emails: true,
          reminder_sent: false
        },
        {
          id: 'int-002',
          candidate_id: 'demo-002',
          candidate: {
            id: 'demo-002',
            first_name: 'Thomas',
            last_name: 'Martin',
            email: 'thomas.martin@email.com',
            phone: '+33 6 23 45 67 89',
            location: 'Lyon',
            current_position: 'Data Scientist Lead',
            experience_years: 5,
            skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'PyTorch', 'Pandas'],
            education: 'Diplôme Ingénieur - Mines ParisTech',
            languages: ['Français', 'Anglais (C2)'],
            match_score: 85,
            tags: ['Python', 'Machine Learning', 'Data Science', 'AI']
          },
          job_title: 'Data Scientist Senior',
          interview_date: '2026-03-16',
          interview_time: '10:30',
          interview_type: 'phone',
          interviewers: [
            { email: 'pierre.lefevre@company.com', name: 'Pierre Lefèvre', role: 'Data Director', confirmed: true }
          ],
          duration: 45,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          send_invitation: true,
          reminder_emails: true
        },
        {
          id: 'int-003',
          candidate_id: 'demo-003',
          candidate: {
            id: 'demo-003',
            first_name: 'Sophie',
            last_name: 'Bernard',
            email: 'sophie.bernard@email.com',
            phone: '+33 6 34 56 78 90',
            location: 'Bordeaux',
            current_position: 'Chef de Projet IT Senior',
            experience_years: 10,
            skills: ['Agile', 'Scrum', 'JIRA', 'Gestion de projet', 'Prince2', 'SAFe', 'Confluence'],
            education: 'MBA Management - HEC Paris',
            languages: ['Français', 'Anglais (C1)', 'Espagnol (C1)'],
            match_score: 78,
            tags: ['Agile', 'Senior', 'Management', 'PMP']
          },
          job_title: 'Chef de Projet IT',
          interview_date: '2026-03-14',
          interview_time: '09:00',
          interview_type: 'in_person',
          interviewers: [
            { email: 'marie.legrand@company.com', name: 'Marie Legrand', role: 'Directrice Projets', confirmed: true },
            { email: 'luc.rousseau@company.com', name: 'Luc Rousseau', role: 'Product Owner', confirmed: true }
          ],
          duration: 90,
          location: 'Bureau Lyon - Salle A',
          status: 'completed',
          evaluation: {
            id: 'eval-001',
            interview_id: 'int-003',
            technical_skills: 4,
            communication: 5,
            problem_solving: 4,
            cultural_fit: 5,
            leadership: 4,
            motivation: 5,
            team_collaboration: 5,
            adaptability: 4,
            strengths: ['Excellente communication', 'Vision stratégique', 'Leadership naturel', 'Expérience variée'],
            weaknesses: ['Technique moins approfondie'],
            observations: 'Très bon profil, correspond bien aux besoins de l\'équipe. Bonne adéquation culturelle.',
            recommendation: 'yes',
            next_steps: ['Deuxième entretien avec DG', 'Test technique optionnel', 'Rencontre équipe'],
            salary_discussion: 82000,
            salary_currency: 'EUR',
            availability: '1 mois',
            notice_period: '1 mois',
            evaluated_by: 'user-001',
            evaluated_by_name: 'Jeanne Moreau',
            evaluated_at: new Date().toISOString(),
            rating: 4.5
          },
          created_at: new Date().toISOString(),
          send_invitation: true,
          reminder_emails: true,
          feedback_provided: true
        },
        {
          id: 'int-004',
          candidate_id: 'demo-005',
          candidate: {
            id: 'demo-005',
            first_name: 'Camille',
            last_name: 'Leroy',
            email: 'camille.leroy@email.com',
            phone: '+33 6 56 78 90 12',
            location: 'Nantes',
            current_position: 'DevOps Engineer',
            experience_years: 6,
            skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Jenkins', 'Ansible', 'Prometheus'],
            education: 'Master Cloud Computing - Centrale Nantes',
            languages: ['Français', 'Anglais (C1)', 'Allemand (B1)'],
            match_score: 88,
            tags: ['DevOps', 'Cloud AWS', 'Senior', 'Kubernetes']
          },
          job_title: 'DevOps Engineer',
          interview_date: '2026-03-17',
          interview_time: '11:00',
          interview_type: 'video',
          interviewers: [
            { email: 'thomas.dubois@company.com', name: 'Thomas Dubois', role: 'Lead DevOps', confirmed: true },
            { email: 'emilie.renaud@company.com', name: 'Emilie Renaud', role: 'Cloud Architect', confirmed: false }
          ],
          duration: 60,
          meeting_link: 'https://teams.microsoft.com/l/meetup-join/...',
          status: 'scheduled',
          created_at: new Date().toISOString(),
          send_invitation: true,
          reminder_emails: true
        },
        {
          id: 'int-005',
          candidate_id: 'demo-004',
          candidate: {
            id: 'demo-004',
            first_name: 'Jean',
            last_name: 'Petit',
            email: 'jean.petit@email.com',
            phone: '+33 6 45 67 89 01',
            location: 'Marseille',
            current_position: 'Développeur Frontend Junior',
            experience_years: 1,
            skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'Redux'],
            education: 'Licence Informatique - Université Aix-Marseille',
            languages: ['Français', 'Anglais (B2)'],
            match_score: 45,
            tags: ['React', 'Junior', 'Frontend']
          },
          job_title: 'Développeur Frontend Junior',
          interview_date: '2026-03-13',
          interview_time: '15:30',
          interview_type: 'video',
          interviewers: [
            { email: 'sophie.leclerc@company.com', name: 'Sophie Leclerc', role: 'Frontend Lead', confirmed: true }
          ],
          duration: 45,
          meeting_link: 'https://meet.google.com/xyz-abcd-efg',
          status: 'completed',
          evaluation: {
            id: 'eval-002',
            interview_id: 'int-005',
            technical_skills: 3,
            communication: 4,
            problem_solving: 3,
            cultural_fit: 4,
            leadership: 2,
            motivation: 5,
            team_collaboration: 4,
            adaptability: 4,
            strengths: ['Motivé', 'Apprentissage rapide', 'Bonnes bases React', 'Curieux'],
            weaknesses: ['Manque d\'expérience', 'Connaissances limitées en architecture', 'Pas de tests'],
            observations: 'Bon potentiel mais nécessite formation et accompagnement. À considérer pour un poste junior avec mentorat.',
            recommendation: 'maybe',
            next_steps: ['Test technique à réaliser', 'Rencontrer l\'équipe', 'Formation à prévoir'],
            salary_discussion: 35000,
            salary_currency: 'EUR',
            availability: 'Immédiate',
            notice_period: '2 semaines',
            evaluated_by: 'user-002',
            evaluated_by_name: 'Sophie Leclerc',
            evaluated_at: new Date().toISOString(),
            rating: 3.5
          },
          created_at: new Date().toISOString(),
          send_invitation: true,
          reminder_emails: true,
          feedback_provided: true
        },
        {
          id: 'int-006',
          candidate_id: 'demo-006',
          candidate: {
            id: 'demo-006',
            first_name: 'Lucas',
            last_name: 'Moreau',
            email: 'lucas.moreau@email.com',
            phone: '+33 6 67 89 01 23',
            location: 'Remote',
            current_position: 'Software Architect',
            experience_years: 12,
            skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'Redis', 'PostgreSQL', 'Kubernetes', 'System Design'],
            education: 'PhD Informatique - Université Paris-Saclay',
            languages: ['Français', 'Anglais (C2)', 'Chinois (HSK4)'],
            match_score: 95,
            tags: ['Senior', 'Architect', 'Java', 'Microservices', 'Scale-up']
          },
          job_title: 'Software Architect',
          interview_date: '2026-03-10',
          interview_time: '14:00',
          interview_type: 'video',
          interviewers: [
            { email: 'michel.durand@company.com', name: 'Michel Durand', role: 'CTO', confirmed: true },
            { email: 'claire.fontaine@company.com', name: 'Claire Fontaine', role: 'Lead Architect', confirmed: true }
          ],
          duration: 120,
          meeting_link: 'https://meet.google.com/lmn-opqr-stu',
          status: 'completed',
          evaluation: {
            id: 'eval-003',
            interview_id: 'int-006',
            technical_skills: 5,
            communication: 5,
            problem_solving: 5,
            cultural_fit: 5,
            leadership: 5,
            motivation: 5,
            team_collaboration: 5,
            adaptability: 5,
            strengths: ['Expert technique', 'Vision architecturale', 'Leadership', 'Mentorat', 'Innovation'],
            weaknesses: [],
            observations: 'Candidat exceptionnel, parfaitement adapté au poste. Forte recommandation.',
            recommendation: 'strong_yes',
            next_steps: ['Proposition d\'embauche', 'Rencontre avec l\'équipe dirigeante'],
            salary_discussion: 95000,
            salary_currency: 'EUR',
            availability: '3 mois',
            notice_period: '3 mois',
            evaluated_by: 'user-003',
            evaluated_by_name: 'Michel Durand',
            evaluated_at: new Date().toISOString(),
            rating: 5
          },
          created_at: new Date().toISOString(),
          send_invitation: true,
          reminder_emails: true,
          feedback_provided: true
        }
      ];

      setInterviews(demoInterviews);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Erreur lors du chargement des entretiens');
    } finally {
      setLoading(false);
    }
  };

  const filterInterviews = useCallback(() => {
    let filtered = [...interviews];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(interview => 
        interview.candidate?.first_name?.toLowerCase().includes(term) ||
        interview.candidate?.last_name?.toLowerCase().includes(term) ||
        interview.job_title?.toLowerCase().includes(term) ||
        interview.candidate?.current_position?.toLowerCase().includes(term) ||
        interview.candidate?.skills?.some(s => s.toLowerCase().includes(term)) ||
        interview.candidate?.email?.toLowerCase().includes(term) ||
        interview.candidate?.location?.toLowerCase().includes(term) ||
        interview.interviewers.some(i => i.name.toLowerCase().includes(term))
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(interview => interview.status === statusFilter);
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(interview => interview.interview_type === typeFilter);
    }

    // Filtre par période
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    if (dateRange === 'today') {
      filtered = filtered.filter(interview => {
        const interviewDate = new Date(interview.interview_date);
        return interviewDate >= startOfToday && interviewDate <= endOfToday;
      });
    } else if (dateRange === 'week') {
      filtered = filtered.filter(interview => {
        const interviewDate = new Date(interview.interview_date);
        return interviewDate >= startOfWeek && interviewDate <= endOfWeek;
      });
    } else if (dateRange === 'month') {
      filtered = filtered.filter(interview => {
        const interviewDate = new Date(interview.interview_date);
        return interviewDate >= startOfMonth && interviewDate <= endOfMonth;
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.interview_date + ' ' + a.interview_time).getTime() - 
                      new Date(b.interview_date + ' ' + b.interview_time).getTime();
          break;
        case 'score':
          comparison = (b.candidate?.match_score || 0) - (a.candidate?.match_score || 0);
          break;
        case 'name':
          comparison = (a.candidate?.last_name || '').localeCompare(b.candidate?.last_name || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'type':
          comparison = a.interview_type.localeCompare(b.interview_type);
          break;
        default:
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredInterviews(filtered);
  }, [interviews, searchTerm, statusFilter, typeFilter, dateRange, sortBy, sortOrder]);

  const calculateStats = useCallback(() => {
    const scheduled = interviews.filter(i => i.status === 'scheduled').length;
    const completed = interviews.filter(i => i.status === 'completed').length;
    const cancelled = interviews.filter(i => i.status === 'cancelled').length;
    const noShow = interviews.filter(i => i.status === 'no_show').length;
    
    const evaluatedInterviews = interviews.filter(i => i.evaluation);
    
    // Scores moyens
    const averageScore = evaluatedInterviews.length > 0
      ? Math.round(evaluatedInterviews.reduce((acc, i) => {
          if (!i.evaluation) return acc;
          const scores = [
            i.evaluation.technical_skills,
            i.evaluation.communication,
            i.evaluation.problem_solving,
            i.evaluation.cultural_fit,
            i.evaluation.leadership,
            i.evaluation.motivation,
            i.evaluation.team_collaboration || 3,
            i.evaluation.adaptability || 3
          ];
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          return acc + avg;
        }, 0) / evaluatedInterviews.length * 20)
      : 0;

    // Score technique moyen
    const averageTechnicalScore = evaluatedInterviews.length > 0
      ? Math.round(evaluatedInterviews.reduce((acc, i) => 
          acc + (i.evaluation?.technical_skills || 0), 0) / evaluatedInterviews.length * 20)
      : 0;

    // Score soft skills moyen
    const averageSoftSkillsScore = evaluatedInterviews.length > 0
      ? Math.round(evaluatedInterviews.reduce((acc, i) => {
          const softSkills = [
            i.evaluation?.communication || 0,
            i.evaluation?.problem_solving || 0,
            i.evaluation?.cultural_fit || 0,
            i.evaluation?.team_collaboration || 0,
            i.evaluation?.adaptability || 0
          ];
          const avg = softSkills.reduce((a, b) => a + b, 0) / softSkills.length;
          return acc + avg;
        }, 0) / evaluatedInterviews.length * 20)
      : 0;

    // Taux d'acceptation
    const acceptanceRate = evaluatedInterviews.length > 0
      ? Math.round(evaluatedInterviews.filter(i => 
          i.evaluation?.recommendation === 'strong_yes' || i.evaluation?.recommendation === 'yes'
        ).length / evaluatedInterviews.length * 100)
      : 0;

    // Entretiens cette semaine
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const upcomingThisWeek = interviews.filter(i => {
      const interviewDate = new Date(i.interview_date);
      return i.status === 'scheduled' && interviewDate >= startOfWeek && interviewDate <= endOfWeek;
    }).length;

    // Taux de complétion
    const completionRate = interviews.length > 0
      ? Math.round(completed / interviews.length * 100)
      : 0;

    setStats({
      scheduled,
      completed,
      cancelled,
      no_show: noShow,
      total: interviews.length,
      averageScore,
      averageTechnicalScore,
      averageSoftSkillsScore,
      acceptanceRate,
      upcomingThisWeek,
      completionRate
    });
  }, [interviews]);

  const openEvaluationForm = (interview: Interview) => {
    setEvaluationForm({
      candidate_id: interview.candidate_id,
      candidate_name: `${interview.candidate?.first_name} ${interview.candidate?.last_name}`,
      interview_id: interview.id,
      job_title: interview.job_title,
      technical_skills: interview.evaluation?.technical_skills || 3,
      communication: interview.evaluation?.communication || 3,
      problem_solving: interview.evaluation?.problem_solving || 3,
      cultural_fit: interview.evaluation?.cultural_fit || 3,
      leadership: interview.evaluation?.leadership || 3,
      motivation: interview.evaluation?.motivation || 3,
      team_collaboration: interview.evaluation?.team_collaboration || 3,
      adaptability: interview.evaluation?.adaptability || 3,
      strengths: interview.evaluation?.strengths?.length ? interview.evaluation.strengths : [''],
      weaknesses: interview.evaluation?.weaknesses?.length ? interview.evaluation.weaknesses : [''],
      observations: interview.evaluation?.observations || '',
      recommendation: interview.evaluation?.recommendation || 'maybe',
      next_steps: interview.evaluation?.next_steps?.length ? interview.evaluation.next_steps : [''],
      salary_discussion: interview.evaluation?.salary_discussion,
      salary_currency: interview.evaluation?.salary_currency || 'EUR',
      availability: interview.evaluation?.availability || '',
      notice_period: interview.evaluation?.notice_period || '',
      additional_notes: interview.evaluation?.additional_notes || ''
    });
    setSelectedInterview(interview);
    setShowEvaluationForm(true);
  };

  const openDetailsModal = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowDetailsModal(true);
  };

  const handleEvaluationFormChange = (field: string, value: any) => {
    setEvaluationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addStrength = () => {
    setEvaluationForm(prev => ({
      ...prev,
      strengths: [...prev.strengths, '']
    }));
  };

  const removeStrength = (index: number) => {
    setEvaluationForm(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index)
    }));
  };

  const updateStrength = (index: number, value: string) => {
    const newStrengths = [...evaluationForm.strengths];
    newStrengths[index] = value;
    setEvaluationForm(prev => ({
      ...prev,
      strengths: newStrengths
    }));
  };

  const addWeakness = () => {
    setEvaluationForm(prev => ({
      ...prev,
      weaknesses: [...prev.weaknesses, '']
    }));
  };

  const removeWeakness = (index: number) => {
    setEvaluationForm(prev => ({
      ...prev,
      weaknesses: prev.weaknesses.filter((_, i) => i !== index)
    }));
  };

  const updateWeakness = (index: number, value: string) => {
    const newWeaknesses = [...evaluationForm.weaknesses];
    newWeaknesses[index] = value;
    setEvaluationForm(prev => ({
      ...prev,
      weaknesses: newWeaknesses
    }));
  };

  const addNextStep = () => {
    setEvaluationForm(prev => ({
      ...prev,
      next_steps: [...prev.next_steps, '']
    }));
  };

  const removeNextStep = (index: number) => {
    setEvaluationForm(prev => ({
      ...prev,
      next_steps: prev.next_steps.filter((_, i) => i !== index)
    }));
  };

  const updateNextStep = (index: number, value: string) => {
    const newNextSteps = [...evaluationForm.next_steps];
    newNextSteps[index] = value;
    setEvaluationForm(prev => ({
      ...prev,
      next_steps: newNextSteps
    }));
  };

  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      toast.loading('Enregistrement de l\'évaluation...', { id: 'evaluation' });
      
      // Simuler l'envoi
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'entretien avec l'évaluation
      const updatedInterviews = interviews.map(interview => {
        if (interview.id === evaluationForm.interview_id) {
          return {
            ...interview,
            status: 'completed' as const,
            feedback_provided: true,
            evaluation: {
              id: `eval-${Date.now()}`,
              interview_id: evaluationForm.interview_id,
              technical_skills: evaluationForm.technical_skills,
              communication: evaluationForm.communication,
              problem_solving: evaluationForm.problem_solving,
              cultural_fit: evaluationForm.cultural_fit,
              leadership: evaluationForm.leadership,
              motivation: evaluationForm.motivation,
              team_collaboration: evaluationForm.team_collaboration,
              adaptability: evaluationForm.adaptability,
              strengths: evaluationForm.strengths.filter(s => s.trim() !== ''),
              weaknesses: evaluationForm.weaknesses.filter(w => w.trim() !== ''),
              observations: evaluationForm.observations,
              recommendation: evaluationForm.recommendation,
              next_steps: evaluationForm.next_steps.filter(n => n.trim() !== ''),
              salary_discussion: evaluationForm.salary_discussion,
              salary_currency: evaluationForm.salary_currency,
              availability: evaluationForm.availability,
              notice_period: evaluationForm.notice_period,
              additional_notes: evaluationForm.additional_notes,
              evaluated_by: 'user-current',
              evaluated_by_name: 'Utilisateur actuel',
              evaluated_at: new Date().toISOString(),
              rating: (
                evaluationForm.technical_skills +
                evaluationForm.communication +
                evaluationForm.problem_solving +
                evaluationForm.cultural_fit +
                evaluationForm.leadership +
                evaluationForm.motivation +
                evaluationForm.team_collaboration +
                evaluationForm.adaptability
              ) / 8
            }
          };
        }
        return interview;
      });
      
      setInterviews(updatedInterviews);
      
      toast.success('✅ Évaluation enregistrée avec succès', { id: 'evaluation' });
      setShowEvaluationForm(false);
      setSelectedInterview(null);
      
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('❌ Erreur lors de l\'enregistrement', { id: 'evaluation' });
    }
  };

  const sendReminder = async (interview: Interview) => {
    try {
      toast.loading('Envoi du rappel...', { id: 'reminder' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour le statut du rappel
      const updatedInterviews = interviews.map(i => {
        if (i.id === interview.id) {
          return { ...i, reminder_sent: true };
        }
        return i;
      });
      setInterviews(updatedInterviews);
      
      toast.success('✅ Rappel envoyé avec succès', { id: 'reminder' });
    } catch (error) {
      toast.error('❌ Erreur lors de l\'envoi du rappel', { id: 'reminder' });
    }
  };

  const rescheduleInterview = (interview: Interview) => {
    // Logique de report
    toast.success('Fonctionnalité de report à venir');
  };

  const cancelInterview = (interview: Interview) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cet entretien ?')) {
      const updatedInterviews = interviews.map(i => {
        if (i.id === interview.id) {
          return { ...i, status: 'cancelled' as const };
        }
        return i;
      });
      setInterviews(updatedInterviews);
      toast.success('✅ Entretien annulé');
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_yes': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'yes': return 'text-green-600 bg-green-50 border-green-200';
      case 'maybe': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'no': return 'text-red-600 bg-red-50 border-red-200';
      case 'strong_no': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'strong_yes': return <ThumbsUp className="w-4 h-4" />;
      case 'yes': return <ThumbsUp className="w-4 h-4" />;
      case 'maybe': return <HelpCircle className="w-4 h-4" />;
      case 'no': return <ThumbsDown className="w-4 h-4" />;
      case 'strong_no': return <ThumbsDown className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'rescheduled': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'no_show': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'rescheduled': return <RefreshCw className="w-4 h-4" />;
      case 'no_show': return <UserX className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'in_person': return <MapPin className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const calculateAverageScore = (evaluation: InterviewEvaluation) => {
    const scores = [
      evaluation.technical_skills,
      evaluation.communication,
      evaluation.problem_solving,
      evaluation.cultural_fit,
      evaluation.leadership,
      evaluation.motivation,
      evaluation.team_collaboration || 3,
      evaluation.adaptability || 3
    ];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg * 20); // Convertir en pourcentage
  };

  const formatDate = (date: string, time: string) => {
    const d = new Date(date + ' ' + time);
    return d.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isToday = (date: string) => {
    const today = new Date();
    const interviewDate = new Date(date);
    return interviewDate.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const interviewDate = new Date(date);
    return interviewDate.toDateString() === tomorrow.toDateString();
  };

  const renderStatsPanel = () => (
    <div className="p-5 mb-6 border bg-gradient-to-br from-white to-slate-50 border-slate-200/70 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <BarChart3 className="text-white w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Dashboard Entretiens</h3>
            <p className="text-sm text-slate-600">Statistiques et indicateurs clés</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setViewMode('grid');
            }}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setViewMode('list');
            }}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setViewMode('calendar');
            }}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'calendar' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 md:grid-cols-4">
        <div className="p-4 border bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Planifiés</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.scheduled}</p>
          <p className="text-sm text-slate-600">dont {stats.upcomingThisWeek} cette semaine</p>
        </div>
        
        <div className="p-4 border bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">Terminés</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
          <p className="text-sm text-slate-600">{stats.completionRate}% complétés</p>
        </div>
        
        <div className="p-4 border bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">Score moyen</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.averageScore}%</p>
          <p className="text-sm text-slate-600">Technique: {stats.averageTechnicalScore}%</p>
        </div>
        
        <div className="p-4 border bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <ThumbsUp className="w-5 h-5 text-violet-600" />
            <span className="text-xs font-medium text-violet-600">Acceptation</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.acceptanceRate}%</p>
          <p className="text-sm text-slate-600">taux de recommandation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg border-slate-200/70">
          <span className="text-sm text-slate-600">Total entretiens</span>
          <span className="text-lg font-bold text-slate-900">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg border-slate-200/70">
          <span className="text-sm text-slate-600">Annulés</span>
          <span className="text-lg font-bold text-red-600">{stats.cancelled}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg border-slate-200/70">
          <span className="text-sm text-slate-600">Absences</span>
          <span className="text-lg font-bold text-rose-600">{stats.no_show}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg border-slate-200/70">
          <span className="text-sm text-slate-600">Soft skills</span>
          <span className="text-lg font-bold text-emerald-600">{stats.averageSoftSkillsScore}%</span>
        </div>
      </div>
    </div>
  );

const renderFilters = () => (
  <div className="p-5 mb-6 bg-white border shadow-sm border-slate-200/70 rounded-xl">
    <div className="flex flex-col gap-4 mb-4 md:flex-row">
      <div className="relative flex-1">
        <Search className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, poste, compétence, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none min-w-[140px]"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none min-w-[140px]"
        >
          {typeOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-4 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none min-w-[140px]"
        >
          <option value="all">Toutes dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none min-w-[140px]"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-3.5 bg-white border border-slate-300/70 rounded-xl hover:bg-slate-50"
          title={sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
        
        <button
          onClick={fetchInterviews}
          className="p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all"
          title="Actualiser"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>

    {/* Filtres actifs - UN SEUL BLOC */}
    {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateRange !== 'all') && (
      <div className="flex flex-wrap items-center gap-2 pt-4 mt-2 border-t border-slate-200">
        <span className="text-sm text-slate-600">Filtres actifs:</span>
        {searchTerm && (
          <span className="flex items-center px-3 py-1 space-x-1 text-sm text-blue-700 bg-blue-100 rounded-full">
            <Search className="w-3 h-3" />
            <span>"{searchTerm}"</span>
            <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {statusFilter !== 'all' && (
          <span className="flex items-center px-3 py-1 space-x-1 text-sm text-blue-700 bg-blue-100 rounded-full">
            {getStatusIcon(statusFilter)}
            <span>{statusOptions.find(o => o.value === statusFilter)?.label}</span>
            <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-blue-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {typeFilter !== 'all' && (
          <span className="flex items-center px-3 py-1 space-x-1 text-sm text-blue-700 bg-blue-100 rounded-full">
            {getInterviewTypeIcon(typeFilter)}
            <span>{typeOptions.find(o => o.value === typeFilter)?.label}</span>
            <button onClick={() => setTypeFilter('all')} className="ml-1 hover:text-blue-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {dateRange !== 'all' && (
          <span className="flex items-center px-3 py-1 space-x-1 text-sm text-blue-700 bg-blue-100 rounded-full">
            <Calendar className="w-3 h-3" />
            <span>
              {dateRange === 'today' ? "Aujourd'hui" : 
               dateRange === 'week' ? 'Cette semaine' : 'Ce mois'}
            </span>
            <button onClick={() => setDateRange('all')} className="ml-1 hover:text-blue-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setTypeFilter('all');
            setDateRange('all');
          }}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
        >
          Tout effacer
        </button>
      </div>
    )}
  </div>
);

  const renderInterviewCard = (interview: Interview) => {
    const isUpcoming = interview.status === 'scheduled';
    const isPast = interview.status === 'completed' || interview.status === 'cancelled' || interview.status === 'no_show';
    
    return (
      <div 
        key={interview.id}
        className={`p-5 transition-all duration-300 bg-white border cursor-pointer hover:shadow-xl rounded-xl ${
          isUpcoming && isToday(interview.interview_date) 
            ? 'border-emerald-200 ring-2 ring-emerald-500/20' 
            : isUpcoming && isTomorrow(interview.interview_date)
            ? 'border-amber-200'
            : 'border-slate-200/70'
        }`}
        onClick={() => openDetailsModal(interview)}
      >
        {/* Badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 shadow-lg rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <span className="text-lg font-bold text-white">
                {interview.candidate?.first_name?.charAt(0)}{interview.candidate?.last_name?.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900">
                {interview.candidate?.first_name} {interview.candidate?.last_name}
              </h4>
              <p className="text-sm text-slate-600">{interview.job_title}</p>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(interview.status)}`}>
            {getStatusIcon(interview.status)}
            <span>
              {interview.status === 'scheduled' ? 'Planifié' :
               interview.status === 'completed' ? 'Terminé' :
               interview.status === 'cancelled' ? 'Annulé' :
               interview.status === 'rescheduled' ? 'Reporté' : 'Absent'}
            </span>
          </div>
        </div>

        {/* Date et heure */}
        <div className="p-3 mb-3 border rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200/50">
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>
              {isToday(interview.interview_date) 
                ? "Aujourd'hui" 
                : isTomorrow(interview.interview_date)
                ? "Demain"
                : new Date(interview.interview_date).toLocaleDateString('fr-FR', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
            </span>
            <Clock className="w-4 h-4 ml-2 text-emerald-600" />
            <span>{interview.interview_time}</span>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            {getInterviewTypeIcon(interview.interview_type)}
            <span className="truncate">
              {interview.interview_type === 'video' ? 'Visioconférence' :
               interview.interview_type === 'phone' ? 'Téléphonique' : 'Présentiel'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{interview.duration} min</span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{interview.interviewers.length} interviewer(s)</span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="truncate">{interview.candidate?.location || 'Non spécifié'}</span>
          </div>
        </div>

        {/* Score IA */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center space-x-1 text-xs text-slate-500">
              <Brain className="w-3 h-3" />
              <span>Score IA</span>
            </span>
            <span className="text-xs font-medium text-slate-700">{interview.candidate?.match_score || 0}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full" 
              style={{ width: `${interview.candidate?.match_score || 0}%` }}
            ></div>
          </div>
        </div>

        {interview.evaluation ? (
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">Évaluation</span>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1 border ${getRecommendationColor(interview.evaluation.recommendation)}`}>
                {getRecommendationIcon(interview.evaluation.recommendation)}
                <span>
                  {interview.evaluation.recommendation === 'strong_yes' ? 'Très favorable' :
                   interview.evaluation.recommendation === 'yes' ? 'Favorable' :
                   interview.evaluation.recommendation === 'maybe' ? 'Mitigée' :
                   interview.evaluation.recommendation === 'no' ? 'Défavorable' : 'Très défavorable'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Score global</span>
                  <span className="text-xs font-medium text-slate-700">{calculateAverageScore(interview.evaluation)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" 
                    style={{ width: `${calculateAverageScore(interview.evaluation)}%` }}
                  ></div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1 text-xs text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>En attente d'évaluation</span>
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openEvaluationForm(interview);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white transition-all rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Évaluer
              </button>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        {isUpcoming && (
          <div className="flex items-center justify-end mt-3 space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                sendReminder(interview);
              }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Envoyer un rappel"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                rescheduleInterview(interview);
              }}
              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Reporter"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelInterview(interview);
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Annuler"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedInterview) return null;
    
    const interview = selectedInterview;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
          <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-lg border-slate-200/50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 shadow-lg rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <span className="text-2xl font-bold text-white">
                  {interview.candidate?.first_name?.charAt(0)}{interview.candidate?.last_name?.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {interview.candidate?.first_name} {interview.candidate?.last_name}
                </h3>
                <p className="text-slate-600">{interview.job_title}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="space-y-6">
              {/* Statut et actions */}
              <div className="flex items-center justify-between">
                <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 border ${getStatusColor(interview.status)}`}>
                  {getStatusIcon(interview.status)}
                  <span>
                    {interview.status === 'scheduled' ? 'Planifié' :
                     interview.status === 'completed' ? 'Terminé' :
                     interview.status === 'cancelled' ? 'Annulé' :
                     interview.status === 'rescheduled' ? 'Reporté' : 'Absent'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 text-white rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                    Modifier
                  </button>
                  <button className="px-4 py-2 text-white rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    Envoyer rappel
                  </button>
                </div>
              </div>

              {/* Grille d'informations */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Informations candidat */}
                <div className="p-6 border bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200/50 rounded-xl">
                  <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-blue-900">
                    <Users className="w-5 h-5" />
                    <span>Informations candidat</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Email</p>
                        <a href={`mailto:${interview.candidate?.email}`} className="text-sm text-blue-600 hover:underline">
                          {interview.candidate?.email}
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Téléphone</p>
                        <a href={`tel:${interview.candidate?.phone}`} className="text-sm text-blue-600 hover:underline">
                          {interview.candidate?.phone}
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Localisation</p>
                        <p className="text-sm text-slate-600">{interview.candidate?.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Poste actuel</p>
                        <p className="text-sm text-slate-600">{interview.candidate?.current_position}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Expérience</p>
                        <p className="text-sm text-slate-600">{interview.candidate?.experience_years} ans</p>
                      </div>
                    </div>
                    
                    {interview.candidate?.linkedin_url && (
                      <div className="flex items-start space-x-3">
                        <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">LinkedIn</p>
                          <a href={interview.candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            Voir profil
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails entretien */}
                <div className="p-6 border bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border-emerald-200/50 rounded-xl">
                  <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-emerald-900">
                    <Calendar className="w-5 h-5" />
                    <span>Détails entretien</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Date et heure</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(interview.interview_date, interview.interview_time)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      {getInterviewTypeIcon(interview.interview_type)}
                      <div>
                        <p className="text-sm font-medium text-slate-700">Type</p>
                        <p className="text-sm text-slate-600">
                          {interview.interview_type === 'video' ? 'Visioconférence' :
                           interview.interview_type === 'phone' ? 'Téléphonique' : 'Présentiel'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Durée</p>
                        <p className="text-sm text-slate-600">{interview.duration} minutes</p>
                      </div>
                    </div>
                    
                    {interview.location && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Lieu</p>
                          <p className="text-sm text-slate-600">{interview.location}</p>
                        </div>
                      </div>
                    )}
                    
                    {interview.meeting_link && (
                      <div className="flex items-start space-x-3">
                        <Video className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Lien de réunion</p>
                          <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm break-all text-emerald-600 hover:underline">
                            {interview.meeting_link}
                          </a>
                          {interview.meeting_password && (
                            <p className="mt-1 text-xs text-slate-500">Code: {interview.meeting_password}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interviewers */}
              <div className="p-6 border bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200/50 rounded-xl">
                <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-amber-900">
                  <Users className="w-5 h-5" />
                  <span>Interviewers</span>
                </h4>
                
                <div className="space-y-3">
                  {interview.interviewers.map((interviewer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg border-slate-200/70">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
                          <span className="font-bold text-white">
                            {interviewer.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{interviewer.name}</p>
                          <p className="text-xs text-slate-500">{interviewer.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a href={`mailto:${interviewer.email}`} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                          <Mail className="w-4 h-4" />
                        </a>
                        {interviewer.confirmed ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Confirmé</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">En attente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Évaluation */}
              {interview.evaluation && (
                <div className="p-6 border bg-gradient-to-br from-violet-50/50 to-purple-50/50 border-violet-200/50 rounded-xl">
                  <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-violet-900">
                    <Award className="w-5 h-5" />
                    <span>Évaluation</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-4">
                    <div className="p-4 bg-white border rounded-lg border-slate-200/70">
                      <div className="text-center">
                        <p className="mb-1 text-sm text-slate-500">Score global</p>
                        <p className="text-3xl font-bold text-violet-600">{calculateAverageScore(interview.evaluation)}%</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white border rounded-lg border-slate-200/70">
                      <div className="text-center">
                        <p className="mb-1 text-sm text-slate-500">Technique</p>
                        <p className="text-3xl font-bold text-blue-600">{interview.evaluation.technical_skills * 20}%</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white border rounded-lg border-slate-200/70">
                      <div className="text-center">
                        <p className="mb-1 text-sm text-slate-500">Communication</p>
                        <p className="text-3xl font-bold text-emerald-600">{interview.evaluation.communication * 20}%</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white border rounded-lg border-slate-200/70">
                      <div className="text-center">
                        <p className="mb-1 text-sm text-slate-500">Fit culturel</p>
                        <p className="text-3xl font-bold text-amber-600">{interview.evaluation.cultural_fit * 20}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h5 className="flex items-center mb-2 space-x-1 font-medium text-slate-700">
                        <ThumbsUp className="w-4 h-4 text-emerald-600" />
                        <span>Points forts</span>
                      </h5>
                      <ul className="space-y-1">
                        {interview.evaluation.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start space-x-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></div>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="flex items-center mb-2 space-x-1 font-medium text-slate-700">
                        <ThumbsDown className="w-4 h-4 text-amber-600" />
                        <span>Points à améliorer</span>
                      </h5>
                      <ul className="space-y-1">
                        {interview.evaluation.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-start space-x-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></div>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {interview.evaluation.observations && (
                    <div className="p-4 mt-4 bg-white border rounded-lg border-slate-200/70">
                      <p className="mb-2 text-sm font-medium text-slate-700">Observations</p>
                      <p className="text-sm text-slate-600">{interview.evaluation.observations}</p>
                    </div>
                  )}

                  {interview.evaluation.next_steps.length > 0 && (
                    <div className="mt-4">
                      <h5 className="mb-2 font-medium text-slate-700">Prochaines étapes</h5>
                      <ul className="space-y-1">
                        {interview.evaluation.next_steps.map((step, i) => (
                          <li key={i} className="flex items-start space-x-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 mt-4 text-xs border-t text-slate-500">
                    <span>Évalué par {interview.evaluation.evaluated_by_name}</span>
                    <span>le {new Date(interview.evaluation.evaluated_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end pt-6 space-x-4 border-t border-slate-200">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 font-medium transition-all bg-gradient-to-r from-slate-200 to-gray-200 text-slate-700 rounded-xl hover:from-slate-300 hover:to-gray-300"
                >
                  Fermer
                </button>
                {!interview.evaluation && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openEvaluationForm(interview);
                    }}
                    className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
                  >
                    Évaluer ce candidat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEvaluationForm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-white/30">
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-lg border-slate-200/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <FileText className="text-white w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Évaluation d'entretien</h3>
              <p className="text-sm text-slate-600">
                {evaluationForm.candidate_name} • {evaluationForm.job_title}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEvaluationForm(false)}
            className="p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleEvaluationSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-8">
            {/* Scores */}
            <div className="p-6 border bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200/50 rounded-xl">
              <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-blue-900">
                <Target className="w-5 h-5" />
                <span>Évaluation des compétences (1-5)</span>
              </h4>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Techniques
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={evaluationForm.technical_skills}
                      onChange={(e) => handleEvaluationFormChange('technical_skills', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[30px]">
                      {evaluationForm.technical_skills}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Communication
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={evaluationForm.communication}
                      onChange={(e) => handleEvaluationFormChange('communication', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[30px]">
                      {evaluationForm.communication}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Résolution
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={evaluationForm.problem_solving}
                      onChange={(e) => handleEvaluationFormChange('problem_solving', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[30px]">
                      {evaluationForm.problem_solving}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Fit culturel
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={evaluationForm.cultural_fit}
                      onChange={(e) => handleEvaluationFormChange('cultural_fit', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[30px]">
                      {evaluationForm.cultural_fit}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Leadership
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={evaluationForm.leadership}
                      onChange={(e) => handleEvaluationFormChange('leadership', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[30px]">
                      {evaluationForm.leadership}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Motivation
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={evaluationForm.motivation}
                      onChange={(e) => handleEvaluationFormChange('motivation', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[30px]">
                      {evaluationForm.motivation}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Collaboration
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={evaluationForm.team_collaboration}
                      onChange={(e) => handleEvaluationFormChange('team_collaboration', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[30px]">
                      {evaluationForm.team_collaboration}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Adaptabilité
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={evaluationForm.adaptability}
                      onChange={(e) => handleEvaluationFormChange('adaptability', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[30px]">
                      {evaluationForm.adaptability}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Points forts */}
            <div className="p-6 border bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border-emerald-200/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center space-x-2 text-lg font-semibold text-emerald-900">
                  <ThumbsUp className="w-5 h-5" />
                  <span>Points forts</span>
                </h4>
                <button
                  type="button"
                  onClick={addStrength}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {evaluationForm.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={strength}
                      onChange={(e) => updateStrength(index, e.target.value)}
                      placeholder={`Point fort ${index + 1}`}
                      className="flex-1 px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {evaluationForm.strengths.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStrength(index)}
                        className="p-3 text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Points faibles */}
            <div className="p-6 border bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center space-x-2 text-lg font-semibold text-amber-900">
                  <ThumbsDown className="w-5 h-5" />
                  <span>Points à améliorer</span>
                </h4>
                <button
                  type="button"
                  onClick={addWeakness}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {evaluationForm.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={weakness}
                      onChange={(e) => updateWeakness(index, e.target.value)}
                      placeholder={`Point à améliorer ${index + 1}`}
                      className="flex-1 px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    {evaluationForm.weaknesses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWeakness(index)}
                        className="p-3 text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Observations */}
            <div className="p-6 border bg-gradient-to-br from-violet-50/50 to-purple-50/50 border-violet-200/50 rounded-xl">
              <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-violet-900">
                <MessageSquare className="w-5 h-5" />
                <span>Observations générales</span>
              </h4>
              <textarea
                value={evaluationForm.observations}
                onChange={(e) => handleEvaluationFormChange('observations', e.target.value)}
                rows={4}
                placeholder="Vos impressions générales sur l'entretien, points marquants, etc."
                className="w-full px-4 py-3 transition-all bg-white border outline-none resize-none border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Recommandation */}
            <div className="p-6 border bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200/50 rounded-xl">
              <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-blue-900">
                <Target className="w-5 h-5" />
                <span>Recommandation</span>
              </h4>
              
              <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3 md:grid-cols-5">
                {[
                  { value: 'strong_yes', label: 'Très favorable', color: 'emerald', icon: ThumbsUp },
                  { value: 'yes', label: 'Favorable', color: 'green', icon: ThumbsUp },
                  { value: 'maybe', label: 'Mitigé', color: 'amber', icon: HelpCircle },
                  { value: 'no', label: 'Défavorable', color: 'red', icon: ThumbsDown },
                  { value: 'strong_no', label: 'Très défavorable', color: 'rose', icon: ThumbsDown }
                ].map(option => {
                  const Icon = option.icon;
                  const isSelected = evaluationForm.recommendation === option.value;
                  const getColorClasses = () => {
                    if (!isSelected) return 'border-slate-200 hover:border-slate-300';
                    switch (option.color) {
                      case 'emerald': return 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100';
                      case 'green': return 'border-green-500 bg-gradient-to-br from-green-50 to-green-100';
                      case 'amber': return 'border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100';
                      case 'red': return 'border-red-500 bg-gradient-to-br from-red-50 to-red-100';
                      case 'rose': return 'border-rose-500 bg-gradient-to-br from-rose-50 to-rose-100';
                      default: return 'border-slate-200';
                    }
                  };
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleEvaluationFormChange('recommendation', option.value)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${getColorClasses()}`}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? `text-${option.color}-600` : 'text-slate-400'}`} />
                      <span className={`text-xs font-medium ${isSelected ? `text-${option.color}-700` : 'text-slate-600'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Prochaines étapes */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-slate-700">Prochaines étapes</h5>
                  <button
                    type="button"
                    onClick={addNextStep}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {evaluationForm.next_steps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateNextStep(index, e.target.value)}
                        placeholder={`Étape ${index + 1}`}
                        className="flex-1 px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {evaluationForm.next_steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeNextStep(index)}
                          className="p-3 text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Détails supplémentaires */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="p-6 bg-white border border-slate-200/70 rounded-xl">
                <h4 className="mb-4 text-lg font-semibold text-slate-900">Prétentions</h4>
                <div className="flex items-center space-x-2">
                  <select
                    value={evaluationForm.salary_currency}
                    onChange={(e) => handleEvaluationFormChange('salary_currency', e.target.value)}
                    className="px-3 py-3 bg-white border rounded-lg outline-none border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {currencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.symbol}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={evaluationForm.salary_discussion || ''}
                    onChange={(e) => handleEvaluationFormChange('salary_discussion', parseInt(e.target.value) || undefined)}
                    placeholder="Montant"
                    className="flex-1 px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-white border border-slate-200/70 rounded-xl">
                <h4 className="mb-4 text-lg font-semibold text-slate-900">Disponibilité</h4>
                <input
                  type="text"
                  value={evaluationForm.availability || ''}
                  onChange={(e) => handleEvaluationFormChange('availability', e.target.value)}
                  placeholder="Ex: 1 mois"
                  className="w-full px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="p-6 bg-white border border-slate-200/70 rounded-xl">
                <h4 className="mb-4 text-lg font-semibold text-slate-900">Préavis</h4>
                <input
                  type="text"
                  value={evaluationForm.notice_period || ''}
                  onChange={(e) => handleEvaluationFormChange('notice_period', e.target.value)}
                  placeholder="Ex: 3 mois"
                  className="w-full px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Notes additionnelles */}
            <div className="p-6 bg-white border border-slate-200/70 rounded-xl">
              <h4 className="mb-4 text-lg font-semibold text-slate-900">Notes additionnelles</h4>
              <textarea
                value={evaluationForm.additional_notes}
                onChange={(e) => handleEvaluationFormChange('additional_notes', e.target.value)}
                rows={3}
                placeholder="Informations supplémentaires, conditions particulières, etc."
                className="w-full px-4 py-3 transition-all bg-white border outline-none resize-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-6 space-x-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowEvaluationForm(false)}
                className="flex items-center px-6 py-3 space-x-2 font-medium transition-all bg-gradient-to-r from-slate-200 to-gray-200 text-slate-700 rounded-xl hover:from-slate-300 hover:to-gray-300"
              >
                <X className="w-5 h-5" />
                <span>Annuler</span>
              </button>
              <button
                type="submit"
                className="flex items-center px-8 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25"
              >
                <Send className="w-5 h-5" />
                <span>Enregistrer l'évaluation</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 rounded-full border-emerald-200 border-t-emerald-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-emerald-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-lg font-medium text-slate-700">Chargement des entretiens...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panneau de statistiques */}
      {renderStatsPanel()}

      {/* Barre de filtres */}
      {renderFilters()}

      {/* Résultats */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold">{filteredInterviews.length}</span> entretien(s) trouvé(s)
        </p>
        <button
          onClick={() => {
            // Logique d'export
            toast.success('Export en cours de développement');
          }}
          className="flex items-center px-4 py-2 space-x-2 text-sm font-medium bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
        >
          <Download className="w-4 h-4" />
          <span>Exporter</span>
        </button>
      </div>

      {/* Liste des entretiens */}
      {filteredInterviews.length === 0 ? (
        <div className="py-16 text-center border shadow-sm bg-gradient-to-br from-white to-slate-50 rounded-2xl border-slate-200/50">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 shadow-inner bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
            <Calendar className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Aucun entretien trouvé</h3>
          <p className="max-w-md mx-auto mb-6 text-slate-600">
            Aucun entretien ne correspond à vos critères de recherche.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
              setDateRange('all');
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredInterviews.map(renderInterviewCard)}
        </div>
      )}

      {/* Formulaire d'évaluation */}
      {showEvaluationForm && renderEvaluationForm()}

      {/* Modal de détails */}
      {showDetailsModal && renderDetailsModal()}
    </div>
  );
}