// Composant principal du module de recrutement, intégrant les différentes vues et fonctionnalités

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Zap, Users, Briefcase, Target, 
  TrendingUp, CheckCircle, Calendar, Linkedin 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RecruitmentRequestList from './RecruitmentRequestList';
import ValidationRequestList from './ValidationRequestList';
import NewRequestModal from './NewRequestModal';
import JobOffersList from './JobOffersList';
import CandidatesList from './CandidatesList';
import InterviewEvaluationList from './InterviewEvaluationList';
import toast from 'react-hot-toast';

type View = 'requests' | 'validate' | 'offers' | 'candidates' | 'interviews';

export default function RecruitmentModule() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<View>('requests');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [stats, setStats] = useState({
    openRequests: 0,
    pendingValidations: 0,
    activeOffers: 0,
    totalCandidates: 0,
    interviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // 👈 État pour LinkedIn
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);

  // 👈 Vérifier la connexion LinkedIn
  const checkLinkedInConnection = () => {
    const token = localStorage.getItem('linkedin_token');
    setIsLinkedInConnected(!!token);
  };

  // 👈 Connecter LinkedIn
  const connectLinkedIn = () => {
    window.location.href = '${API}/auth/linkedin';
  };

  // 👈 Capturer le token depuis l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const connected = urlParams.get('linkedin_connected');
    
    if (token) {
      localStorage.setItem('linkedin_token', token);
      setIsLinkedInConnected(true);
      toast.success('Compte LinkedIn connecté avec succès !');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (connected === 'true') {
      setIsLinkedInConnected(true);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    checkLinkedInConnection(); // 👈 Vérifier LinkedIn au chargement
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      console.log('🔍 Récupération des stats...');

      const BASE_URL = `${API}/api/recruitmentRequests`;
      
      const pendingRes = await fetch(`${BASE_URL}/requests/by-status/pending`, { headers });
      const pendingData = await pendingRes.json();
      console.log('📊 Demandes en attente:', pendingData);

      const inProgressRes = await fetch(`${BASE_URL}/requests/by-status/in-progress`, { headers });
      const inProgressData = await inProgressRes.json();
      console.log('📊 Demandes en cours:', inProgressData);

      const validatedRes = await fetch(`${BASE_URL}/requests/by-status/validated`, { headers });
      const validatedData = await validatedRes.json();
      console.log('📊 Demandes validées:', validatedData);

      let pendingValidations = 0;
      if (user?.role) {
        const pendingForUserRes = await fetch(
          `${BASE_URL}/requests/pending-for-user?role=${user.role}`, 
          { headers }
        );
        const pendingForUserData = await pendingForUserRes.json();
        console.log(`📊 Validations en attente pour ${user.role}:`, pendingForUserData);
        pendingValidations = pendingForUserData.count || 0;
      }

      const newStats = {
        openRequests: (pendingData.count || 0) + (inProgressData.count || 0),
        pendingValidations: pendingValidations,
        activeOffers: validatedData.count || 0,
        totalCandidates: 0,
        interviews: 0,
      };

      console.log('✅ Stats mises à jour:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const views = [
    { 
      id: 'requests' as View, 
      label: 'Demandes de recrutement', 
      count: stats.openRequests,
      icon: Briefcase,
      color: 'emerald',
      description: 'Suivi des demandes en cours'
    },
    { 
      id: 'validate' as View, 
      label: 'Validation', 
      count: stats.pendingValidations,
      icon: CheckCircle,
      color: 'blue',
      description: 'Valider les demandes à votre niveau'
    },
    { 
      id: 'offers' as View, 
      label: 'Offres d\'emploi', 
      count: stats.activeOffers,
      icon: Target,
      color: 'violet',
      description: 'Offres publiées actives'
    },
    { 
      id: 'candidates' as View, 
      label: 'Candidats', 
      count: stats.totalCandidates,
      icon: Users,
      color: 'amber',
      description: 'Base de données candidats'
    },
    { 
      id: 'interviews' as View, 
      label: 'Entretiens', 
      count: stats.interviews,
      icon: Calendar,
      color: 'rose',
      description: 'Entretiens et évaluations'
    },
  ];

  const canCreateRequest = ['manager', 'DRH', 'rh'].includes(user?.role?.toLowerCase() || '');
  const canValidateRequests = ['directeur','drh', 'rh', 'daf', 'dga'].includes(user?.role?.toLowerCase() || '');

  // 🔥 FILTRER LES VUES SELON LES PERMISSIONS
  const visibleViews = views.filter(view => {
    if (view.id === 'validate') {
      return canValidateRequests;
    }

    if (view.id === 'requests' && user?.role?.toLowerCase() === 'directeur') {
      return false;
    }
    
    return true;
  });

  // 🔥 REDIRIGER SI L'ONGLET ACTUEL N'EST PLUS VISIBLE
  useEffect(() => {
    const viewExists = visibleViews.some(view => view.id === activeView);
    if (!viewExists && visibleViews.length > 0) {
      setActiveView(visibleViews[0].id);
    }
  }, [visibleViews, activeView]);

  const getSearchPlaceholder = () => {
    switch (activeView) {
      case 'requests':
        return "Rechercher demandes par titre, département, statut...";
      case 'validate':
        return "Rechercher demandes à valider...";
      case 'offers':
        return "Rechercher offres par titre, département, localisation...";
      case 'candidates':
        return "Rechercher candidats par nom, poste, compétence...";
      case 'interviews':
        return "Rechercher entretiens par nom, poste, interviewer...";
      default:
        return "Rechercher...";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="p-6 border shadow-sm bg-gradient-to-br from-white to-slate-50 border-slate-200/50 rounded-2xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-3 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Zap className="text-white w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
                  Module Recrutement
                </h2>
                <p className="mt-1 text-slate-600">Digitalisation complète du workflow RH</p>
              </div>
            </div>
            
            {/* Statistiques en ligne */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center px-4 py-3 space-x-3 bg-white border shadow-sm border-slate-200/70 rounded-xl">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Demandes ouvertes</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {loading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      stats.openRequests
                    )}
                  </p>
                </div>
              </div>
              
              {/* Statistique "À valider" visible seulement pour les autorisés */}
              {canValidateRequests && (
                <div className="flex items-center px-4 py-3 space-x-3 bg-white border shadow-sm border-slate-200/70 rounded-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">À valider</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {loading ? (
                        <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        stats.pendingValidations
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center px-4 py-3 space-x-3 bg-white border shadow-sm border-slate-200/70 rounded-xl">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Target className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Offres actives</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {loading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      stats.activeOffers
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center px-4 py-3 space-x-3 bg-white border shadow-sm border-slate-200/70 rounded-xl">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Candidats</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {loading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      stats.totalCandidates
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center px-4 py-3 space-x-3 bg-white border shadow-sm border-slate-200/70 rounded-xl">
                <div className="p-2 rounded-lg bg-rose-100">
                  <Calendar className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entretiens</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {loading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      stats.interviews
                    )}
                  </p>
                </div>
              </div>

              {/* 👈 BOUTON CONNEXION LINKEDIN */}
              <div className="flex items-center px-4 py-3 space-x-3 bg-white border shadow-sm border-slate-200/70 rounded-xl">
                <div className={`p-2 rounded-lg ${isLinkedInConnected ? 'bg-green-100' : 'bg-blue-100'}`}>
                  <Linkedin className={`w-5 h-5 ${isLinkedInConnected ? 'text-green-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">LinkedIn</p>
                  <button
                    onClick={connectLinkedIn}
                    className={`text-sm font-medium ${isLinkedInConnected ? 'text-green-600' : 'text-blue-600'} hover:underline`}
                  >
                    {isLinkedInConnected ? '✅ Connecté' : '🔗 Connecter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bouton Nouvelle demande */}
          {canCreateRequest && (
            <div className="lg:text-right">
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
              >
                <div className="flex items-center space-x-3">
                  <Plus className="w-5 h-5" />
                  <span>Nouvelle demande</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
              <p className="mt-2 text-xs text-slate-500">Lancez un nouveau processus de recrutement</p>
            </div>
          )}
        </div>
      </div>

      {/* Barre de navigation et recherche */}
      <div className="p-1 bg-white border shadow-sm rounded-2xl border-slate-200">
        <div className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
          {/* 🔥 Navigation avec les vues filtrées */}
          <div className="flex items-center pb-2 space-x-1 overflow-x-auto lg:pb-0">
            {visibleViews.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              
              const getActiveClasses = () => {
                switch (view.color) {
                  case 'emerald':
                    return 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200';
                  case 'blue':
                    return 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200';
                  case 'violet':
                    return 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200';
                  case 'amber':
                    return 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200';
                  case 'rose':
                    return 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200';
                  default:
                    return 'bg-slate-50 text-slate-700 border-slate-200';
                }
              };

              const getCountClasses = () => {
                switch (view.color) {
                  case 'emerald':
                    return 'bg-emerald-200 text-emerald-800';
                  case 'blue':
                    return 'bg-blue-200 text-blue-800';
                  case 'violet':
                    return 'bg-violet-200 text-violet-800';
                  case 'amber':
                    return 'bg-amber-200 text-amber-800';
                  case 'rose':
                    return 'bg-rose-200 text-rose-800';
                  default:
                    return 'bg-slate-200 text-slate-700';
                }
              };
              
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center space-x-3 px-5 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? getActiveClasses()
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{view.label}</span>
                  {loading ? (
                    <span className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></span>
                  ) : (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? getCountClasses()
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {view.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Barre de recherche */}
          <div className="relative flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              />
              <Filter className="absolute w-5 h-5 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-slate-400 hover:text-slate-600" />
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-5 pb-5">
          {activeView === 'requests' && (
            <RecruitmentRequestList 
              onUpdate={fetchStats} 
              searchTerm={searchTerm}
              onNewRequest={() => setShowNewRequestModal(true)}
            />
          )}
          
          {activeView === 'validate' && (
            <ValidationRequestList onUpdate={fetchStats} searchTerm={searchTerm} />
          )}
          
          {activeView === 'offers' && (
            <JobOffersList 
              onUpdate={fetchStats} 
              searchTerm={searchTerm}
              // 👈 Passer le statut de connexion LinkedIn si nécessaire
            />
          )}
          
          {activeView === 'candidates' && (
            <CandidatesList searchTerm={searchTerm} />
          )}
          
          {activeView === 'interviews' && (
            <InterviewEvaluationList searchTerm={searchTerm} />
          )}
        </div>
      </div>

      {/* Modal de nouvelle demande */}
      {showNewRequestModal && (
        <NewRequestModal
          onClose={() => setShowNewRequestModal(false)}
          onSuccess={() => {
            setShowNewRequestModal(false);
            fetchStats();
          }}
        />
      )}
    </div>
  );
}