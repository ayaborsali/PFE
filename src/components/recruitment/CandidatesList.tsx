import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, 
  Search, Filter, Download, Eye, Star, Award,
  GraduationCap, Languages, Award as AwardIcon, ChevronRight,
  Bot, Sparkles, Brain, Zap, AlertCircle, CheckCircle, XCircle,
  TrendingUp, Users, Clock, BarChart3, Target, Shield,
  RefreshCw, ExternalLink, FileText, CalendarDays, MapPinOff,
  Video, MessageSquare, Clock3, Send, X, Plus, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  status: string;
  match_score: number;
  source: string;
  created_at: string;
  last_updated: string;
  cv_file_url?: string;
  job_title?: string;
  salary_expectations?: number;
  notice_period?: string;
  availability?: string;
  ai_analysis?: {
    match_score: number;
    skills_match: string[];
    missing_skills: string[];
    experience_rating: number;
    red_flags: string[];
    recommendations: string[];
    analyzed_at: string;
    confidence_score: number;
    cultural_fit?: number;
    growth_potential?: number;
    technical_depth?: number;
  };
  pre_selection_status?: 'pending' | 'ai_reviewed' | 'ai_approved' | 'ai_rejected' | 'manual_review';
  pre_selection_comments?: string[];
  tags?: string[];
}

interface AIAnalysisResult {
  match_score: number;
  skills_match: string[];
  missing_skills: string[];
  experience_rating: number;
  red_flags: string[];
  recommendations: string[];
  confidence_score: number;
  cultural_fit: number;
  growth_potential: number;
  technical_depth: number;
}

interface PreSelectionFilters {
  minScore: number;
  requiredSkills: string[];
  minExperience: number;
  maxExperience?: number;
  excludeRedFlags: boolean;
  locationFilter?: string;
  educationLevel?: string[];
  salaryRange?: [number, number];
  availabilityFilter?: string[];
  tagsFilter?: string[];
  culturalFitMin?: number;
}

interface JobOffer {
  id: string;
  title: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceRange?: [number, number];
  salaryRange?: [number, number];
  location?: string;
  department?: string;
  urgency?: 'low' | 'medium' | 'high';
}

// Interface pour le formulaire d'entretien
interface InterviewFormData {
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: 'video' | 'phone' | 'in_person';
  interviewers: string[];
  duration: number; // en minutes
  location?: string;
  meetingLink?: string;
  notes: string;
  questionsToAsk: string[];
  topicsToCover: string[];
  sendInvitation: boolean;
  reminderEmails: boolean;
}

export default function CandidatesList() {
  // États principaux
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('ai_score');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [analyzingCandidate, setAnalyzingCandidate] = useState<string | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  // État pour le formulaire d'entretien
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewFormData, setInterviewFormData] = useState<InterviewFormData>({
    candidateId: '',
    candidateName: '',
    jobTitle: '',
    interviewDate: '',
    interviewTime: '',
    interviewType: 'video',
    interviewers: [''],
    duration: 60,
    location: '',
    meetingLink: '',
    notes: '',
    questionsToAsk: [''],
    topicsToCover: [''],
    sendInvitation: true,
    reminderEmails: true
  });

  // Filtres IA avancés
  const [aiFilters, setAiFilters] = useState<PreSelectionFilters>({
    minScore: 70,
    requiredSkills: [],
    minExperience: 3,
    excludeRedFlags: true,
    culturalFitMin: 60,
  });

  // Offres d'emploi avec plus de détails
  const [activeJobs, setActiveJobs] = useState<JobOffer[]>([
    { 
      id: '1', 
      title: 'Développeur Full Stack Senior', 
      requiredSkills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      preferredSkills: ['Docker', 'GraphQL', 'MongoDB'],
      experienceRange: [5, 10],
      salaryRange: [60000, 85000],
      location: 'Paris',
      department: 'IT',
      urgency: 'high'
    },
    { 
      id: '2', 
      title: 'Data Scientist', 
      requiredSkills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
      preferredSkills: ['PyTorch', 'Spark', 'Big Data'],
      experienceRange: [3, 7],
      salaryRange: [55000, 75000],
      location: 'Lyon',
      department: 'Data',
      urgency: 'medium'
    },
    { 
      id: '3', 
      title: 'Chef de Projet IT', 
      requiredSkills: ['Agile', 'JIRA', 'Gestion de projet', 'Scrum'],
      preferredSkills: ['Prince2', 'PMP', 'Azure DevOps'],
      experienceRange: [7, 15],
      salaryRange: [65000, 90000],
      location: 'Remote',
      department: 'Management',
      urgency: 'low'
    },
    { 
      id: '4', 
      title: 'DevOps Engineer', 
      requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
      preferredSkills: ['Terraform', 'Ansible', 'Prometheus'],
      experienceRange: [4, 8],
      salaryRange: [58000, 82000],
      location: 'Nantes',
      department: 'Operations',
      urgency: 'high'
    }
  ]);
  
  const [selectedJob, setSelectedJob] = useState<string>('1');

  // Tags disponibles pour filtrage
  const availableTags = useMemo(() => [
    'React Expert', 'Node.js', 'Python', 'Machine Learning', 
    'Cloud AWS', 'DevOps', 'Senior', 'Remote', 'Paris', 
    'Full Stack', 'Data Science', 'Agile', 'Startup', 'Scale-up'
  ], []);

  // Candidats de démonstration enrichis
  const demoCandidates: Candidate[] = useMemo(() => [
    {
      id: 'demo-001',
      first_name: 'Marie',
      last_name: 'Dubois',
      email: 'marie.dubois@email.com',
      phone: '+33 6 12 34 56 78',
      location: 'Paris',
      current_position: 'Développeuse Full Stack Senior',
      experience_years: 8,
      skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'MongoDB', 'GraphQL', 'Redux', 'Jest'],
      education: 'Master Informatique - École Polytechnique',
      languages: ['Français', 'Anglais (C1)', 'Espagnol (B2)'],
      status: 'new',
      match_score: 92,
      source: 'LinkedIn',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      pre_selection_status: 'pending',
      salary_expectations: 75000,
      notice_period: '1 mois',
      availability: 'Immédiate',
      tags: ['React Expert', 'Senior', 'Paris', 'Full Stack', 'Scale-up']
    },
    {
      id: 'demo-002',
      first_name: 'Thomas',
      last_name: 'Martin',
      email: 'thomas.martin@email.com',
      phone: '+33 6 23 45 67 89',
      location: 'Lyon',
      current_position: 'Data Scientist Lead',
      experience_years: 5,
      skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Pandas', 'Scikit-learn', 'PyTorch', 'Spark'],
      education: 'Diplôme d\'Ingénieur Data - Mines ParisTech',
      languages: ['Français', 'Anglais (C2)', 'Allemand (B1)'],
      status: 'new',
      match_score: 85,
      source: 'Site web',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      last_updated: new Date(Date.now() - 86400000).toISOString(),
      pre_selection_status: 'pending',
      salary_expectations: 68000,
      notice_period: '2 mois',
      availability: '1 mois',
      tags: ['Python', 'Machine Learning', 'Data Science', 'Senior', 'Lyon']
    },
    {
      id: 'demo-003',
      first_name: 'Sophie',
      last_name: 'Bernard',
      email: 'sophie.bernard@email.com',
      phone: '+33 6 34 56 78 90',
      location: 'Bordeaux',
      current_position: 'Chef de Projet IT Senior',
      experience_years: 10,
      skills: ['Agile', 'Scrum', 'JIRA', 'Gestion de projet', 'Prince2', 'SAFe', 'Confluence', 'Azure DevOps'],
      education: 'MBA Management - HEC Paris',
      languages: ['Français', 'Anglais', 'Espagnol'],
      status: 'new',
      match_score: 78,
      source: 'Recommendation',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      last_updated: new Date(Date.now() - 172800000).toISOString(),
      pre_selection_status: 'pending',
      salary_expectations: 85000,
      notice_period: '3 mois',
      availability: '2 mois',
      tags: ['Agile', 'Senior', 'Management', 'Remote', 'Startup']
    },
    {
      id: 'demo-004',
      first_name: 'Jean',
      last_name: 'Petit',
      email: 'jean.petit@email.com',
      phone: '+33 6 45 67 89 01',
      location: 'Marseille',
      current_position: 'Développeur Frontend Junior',
      experience_years: 1,
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
      education: 'Licence Informatique - Université Aix-Marseille',
      languages: ['Français', 'Anglais (B2)'],
      status: 'new',
      match_score: 45,
      source: 'LinkedIn',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      last_updated: new Date(Date.now() - 259200000).toISOString(),
      pre_selection_status: 'pending',
      salary_expectations: 35000,
      notice_period: '2 semaines',
      availability: 'Immédiate',
      tags: ['React', 'Junior', 'Marseille', 'Startup']
    },
    {
      id: 'demo-005',
      first_name: 'Camille',
      last_name: 'Leroy',
      email: 'camille.leroy@email.com',
      phone: '+33 6 56 78 90 12',
      location: 'Nantes',
      current_position: 'DevOps Engineer',
      experience_years: 6,
      skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Jenkins', 'GitLab CI', 'Prometheus', 'Grafana'],
      education: 'Master Cloud Computing - Centrale Nantes',
      languages: ['Français', 'Anglais (C1)', 'Japonais (N3)'],
      status: 'new',
      match_score: 88,
      source: 'Site web',
      created_at: new Date(Date.now() - 345600000).toISOString(),
      last_updated: new Date(Date.now() - 345600000).toISOString(),
      pre_selection_status: 'pending',
      salary_expectations: 72000,
      notice_period: '1 mois',
      availability: '3 semaines',
      tags: ['DevOps', 'Cloud AWS', 'Senior', 'Nantes', 'Scale-up']
    },
    {
      id: 'demo-006',
      first_name: 'Lucas',
      last_name: 'Moreau',
      email: 'lucas.moreau@email.com',
      phone: '+33 6 67 89 01 23',
      location: 'Remote',
      current_position: 'Software Architect',
      experience_years: 12,
      skills: ['Microservices', 'System Design', 'Java', 'Spring Boot', 'Kafka', 'Redis', 'PostgreSQL', 'Kubernetes'],
      education: 'PhD Informatique - Université Paris-Saclay',
      languages: ['Français', 'Anglais (C2)', 'Chinois (HSK4)'],
      status: 'new',
      match_score: 95,
      source: 'Headhunter',
      created_at: new Date(Date.now() - 432000000).toISOString(),
      last_updated: new Date(Date.now() - 432000000).toISOString(),
      pre_selection_status: 'pending',
      salary_expectations: 95000,
      notice_period: '3 mois',
      availability: '1 mois',
      tags: ['Senior', 'Architect', 'Remote', 'Java', 'Scale-up']
    }
  ], []);

  // Effets
  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, selectedStatus, sortBy, aiFilters, selectedTags]);

  // Mémoization des statistiques
  const statistics = useMemo(() => {
    const totalCandidates = candidates.length;
    const analyzedCount = candidates.filter(c => c.ai_analysis).length;
    const approvedCount = candidates.filter(c => c.pre_selection_status === 'ai_approved').length;
    const rejectedCount = candidates.filter(c => c.pre_selection_status === 'ai_rejected').length;
    const pendingCount = candidates.filter(c => c.pre_selection_status === 'pending').length;
    
    const averageScore = candidates.length > 0 
      ? candidates.reduce((acc, c) => acc + (c.ai_analysis?.match_score || c.match_score), 0) / candidates.length 
      : 0;
    
    const highPotentialCount = candidates.filter(c => 
      (c.ai_analysis?.match_score || c.match_score) >= 85
    ).length;

    return {
      totalCandidates,
      analyzedCount,
      approvedCount,
      rejectedCount,
      pendingCount,
      averageScore: Math.round(averageScore),
      highPotentialCount,
      analyzedPercentage: totalCandidates > 0 ? Math.round((analyzedCount / totalCandidates) * 100) : 0
    };
  }, [candidates]);

  // Récupération des candidats
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const candidatesWithScore = data.map(candidate => ({
          ...candidate,
          match_score: candidate.ai_analysis?.match_score || calculateMatchScore(candidate)
        }));
        setCandidates(candidatesWithScore as Candidate[]);
      } else {
        setCandidates(demoCandidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates(demoCandidates);
      toast.info('Utilisation des données de démonstration enrichies');
    } finally {
      setLoading(false);
    }
  };

  // Calcul du score de match
  const calculateMatchScore = useCallback((candidate: any): number => {
    let score = 50;
    if (candidate.experience_years > 5) score += 20;
    else if (candidate.experience_years > 2) score += 10;
    
    if (candidate.skills?.length > 5) score += 15;
    else if (candidate.skills?.length > 3) score += 8;
    
    if (candidate.education?.toLowerCase().includes('master') || 
        candidate.education?.toLowerCase().includes('ingénieur') ||
        candidate.education?.toLowerCase().includes('phd')) {
      score += 15;
    } else if (candidate.education?.toLowerCase().includes('licence') ||
              candidate.education?.toLowerCase().includes('bachelor')) {
      score += 5;
    }
    
    // Bonus pour compétences rares
    const rareSkills = ['Kubernetes', 'Terraform', 'GraphQL', 'Machine Learning', 'DevOps'];
    const rareSkillCount = candidate.skills?.filter((skill: string) => 
      rareSkills.some(rare => skill.toLowerCase().includes(rare.toLowerCase()))
    ).length || 0;
    
    score += rareSkillCount * 3;
    
    return Math.min(100, score);
  }, []);

  // Analyse IA améliorée
  const simulateAIAnalysis = async (candidate: Candidate, jobRequirements: JobOffer): Promise<AIAnalysisResult> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const requiredSkills = jobRequirements.requiredSkills || [];
    const preferredSkills = jobRequirements.preferredSkills || [];
    const candidateSkills = candidate.skills || [];
    
    // Calcul du score de correspondance
    const skillMatches = candidateSkills.filter(skill => 
      requiredSkills.some(req => skill.toLowerCase().includes(req.toLowerCase()) || 
                                 req.toLowerCase().includes(skill.toLowerCase()))
    );
    
    const preferredMatches = candidateSkills.filter(skill => 
      preferredSkills.some(pref => skill.toLowerCase().includes(pref.toLowerCase()) || 
                                   pref.toLowerCase().includes(skill.toLowerCase()))
    );
    
    const skillMatchPercentage = requiredSkills.length > 0 
      ? (skillMatches.length / requiredSkills.length) * 100 
      : 0;
    
    const missingSkills = requiredSkills.filter(skill => 
      !candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
    );
    
    // Score basé sur plusieurs facteurs
    const experienceScore = Math.min(candidate.experience_years * 8, 40);
    const skillScore = skillMatchPercentage * 0.4;
    const preferredBonus = preferredMatches.length * 3;
    
    const educationBonus = (candidate.education || '').toLowerCase().includes('phd') ? 20 :
                          (candidate.education || '').toLowerCase().includes('master') ? 15 : 
                          (candidate.education || '').toLowerCase().includes('ingénieur') ? 15 : 
                          (candidate.education || '').toLowerCase().includes('licence') ? 5 : 0;
    
    const baseScore = experienceScore + skillScore + educationBonus + preferredBonus;
    
    // Ajustement selon l'urgence du poste
    const urgencyMultiplier = jobRequirements.urgency === 'high' ? 1.1 : 
                             jobRequirements.urgency === 'medium' ? 1.0 : 0.9;
    
    const adjustedScore = Math.min(100, baseScore * urgencyMultiplier + 10);
    
    // Détection de drapeaux rouges avancée
    const redFlags: string[] = [];
    if (candidate.experience_years < 2 && jobRequirements.experienceRange?.[0] > 3) {
      redFlags.push('Expérience insuffisante pour le poste');
    }
    if ((candidate.skills || []).length < requiredSkills.length * 0.5) {
      redFlags.push('Compétences techniques insuffisantes');
    }
    if (candidate.education === '') {
      redFlags.push('Formation académique non spécifiée');
    }
    if (candidate.salary_expectations && jobRequirements.salaryRange?.[1] && 
        candidate.salary_expectations > jobRequirements.salaryRange[1] * 1.2) {
      redFlags.push('Prétentions salariales trop élevées');
    }
    if (candidate.notice_period === '3 mois' && jobRequirements.urgency === 'high') {
      redFlags.push('Préavis trop long pour l\'urgence du poste');
    }

    // Calcul des métriques supplémentaires
    const cultural_fit = 60 + Math.random() * 30;
    const growth_potential = candidate.experience_years < 5 ? 70 + Math.random() * 25 : 50 + Math.random() * 40;
    const technical_depth = candidate.skills?.length > 8 ? 80 + Math.random() * 15 : 50 + Math.random() * 40;
    
    // Recommandations contextuelles
    const recommendations: string[] = [];
    if (adjustedScore >= 85) {
      recommendations.push('Top candidat - À prioriser pour entretien');
    } else if (adjustedScore >= 70) {
      recommendations.push('Bon profil - À considérer sérieusement');
    } else if (adjustedScore >= 50) {
      recommendations.push('Profil moyen - À évaluer selon besoins spécifiques');
    }
    
    if (missingSkills.length > 0) {
      recommendations.push(`Formation recommandée sur: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    
    if (cultural_fit > 80) {
      recommendations.push('Excellent fit culturel détecté');
    }
    
    if (growth_potential > 75 && candidate.experience_years < 8) {
      recommendations.push('Fort potentiel de croissance identifié');
    }

    return {
      match_score: Math.round(adjustedScore),
      skills_match: [...skillMatches, ...preferredMatches].slice(0, 8),
      missing_skills: missingSkills.slice(0, 5),
      experience_rating: Math.min(5, Math.ceil(candidate.experience_years / 3)),
      red_flags: redFlags,
      recommendations: recommendations,
      confidence_score: 85 + Math.random() * 10,
      cultural_fit: Math.round(cultural_fit),
      growth_potential: Math.round(growth_potential),
      technical_depth: Math.round(technical_depth)
    };
  };

  // Analyse d'un candidat
  const analyzeCandidateWithAI = async (candidateId: string) => {
    if (analyzingCandidate === candidateId) return;
    
    setAnalyzingCandidate(candidateId);
    try {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) return;

      const job = activeJobs.find(j => j.id === selectedJob);
      if (!job) return;
      
      toast.loading('Analyse IA approfondie en cours...', { 
        id: `ai-analysis-${candidateId}`,
        duration: 3000 
      });
      
      const analysis = await simulateAIAnalysis(candidate, job);
      
      const updatedCandidate = {
        ...candidate,
        ai_analysis: {
          ...analysis,
          analyzed_at: new Date().toISOString()
        },
        match_score: analysis.match_score,
        pre_selection_status: analysis.match_score >= aiFilters.minScore ? 'ai_approved' : 'ai_rejected'
      };

      setCandidates(prev => prev.map(c => 
        c.id === candidateId ? updatedCandidate : c
      ));
      
      toast.success(`✅ Analyse terminée - Score: ${analysis.match_score}/100`, { 
        id: `ai-analysis-${candidateId}`,
        duration: 3000,
        icon: '🎯'
      });
      
    } catch (error) {
      console.error('Error analyzing candidate:', error);
      toast.error('❌ Erreur lors de l\'analyse IA', { 
        id: `ai-analysis-${candidateId}`,
        duration: 3000 
      });
    } finally {
      setAnalyzingCandidate(null);
    }
  };

  // Analyse en lot intelligente
  const analyzeBatchWithAI = async () => {
    if (aiProcessing) return;
    
    setAiProcessing(true);
    const processingToast = toast.loading('🔍 Analyse IA en lot démarrée...', { 
      id: 'batch-analysis',
      duration: 10000 
    });
    
    try {
      const job = activeJobs.find(j => j.id === selectedJob);
      if (!job) return;
      
      // Prioriser les candidats non analysés avec meilleur score potentiel
      const candidatesToAnalyze = candidates
        .filter(c => !c.ai_analysis)
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 8);
      
      if (candidatesToAnalyze.length === 0) {
        toast.success('✅ Tous les candidats ont déjà été analysés', { 
          id: 'batch-analysis',
          duration: 3000 
        });
        return;
      }
      
      let processed = 0;
      const results = [];
      
      for (const candidate of candidatesToAnalyze) {
        try {
          const analysis = await simulateAIAnalysis(candidate, job);
          
          const updatedCandidate = {
            ...candidate,
            ai_analysis: {
              ...analysis,
              analyzed_at: new Date().toISOString()
            },
            match_score: analysis.match_score,
            pre_selection_status: analysis.match_score >= aiFilters.minScore ? 'ai_approved' : 'ai_rejected'
          };
          
          setCandidates(prev => prev.map(c => 
            c.id === candidate.id ? updatedCandidate : c
          ));
          
          results.push({
            id: candidate.id,
            name: `${candidate.first_name} ${candidate.last_name}`,
            score: analysis.match_score,
            status: analysis.match_score >= aiFilters.minScore ? 'Approuvé' : 'Rejeté'
          });
          
          processed++;
          
          // Mettre à jour le toast avec progression
          toast.loading(`📊 Analyse en cours... ${processed}/${candidatesToAnalyze.length}`, { 
            id: 'batch-analysis',
            duration: 10000 
          });
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error analyzing ${candidate.first_name}:`, error);
        }
      }
      
      // Résumé de l'analyse
      const approved = results.filter(r => r.status === 'Approuvé').length;
      const averageScore = results.reduce((acc, r) => acc + r.score, 0) / results.length;
      
      toast.success(`🎯 Analyse terminée: ${approved}/${processed} candidats approuvés | Score moyen: ${Math.round(averageScore)}/100`, { 
        id: 'batch-analysis',
        duration: 5000 
      });
      
    } catch (error) {
      console.error('Error in batch analysis:', error);
      toast.error('❌ Erreur lors de l\'analyse en lot', { 
        id: 'batch-analysis',
        duration: 3000 
      });
    } finally {
      setAiProcessing(false);
    }
  };

  // Application des filtres IA
  const applyAIFilters = useCallback(() => {
    setLoading(true);
    try {
      const filtered = candidates.filter(candidate => {
        // Filtre par score IA
        if (candidate.match_score < aiFilters.minScore) return false;
        
        // Filtre par expérience
        if (candidate.experience_years < aiFilters.minExperience) return false;
        if (aiFilters.maxExperience && candidate.experience_years > aiFilters.maxExperience) return false;
        
        // Filtre par compétences requises
        if (aiFilters.requiredSkills.length > 0) {
          const hasRequiredSkills = aiFilters.requiredSkills.every(reqSkill =>
            candidate.skills?.some(skill => 
              skill.toLowerCase().includes(reqSkill.toLowerCase())
            )
          );
          if (!hasRequiredSkills) return false;
        }
        
        // Exclure les drapeaux rouges
        if (aiFilters.excludeRedFlags && candidate.ai_analysis?.red_flags?.length > 2) {
          return false;
        }
        
        // Fit culturel minimum
        if (aiFilters.culturalFitMin && (candidate.ai_analysis?.cultural_fit || 50) < aiFilters.culturalFitMin) {
          return false;
        }
        
        // Filtre par tags
        if (selectedTags.length > 0 && candidate.tags) {
          const hasSelectedTags = selectedTags.every(tag => 
            candidate.tags?.includes(tag)
          );
          if (!hasSelectedTags) return false;
        }
        
        // Filtre par localisation
        if (aiFilters.locationFilter && candidate.location !== aiFilters.locationFilter) {
          return false;
        }
        
        return true;
      });
      
      setFilteredCandidates(filtered);
      
      toast.success(`✅ ${filtered.length} candidats pré-sélectionnés par l'IA`, {
        duration: 3000,
        icon: '🎯'
      });
      
    } catch (error) {
      console.error('Error applying AI filters:', error);
      toast.error('❌ Erreur lors de l\'application des filtres IA', {
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [candidates, aiFilters, selectedTags]);

  // Filtrage principal
  const filterCandidates = useCallback(() => {
    let filtered = [...candidates];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(candidate =>
        candidate.first_name?.toLowerCase().includes(term) ||
        candidate.last_name?.toLowerCase().includes(term) ||
        candidate.email?.toLowerCase().includes(term) ||
        candidate.current_position?.toLowerCase().includes(term) ||
        candidate.location?.toLowerCase().includes(term) ||
        candidate.skills?.some((skill: string) => skill.toLowerCase().includes(term)) ||
        candidate.ai_analysis?.skills_match?.some((skill: string) => skill.toLowerCase().includes(term)) ||
        candidate.tags?.some((tag: string) => tag.toLowerCase().includes(term))
      );
    }

    // Filtre par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(candidate => candidate.pre_selection_status === selectedStatus);
    }

    // Application des filtres IA
    filtered = filtered.filter(candidate => {
      if (candidate.match_score < aiFilters.minScore) return false;
      if (candidate.experience_years < aiFilters.minExperience) return false;
      if (aiFilters.maxExperience && candidate.experience_years > aiFilters.maxExperience) return false;
      if (aiFilters.excludeRedFlags && candidate.ai_analysis?.red_flags?.length > 2) return false;
      if (aiFilters.culturalFitMin && (candidate.ai_analysis?.cultural_fit || 50) < aiFilters.culturalFitMin) return false;
      return true;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'ai_score':
          return (b.ai_analysis?.match_score || b.match_score) - (a.ai_analysis?.match_score || a.match_score);
        case 'experience':
          return b.experience_years - a.experience_years;
        case 'recent_analysis':
          if (!a.ai_analysis?.analyzed_at) return 1;
          if (!b.ai_analysis?.analyzed_at) return -1;
          return new Date(b.ai_analysis.analyzed_at).getTime() - new Date(a.ai_analysis.analyzed_at).getTime();
        case 'cultural_fit':
          return (b.ai_analysis?.cultural_fit || 50) - (a.ai_analysis?.cultural_fit || 50);
        case 'growth_potential':
          return (b.ai_analysis?.growth_potential || 50) - (a.ai_analysis?.growth_potential || 50);
        case 'name':
          return (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, selectedStatus, sortBy, aiFilters]);

  // Fonctions utilitaires
  const getPreSelectionStatusColor = (status: string) => {
    switch (status) {
      case 'ai_approved': return 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200';
      case 'ai_reviewed': return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200';
      case 'manual_review': return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200';
      case 'ai_rejected': return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200';
      case 'pending': return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
      default: return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
    }
  };

  const getPreSelectionStatusIcon = (status: string) => {
    switch (status) {
      case 'ai_approved': return <CheckCircle className="w-4 h-4" />;
      case 'ai_reviewed': return <Brain className="w-4 h-4" />;
      case 'manual_review': return <Eye className="w-4 h-4" />;
      case 'ai_rejected': return <XCircle className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-white bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400';
    if (score >= 70) return 'text-white bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-400';
    if (score >= 55) return 'text-white bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400';
    return 'text-white bg-gradient-to-br from-red-500 to-rose-600 border-red-400';
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (value >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (value >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const exportCandidates = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Nom,Prénom,Email,Téléphone,Poste,Expérience,Score IA,Fit Culturel,Potentiel,Profondeur Technique,Statut IA,Compétences correspondantes,Drapeaux rouges,Tags"].join(",") + "\n"
      + candidates.map(c => 
        `${c.last_name},${c.first_name},${c.email},${c.phone},${c.current_position},${c.experience_years},${c.ai_analysis?.match_score || c.match_score},${c.ai_analysis?.cultural_fit || ''},${c.ai_analysis?.growth_potential || ''},${c.ai_analysis?.technical_depth || ''},${c.pre_selection_status},${c.ai_analysis?.skills_match?.join(';') || ''},${c.ai_analysis?.red_flags?.join(';') || ''},${c.tags?.join(';') || ''}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `candidats_ai_analyse_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('📊 Export CSV avec analyse IA complète généré', {
      duration: 3000,
      icon: '✅'
    });
  };

  const resetFilters = () => {
    setAiFilters({
      minScore: 70,
      requiredSkills: [],
      minExperience: 3,
      excludeRedFlags: true,
      culturalFitMin: 60,
    });
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedTags([]);
    toast.success('🔄 Filtres réinitialisés', {
      duration: 2000
    });
  };

  // Fonction pour ouvrir le formulaire d'entretien
  const openInterviewForm = (candidate: Candidate) => {
    const job = activeJobs.find(j => j.id === selectedJob);
    setInterviewFormData({
      candidateId: candidate.id,
      candidateName: `${candidate.first_name} ${candidate.last_name}`,
      jobTitle: job?.title || candidate.current_position || '',
      interviewDate: new Date().toISOString().split('T')[0],
      interviewTime: '14:00',
      interviewType: 'video',
      interviewers: [''],
      duration: 60,
      location: candidate.location,
      meetingLink: '',
      notes: '',
      questionsToAsk: [''],
      topicsToCover: [''],
      sendInvitation: true,
      reminderEmails: true
    });
    setShowInterviewForm(true);
    setSelectedCandidate(null); // Fermer le modal d'analyse
  };

  // Gestionnaire pour le formulaire d'entretien
  const handleInterviewFormChange = (field: string, value: any) => {
    setInterviewFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Ajouter un interviewer
  const addInterviewer = () => {
    setInterviewFormData(prev => ({
      ...prev,
      interviewers: [...prev.interviewers, '']
    }));
  };

  // Supprimer un interviewer
  const removeInterviewer = (index: number) => {
    setInterviewFormData(prev => ({
      ...prev,
      interviewers: prev.interviewers.filter((_, i) => i !== index)
    }));
  };

  // Mettre à jour un interviewer
  const updateInterviewer = (index: number, value: string) => {
    const newInterviewers = [...interviewFormData.interviewers];
    newInterviewers[index] = value;
    setInterviewFormData(prev => ({
      ...prev,
      interviewers: newInterviewers
    }));
  };

  // Ajouter une question
  const addQuestion = () => {
    setInterviewFormData(prev => ({
      ...prev,
      questionsToAsk: [...prev.questionsToAsk, '']
    }));
  };

  // Supprimer une question
  const removeQuestion = (index: number) => {
    setInterviewFormData(prev => ({
      ...prev,
      questionsToAsk: prev.questionsToAsk.filter((_, i) => i !== index)
    }));
  };

  // Mettre à jour une question
  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...interviewFormData.questionsToAsk];
    newQuestions[index] = value;
    setInterviewFormData(prev => ({
      ...prev,
      questionsToAsk: newQuestions
    }));
  };

  // Ajouter un sujet
  const addTopic = () => {
    setInterviewFormData(prev => ({
      ...prev,
      topicsToCover: [...prev.topicsToCover, '']
    }));
  };

  // Supprimer un sujet
  const removeTopic = (index: number) => {
    setInterviewFormData(prev => ({
      ...prev,
      topicsToCover: prev.topicsToCover.filter((_, i) => i !== index)
    }));
  };

  // Mettre à jour un sujet
  const updateTopic = (index: number, value: string) => {
    const newTopics = [...interviewFormData.topicsToCover];
    newTopics[index] = value;
    setInterviewFormData(prev => ({
      ...prev,
      topicsToCover: newTopics
    }));
  };

  // Soumettre le formulaire d'entretien
  const handleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Valider les champs requis
      if (!interviewFormData.interviewDate || !interviewFormData.interviewTime) {
        toast.error('Veuillez sélectionner une date et une heure pour l\'entretien');
        return;
      }

      if (interviewFormData.interviewers.filter(i => i.trim() !== '').length === 0) {
        toast.error('Veuillez ajouter au moins un interviewer');
        return;
      }

      // Simuler l'envoi (à remplacer par votre logique d'API)
      toast.loading('Planification de l\'entretien en cours...', { id: 'interview-scheduling' });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Ici, vous pouvez envoyer les données à votre backend
      console.log('Interview scheduled:', interviewFormData);
      
      // Envoyer l'invitation si demandé
      if (interviewFormData.sendInvitation) {
        // Logique d'envoi d'email
        console.log('Sending invitation to candidate and interviewers');
      }
      
      toast.success('✅ Entretien planifié avec succès !', {
        id: 'interview-scheduling',
        duration: 4000
      });
      
      setShowInterviewForm(false);
      
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast.error('❌ Erreur lors de la planification', {
        id: 'interview-scheduling',
        duration: 4000
      });
    }
  };

  // Panneau de statistiques amélioré
  const renderStatsPanel = () => (
    <div className="p-5 mb-6 border bg-gradient-to-br from-white to-slate-50 border-slate-200/70 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
            <BarChart3 className="text-white w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Dashboard d'Analyse IA</h3>
            <p className="text-sm text-slate-600">Statistiques en temps réel de votre pool de candidats</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center px-4 py-2 space-x-2 font-medium transition-all rounded-lg bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 hover:from-slate-200 hover:to-gray-200"
          >
            {viewMode === 'grid' ? 'Liste' : 'Grille'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
        <div className="p-4 border bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statistics.totalCandidates}</p>
          <p className="text-sm text-slate-600">Candidats</p>
        </div>
        
        <div className="p-4 border bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">Approuvés</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statistics.approvedCount}</p>
          <p className="text-sm text-slate-600">Par IA</p>
        </div>
        
        <div className="p-4 border bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">Score moyen</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statistics.averageScore}</p>
          <p className="text-sm text-slate-600">/100</p>
        </div>
        
        <div className="p-4 border bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <span className="text-xs font-medium text-violet-600">Top potentiel</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statistics.highPotentialCount}</p>
          <p className="text-sm text-slate-600">≥ 85/100</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          <span className="font-medium">{statistics.analyzedPercentage}%</span> analysés par IA
        </div>
        <button
          onClick={analyzeBatchWithAI}
          disabled={aiProcessing || statistics.analyzedPercentage === 100}
          className="flex items-center px-4 py-2 space-x-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
        >
          <Brain className="w-4 h-4" />
          <span>{aiProcessing ? 'Analyse en cours...' : 'Analyser tout'}</span>
        </button>
      </div>
    </div>
  );

  // Panneau de contrôle IA amélioré
  const renderAIAnalysisPanel = () => (
    <div className="p-5 mb-6 border shadow-sm bg-gradient-to-br from-white to-blue-50 border-blue-200/50 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
            <Brain className="text-white w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">Pré-sélection Intelligente par IA</h3>
            <p className="text-sm text-blue-700">Analyse automatique des CV avec métriques avancées</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
            <Shield className="inline w-4 h-4 mr-1" />
            IA Avancée
          </span>
        </div>
      </div>

      {/* Filtres rapides */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            <Target className="inline w-4 h-4 mr-1" />
            Score IA ({aiFilters.minScore})
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={aiFilters.minScore}
            onChange={(e) => setAiFilters({...aiFilters, minScore: parseInt(e.target.value)})}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            <Briefcase className="inline w-4 h-4 mr-1" />
            Expérience ({aiFilters.minExperience} ans)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="0"
              max="20"
              value={aiFilters.minExperience}
              onChange={(e) => setAiFilters({...aiFilters, minExperience: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Min"
            />
            <input
              type="number"
              min="0"
              max="20"
              value={aiFilters.maxExperience || ''}
              onChange={(e) => setAiFilters({...aiFilters, maxExperience: parseInt(e.target.value) || undefined})}
              className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Max"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            <Users className="inline w-4 h-4 mr-1" />
            Fit Culturel ({aiFilters.culturalFitMin || 60}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={aiFilters.culturalFitMin || 60}
            onChange={(e) => setAiFilters({...aiFilters, culturalFitMin: parseInt(e.target.value)})}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-emerald-200 to-teal-200"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="excludeRedFlags"
              checked={aiFilters.excludeRedFlags}
              onChange={(e) => setAiFilters({...aiFilters, excludeRedFlags: e.target.checked})}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="excludeRedFlags" className="text-sm font-medium text-slate-700">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              Exclure drapeaux rouges
            </label>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {showAdvancedFilters ? 'Moins de filtres' : 'Plus de filtres'} →
          </button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvancedFilters && (
        <div className="p-4 mb-6 border bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200/50 rounded-xl">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Filtres Avancés</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Offre d'emploi
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {activeJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} {job.urgency === 'high' && '🚨'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 hover:from-slate-200 hover:to-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Localisation
              </label>
              <select
                value={aiFilters.locationFilter || ''}
                onChange={(e) => setAiFilters({...aiFilters, locationFilter: e.target.value || undefined})}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes</option>
                <option value="Paris">Paris</option>
                <option value="Lyon">Lyon</option>
                <option value="Marseille">Marseille</option>
                <option value="Nantes">Nantes</option>
                <option value="Bordeaux">Bordeaux</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={analyzeBatchWithAI}
          disabled={aiProcessing}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-blue-500/25"
        >
          <Sparkles className="w-5 h-5" />
          <span>{aiProcessing ? 'Analyse en cours...' : 'Analyse IA en lot'}</span>
        </button>
        
        <button
          onClick={applyAIFilters}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-500/25"
        >
          <Filter className="w-5 h-5" />
          <span>Appliquer les filtres IA</span>
        </button>
        
        <button
          onClick={exportCandidates}
          className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all flex items-center space-x-2 shadow-lg shadow-violet-500/25"
        >
          <Download className="w-5 h-5" />
          <span>Export complet</span>
        </button>
        
        <button
          onClick={resetFilters}
          className="px-5 py-2.5 bg-gradient-to-r from-slate-200 to-gray-200 text-slate-700 font-medium rounded-lg hover:from-slate-300 hover:to-gray-300 transition-all flex items-center space-x-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Réinitialiser</span>
        </button>
      </div>
    </div>
  );

  // Formulaire d'entretien
  const renderInterviewForm = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-lg border-slate-200/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <Video className="text-white w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Planifier un entretien</h3>
              <p className="text-sm text-slate-600">
                {interviewFormData.candidateName} • {interviewFormData.jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInterviewForm(false)}
            className="p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleInterviewSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-8">
            {/* Informations de base */}
            <div className="p-6 border bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200/50 rounded-xl">
              <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-blue-900">
                <Calendar className="w-5 h-5" />
                <span>Date et heure</span>
              </h4>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Date de l'entretien *
                  </label>
                  <input
                    type="date"
                    required
                    value={interviewFormData.interviewDate}
                    onChange={(e) => handleInterviewFormChange('interviewDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Heure de l'entretien *
                  </label>
                  <input
                    type="time"
                    required
                    value={interviewFormData.interviewTime}
                    onChange={(e) => handleInterviewFormChange('interviewTime', e.target.value)}
                    className="w-full px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Type d'entretien */}
            <div className="p-6 border bg-gradient-to-br from-violet-50/50 to-purple-50/50 border-violet-200/50 rounded-xl">
              <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-violet-900">
                <Video className="w-5 h-5" />
                <span>Type d'entretien</span>
              </h4>
              
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleInterviewFormChange('interviewType', 'video')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                    interviewFormData.interviewType === 'video'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Video className={`w-6 h-6 ${interviewFormData.interviewType === 'video' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${interviewFormData.interviewType === 'video' ? 'text-blue-700' : 'text-slate-600'}`}>
                    Visioconférence
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInterviewFormChange('interviewType', 'phone')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                    interviewFormData.interviewType === 'phone'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Phone className={`w-6 h-6 ${interviewFormData.interviewType === 'phone' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${interviewFormData.interviewType === 'phone' ? 'text-blue-700' : 'text-slate-600'}`}>
                    Téléphonique
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInterviewFormChange('interviewType', 'in_person')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                    interviewFormData.interviewType === 'in_person'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Users className={`w-6 h-6 ${interviewFormData.interviewType === 'in_person' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${interviewFormData.interviewType === 'in_person' ? 'text-blue-700' : 'text-slate-600'}`}>
                    En présentiel
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Durée (minutes)
                  </label>
                  <select
                    value={interviewFormData.duration}
                    onChange={(e) => handleInterviewFormChange('duration', parseInt(e.target.value))}
                    className="w-full px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 heure</option>
                    <option value={90}>1 heure 30</option>
                    <option value={120}>2 heures</option>
                  </select>
                </div>

                {interviewFormData.interviewType === 'in_person' ? (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">
                      Lieu
                    </label>
                    <input
                      type="text"
                      value={interviewFormData.location || ''}
                      onChange={(e) => handleInterviewFormChange('location', e.target.value)}
                      placeholder="Ex: Bureau Paris, Salle de réunion A"
                      className="w-full px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700">
                      Lien de réunion
                    </label>
                    <input
                      type="url"
                      value={interviewFormData.meetingLink || ''}
                      onChange={(e) => handleInterviewFormChange('meetingLink', e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Interviewers */}
            <div className="p-6 border bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center space-x-2 text-lg font-semibold text-amber-900">
                  <Users className="w-5 h-5" />
                  <span>Interviewers</span>
                </h4>
                <button
                  type="button"
                  onClick={addInterviewer}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {interviewFormData.interviewers.map((interviewer, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={interviewer}
                      onChange={(e) => updateInterviewer(index, e.target.value)}
                      placeholder={`Email de l'interviewer ${index + 1}`}
                      className="flex-1 px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {interviewFormData.interviewers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInterviewer(index)}
                        className="p-3 text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Questions et sujets */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Questions à poser */}
              <div className="p-6 border bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border-emerald-200/50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center space-x-2 text-lg font-semibold text-emerald-900">
                    <MessageSquare className="w-5 h-5" />
                    <span>Questions à poser</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {interviewFormData.questionsToAsk.map((question, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => updateQuestion(index, e.target.value)}
                        placeholder={`Question ${index + 1}`}
                        className="flex-1 px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {interviewFormData.questionsToAsk.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="p-3 text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sujets à aborder */}
              <div className="p-6 border bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200/50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center space-x-2 text-lg font-semibold text-blue-900">
                    <Target className="w-5 h-5" />
                    <span>Sujets à aborder</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addTopic}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {interviewFormData.topicsToCover.map((topic, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => updateTopic(index, e.target.value)}
                        placeholder={`Sujet ${index + 1}`}
                        className="flex-1 px-4 py-3 transition-all bg-white border outline-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {interviewFormData.topicsToCover.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTopic(index)}
                          className="p-3 text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="p-6 border bg-gradient-to-br from-slate-50/50 to-gray-50/50 border-slate-200/50 rounded-xl">
              <h4 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-slate-900">
                <FileText className="w-5 h-5" />
                <span>Notes additionnelles</span>
              </h4>
              <textarea
                value={interviewFormData.notes}
                onChange={(e) => handleInterviewFormChange('notes', e.target.value)}
                rows={4}
                placeholder="Informations supplémentaires, points d'attention, etc."
                className="w-full px-4 py-3 transition-all bg-white border outline-none resize-none border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Options */}
            <div className="p-6 bg-white border border-slate-200/70 rounded-xl">
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={interviewFormData.sendInvitation}
                    onChange={(e) => handleInterviewFormChange('sendInvitation', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Envoyer une invitation par email au candidat
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={interviewFormData.reminderEmails}
                    onChange={(e) => handleInterviewFormChange('reminderEmails', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Envoyer des rappels automatiques (24h et 1h avant)
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-6 space-x-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowInterviewForm(false)}
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
                <span>Planifier l'entretien</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  // Carte candidat améliorée
  const renderCandidateCard = (candidate: Candidate) => (
    <div 
      key={candidate.id} 
      className={`group relative bg-gradient-to-br from-white to-slate-50 border ${
        candidate.pre_selection_status === 'ai_approved' 
          ? 'border-emerald-200/70 hover:border-emerald-300 shadow-emerald-100/50' 
          : candidate.pre_selection_status === 'ai_rejected'
          ? 'border-red-200/70 hover:border-red-300 shadow-red-100/50'
          : 'border-slate-200/70 hover:border-blue-200'
      } rounded-xl p-5 hover:shadow-xl transition-all duration-300 cursor-pointer shadow-sm`}
      onClick={() => setSelectedCandidate(candidate)}
    >
      {/* Badge IA */}
      {candidate.ai_analysis && (
        <div className="absolute -top-3 -left-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium flex items-center space-x-1 shadow-lg">
          <Brain className="w-3 h-3" />
          <span>IA</span>
        </div>
      )}

      {/* Badge de score IA */}
      <div className={`absolute -top-3 -right-3 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-lg ${getScoreColor(candidate.match_score)}`}>
        <span className="text-lg font-bold">{candidate.ai_analysis?.match_score || candidate.match_score}</span>
        <span className="text-[9px] opacity-90">IA</span>
      </div>
      
      {/* En-tête */}
      <div className="flex items-start mb-4 space-x-4">
        <div className="flex items-center justify-center w-16 h-16 shadow-lg rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
          <span className="text-xl font-bold text-white">
            {candidate.first_name?.charAt(0)}{candidate.last_name?.charAt(0)}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate transition-colors text-slate-900 group-hover:text-blue-700">
                {candidate.first_name} {candidate.last_name}
              </h3>
              <p className="text-sm truncate text-slate-600">{candidate.current_position}</p>
            </div>
            <ChevronRight className="flex-shrink-0 w-5 h-5 transition-all text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1" />
          </div>
          
          <div className="flex items-center mt-2 space-x-2">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center space-x-1.5 border ${getPreSelectionStatusColor(candidate.pre_selection_status || 'pending')}`}>
              {getPreSelectionStatusIcon(candidate.pre_selection_status || 'pending')}
              <span className="truncate">{candidate.pre_selection_status || 'Non analysé'}</span>
            </span>
            
            {candidate.ai_analysis?.analyzed_at && (
              <span className="flex-shrink-0 text-xs text-slate-400">
                {new Date(candidate.ai_analysis.analyzed_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Tags */}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {candidate.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200/50"
              >
                {tag}
              </span>
            ))}
            {candidate.tags.length > 3 && (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                +{candidate.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Analyse IA rapide */}
      {candidate.ai_analysis && (
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className={`text-center px-2 py-1.5 rounded-lg border ${getMetricColor(candidate.ai_analysis.cultural_fit)}`}>
              <div className="text-xs font-medium">Culture</div>
              <div className="text-sm font-bold">{candidate.ai_analysis.cultural_fit}%</div>
            </div>
            <div className={`text-center px-2 py-1.5 rounded-lg border ${getMetricColor(candidate.ai_analysis.growth_potential)}`}>
              <div className="text-xs font-medium">Potentiel</div>
              <div className="text-sm font-bold">{candidate.ai_analysis.growth_potential}%</div>
            </div>
            <div className={`text-center px-2 py-1.5 rounded-lg border ${getMetricColor(candidate.ai_analysis.technical_depth)}`}>
              <div className="text-xs font-medium">Technique</div>
              <div className="text-sm font-bold">{candidate.ai_analysis.technical_depth}%</div>
            </div>
          </div>
          
          {candidate.ai_analysis.red_flags?.length > 0 && (
            <div className="flex items-start space-x-1 text-xs text-red-600 bg-gradient-to-r from-red-50 to-rose-50 px-2 py-1.5 rounded-lg border border-red-200/50">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{candidate.ai_analysis.red_flags.length} drapeau(x) rouge(s)</span>
            </div>
          )}
        </div>
      )}
      
      {/* Informations de contact */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Mail className="flex-shrink-0 w-4 h-4 text-slate-400" />
          <span className="truncate">{candidate.email}</span>
        </div>
        <div className="flex items-center justify-between">
          {candidate.location && (
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <MapPin className="flex-shrink-0 w-4 h-4 text-slate-400" />
              <span className="truncate">{candidate.location}</span>
            </div>
          )}
          {candidate.experience_years > 0 && (
            <div className="flex items-center space-x-1 text-sm text-slate-600">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{candidate.experience_years} ans</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Compétences */}
      <div className="mb-4">
        <div className="flex items-center mb-2 space-x-2">
          <Award className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Compétences clés</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {candidate.skills?.slice(0, 3).map((skill: string, index: number) => (
            <span 
              key={index}
              className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200/50"
            >
              {skill}
            </span>
          ))}
          {candidate.skills?.length > 3 && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
              +{candidate.skills.length - 3}
            </span>
          )}
        </div>
      </div>
      
      {/* Actions IA */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          {candidate.salary_expectations && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>{candidate.salary_expectations.toLocaleString()}€</span>
            </div>
          )}
          {candidate.availability && (
            <div className="flex items-center space-x-1">
              <CalendarDays className="w-3 h-3" />
              <span>{candidate.availability}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!candidate.ai_analysis && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                analyzeCandidateWithAI(candidate.id);
              }}
              disabled={analyzingCandidate === candidate.id}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center space-x-1 shadow-md"
            >
              <Bot className="w-3 h-3" />
              <span>{analyzingCandidate === candidate.id ? 'Analyse...' : 'Analyser IA'}</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidate(candidate);
            }}
            className="px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Détails
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-lg font-medium text-slate-700">Chargement des candidats...</p>
        <p className="mt-2 text-sm text-slate-500">Analyse IA en préparation</p>
      </div>
    );
  }

  return (
    <div className="pb-12 space-y-6">
      {/* Dashboard de statistiques */}
      {renderStatsPanel()}

      {/* Panneau de contrôle IA */}
      {renderAIAnalysisPanel()}

      {/* Barre de filtres avancée */}
      <div className="p-5 border shadow-sm bg-gradient-to-r from-white to-slate-50 border-slate-200/70 rounded-xl">
        <div className="flex flex-col gap-4 mb-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-5 h-5 -translate-y-1/2 left-4 top-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, poste, compétence, tag ou localisation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Filter className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-10 pr-8 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none appearance-none min-w-[180px]"
              >
                <option value="all">📋 Tous les statuts</option>
                <option value="pending">⏳ Non analysés</option>
                <option value="ai_reviewed">🤖 Analysés par IA</option>
                <option value="ai_approved">✅ Approuvés par IA</option>
                <option value="ai_rejected">❌ Rejetés par IA</option>
                <option value="manual_review">👁️ Examen manuel</option>
              </select>
            </div>
            
            <div className="relative">
              <TrendingUp className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none appearance-none min-w-[180px]"
              >
                <option value="ai_score">🎯 Score IA décroissant</option>
                <option value="experience">💼 Expérience décroissante</option>
                <option value="cultural_fit">🤝 Fit culturel décroissant</option>
                <option value="growth_potential">🚀 Potentiel décroissant</option>
                <option value="recent_analysis">🕒 Dernière analyse</option>
                <option value="name">🔤 Nom A-Z</option>
                <option value="newest">🆕 Plus récent</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Statistiques et tags actifs */}
        <div className="flex flex-col items-start justify-between pt-4 border-t md:flex-row md:items-center border-slate-200">
          <div className="mb-3 text-sm text-slate-600 md:mb-0">
            <span className="text-lg font-bold text-slate-900">{filteredCandidates.length}</span> candidats filtrés
            {searchTerm && (
              <span className="px-2 py-1 ml-2 text-xs text-blue-700 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100">
                "{searchTerm}"
              </span>
            )}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-slate-500">{statistics.approvedCount} approuvés</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3 text-blue-500" />
                <span className="text-slate-500">{statistics.analyzedCount} analysés</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span className="text-slate-500">{statistics.pendingCount} en attente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste/Grille des candidats */}
      {filteredCandidates.length === 0 ? (
        <div className="py-16 text-center border shadow-sm bg-gradient-to-br from-white to-slate-50 rounded-2xl border-slate-200/50">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 shadow-inner bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
            <Search className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Aucun candidat trouvé</h3>
          <p className="max-w-md mx-auto mb-6 text-slate-600">
            Aucun candidat ne correspond à vos critères de recherche.
            Essayez d'ajuster vos filtres ou votre recherche.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Réinitialiser tous les filtres</span>
            </button>
            <button
              onClick={analyzeBatchWithAI}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Analyser avec IA</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {filteredCandidates.map(renderCandidateCard)}
        </div>
      )}

      {/* Pagination */}
      {filteredCandidates.length > 0 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            Affichage de 1 à {Math.min(filteredCandidates.length, 9)} sur {filteredCandidates.length} candidats
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 font-medium transition-all rounded-lg bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 hover:from-slate-200 hover:to-gray-200">
              ← Précédent
            </button>
            <button className="px-4 py-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
              1
            </button>
            {filteredCandidates.length > 9 && (
              <>
                <button className="px-4 py-2 font-medium transition-all rounded-lg bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 hover:from-slate-200 hover:to-gray-200">
                  2
                </button>
                <span className="text-slate-400">...</span>
                <button className="px-4 py-2 font-medium transition-all rounded-lg bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 hover:from-slate-200 hover:to-gray-200">
                  Suivant →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal d'analyse IA détaillée amélioré */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Brain className="text-white w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Analyse IA détaillée</h3>
                  <p className="text-sm text-slate-600">
                    {selectedCandidate.first_name} {selectedCandidate.last_name} • {selectedCandidate.current_position}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    toast.success('Candidat ajouté aux favoris');
                  }}
                  className="p-2.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                  title="Ajouter aux favoris"
                >
                  <Star className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-8">
                {/* En-tête avec métriques */}
                <div className="p-6 border bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200/50 rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-blue-900">Résumé de l'analyse IA</h4>
                      <p className="text-sm text-blue-700">
                        {selectedCandidate.ai_analysis?.analyzed_at ? 
                          `Analysé le ${new Date(selectedCandidate.ai_analysis.analyzed_at).toLocaleString('fr-FR', {
                            dateStyle: 'full',
                            timeStyle: 'short'
                          })}` : 
                          'Non analysé'}
                      </p>
                    </div>
                    <div className={`text-4xl font-bold px-8 py-4 rounded-xl shadow-lg ${getScoreColor(selectedCandidate.ai_analysis?.match_score || selectedCandidate.match_score)}`}>
                      {selectedCandidate.ai_analysis?.match_score || selectedCandidate.match_score}/100
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="p-4 bg-white border rounded-xl border-slate-200">
                      <div className="flex items-center mb-2 space-x-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-slate-900">Fit Culturel</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900">{selectedCandidate.ai_analysis?.cultural_fit || 'N/A'}%</span>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full" 
                            style={{ width: `${selectedCandidate.ai_analysis?.cultural_fit || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white border rounded-xl border-slate-200">
                      <div className="flex items-center mb-2 space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-slate-900">Potentiel de Croissance</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900">{selectedCandidate.ai_analysis?.growth_potential || 'N/A'}%</span>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full" 
                            style={{ width: `${selectedCandidate.ai_analysis?.growth_potential || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white border rounded-xl border-slate-200">
                      <div className="flex items-center mb-2 space-x-2">
                        <Award className="w-5 h-5 text-violet-600" />
                        <span className="font-medium text-slate-900">Profondeur Technique</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900">{selectedCandidate.ai_analysis?.technical_depth || 'N/A'}%</span>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-violet-500 to-purple-500 h-2.5 rounded-full" 
                            style={{ width: `${selectedCandidate.ai_analysis?.technical_depth || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenu détaillé */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* Colonne gauche */}
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-slate-200/70 rounded-xl">
                      <h5 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-slate-900">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span>Compétences correspondantes</span>
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.ai_analysis?.skills_match.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-3 py-2 font-medium border rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-6 bg-white border border-slate-200/70 rounded-xl">
                      <h5 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-slate-900">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span>Compétences manquantes</span>
                      </h5>
                      <div className="space-y-2">
                        {selectedCandidate.ai_analysis?.missing_skills.map((skill, index) => (
                          <div key={index} className="flex items-center space-x-2 text-slate-700">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-slate-200/70 rounded-xl">
                      <h5 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-slate-900">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span>Recommandations IA</span>
                      </h5>
                      <ul className="space-y-3">
                        {selectedCandidate.ai_analysis?.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <Sparkles className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {selectedCandidate.ai_analysis?.red_flags && selectedCandidate.ai_analysis.red_flags.length > 0 && (
                      <div className="p-6 border bg-gradient-to-br from-red-50/50 to-rose-50/50 border-red-200/50 rounded-xl">
                        <h5 className="flex items-center mb-4 space-x-2 text-lg font-semibold text-red-900">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span>Drapeaux Rouges Détectés</span>
                        </h5>
                        <ul className="space-y-2">
                          {selectedCandidate.ai_analysis.red_flags.map((flag, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-red-700">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions finales */}
                <div className="flex justify-center pt-8 space-x-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      openInterviewForm(selectedCandidate);
                    }}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 flex items-center space-x-2"
                  >
                    <Video className="w-5 h-5" />
                    <span>Planifier un entretien</span>
                  </button>
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="px-8 py-3.5 bg-gradient-to-r from-slate-200 to-gray-200 text-slate-700 font-semibold rounded-xl hover:from-slate-300 hover:to-gray-300 transition-all flex items-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Fermer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'entretien */}
      {showInterviewForm && renderInterviewForm()}
    </div>
  );
}