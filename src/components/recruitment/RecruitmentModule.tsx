// Composant principal du module de recrutement, intégrant les différentes vues et fonctionnalités

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Zap, Users, Briefcase, Target, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import RecruitmentRequestList from './RecruitmentRequestList';
import ValidationRequestList from './ValidationRequestList'; // Créez ce composant
import NewRequestModal from './NewRequestModal';
import JobOffersList from './JobOffersList';
import CandidatesList from './CandidatesList';

type View = 'requests' | 'validate' | 'offers' | 'candidates';

export default function RecruitmentModule() {
  const { profile } = useAuth();
  const [activeView, setActiveView] = useState<View>('requests');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [stats, setStats] = useState({
    openRequests: 0,
    pendingValidations: 1,
    activeOffers: 0,
    totalCandidates: 0,
    interviews: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        requestsData, 
        pendingValidationsData, 
        offersData, 
        candidatesData, 
        interviewsData
      ] = await Promise.all([
        supabase.from('recruitment_requests').select('id', { count: 'exact' }).eq('status', 'Open'),
        supabase.from('recruitment_requests').select('id', { count: 'exact' })
          .eq('status', 'InProgress')
          .eq('current_validation_level', getCurrentValidationLevel()),
        supabase.from('job_offers').select('id', { count: 'exact' }).eq('status', 'Published'),
        supabase.from('candidates').select('id', { count: 'exact' }),
        supabase.from('interviews').select('id', { count: 'exact' }).eq('status', 'Scheduled'),
      ]);

      setStats({
        openRequests: requestsData.count || 0,
        pendingValidations: pendingValidationsData.count || 1,
        activeOffers: offersData.count || 0,
        totalCandidates: candidatesData.count || 0,
        interviews: interviewsData.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fonction pour obtenir le niveau de validation actuel basé sur le rôle
  const getCurrentValidationLevel = () => {
    const role = profile?.role?.toLowerCase();
    switch (role) {
      case 'manager': return 'Manager';
      case 'directeur': return 'Directeur';
      case 'rh': return 'DRH';
      case 'daf': return 'DAF';
      case 'dga': return 'DGA/DG';
      default: return 'Manager';
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
  ];

  const canCreateRequest = ['manager', 'directeur', 'rh'].includes(profile?.role?.toLowerCase() || '');
  const canValidateRequests = ['manager', 'directeur', 'rh', 'daf', 'dga'].includes(profile?.role?.toLowerCase() || '');

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Module Recrutement
                </h2>
                <p className="text-slate-600 mt-1">Digitalisation complète du workflow RH</p>
              </div>
            </div>
            
            {/* Statistiques en ligne */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-3 bg-white border border-slate-200/70 px-4 py-3 rounded-xl shadow-sm">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Demandes ouvertes</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.openRequests}</p>
                </div>
              </div>
              
              {canValidateRequests && (
                <div className="flex items-center space-x-3 bg-white border border-slate-200/70 px-4 py-3 rounded-xl shadow-sm">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">À valider</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.pendingValidations}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 bg-white border border-slate-200/70 px-4 py-3 rounded-xl shadow-sm">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Target className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Offres actives</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.activeOffers}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white border border-slate-200/70 px-4 py-3 rounded-xl shadow-sm">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Candidats</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalCandidates}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-white border border-slate-200/70 px-4 py-3 rounded-xl shadow-sm">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entretiens</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.interviews}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bouton d'action */}
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
              <p className="text-xs text-slate-500 mt-2">Lancez un nouveau processus de recrutement</p>
            </div>
          )}
        </div>
      </div>

      {/* Barre de navigation et recherche */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5">
          {/* Navigation par onglets */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-2 lg:pb-0">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center space-x-3 px-5 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? `bg-gradient-to-r from-${view.color}-50 to-${view.color}-100 text-${view.color}-700 border border-${view.color}-200 shadow-sm`
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{view.label}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? `bg-${view.color}-200 text-${view.color}-800`
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {view.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Barre de recherche */}
          <div className="relative flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeView === 'requests' ? "Rechercher demandes..." :
                  activeView === 'validate' ? "Rechercher demandes à valider..." :
                  activeView === 'offers' ? "Rechercher offres..." :
                  "Rechercher candidats..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              />
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-5 pb-5">
          {activeView === 'requests' && <RecruitmentRequestList onUpdate={fetchStats} searchTerm={searchTerm} />}
          {activeView === 'validate' && canValidateRequests && <ValidationRequestList onUpdate={fetchStats} searchTerm={searchTerm} />}
          {activeView === 'offers' && <JobOffersList onUpdate={fetchStats} searchTerm={searchTerm} />}
          {activeView === 'candidates' && <CandidatesList searchTerm={searchTerm} />}
          
          {activeView === 'validate' && !canValidateRequests && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Accès non autorisé</h3>
              <p className="text-slate-600">
                Vous n'avez pas les permissions nécessaires pour valider des demandes
              </p>
            </div>
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

      {/* Guide rapide */}
      <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 rounded-2xl p-6">
        <h3 className="font-bold text-slate-900 mb-4">💡 Processus de recrutement</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <span className="font-bold text-emerald-600">1</span>
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Expression de besoin</h4>
            <p className="text-sm text-slate-600">Manager crée la demande avec justification</p>
          </div>
          <div className="bg-white border border-slate-200/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="font-bold text-blue-600">2</span>
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Validation hiérarchique</h4>
            <p className="text-sm text-slate-600">Circuit: Manager → Directeur → DRH → DAF → DGA/DG</p>
          </div>
          <div className="bg-white border border-slate-200/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-3">
              <span className="font-bold text-violet-600">3</span>
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Publication et collecte</h4>
            <p className="text-sm text-slate-600">Offre publiée automatiquement sur les job boards</p>
          </div>
          <div className="bg-white border border-slate-200/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <span className="font-bold text-amber-600">4</span>
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Sélection et intégration</h4>
            <p className="text-sm text-slate-600">Pré-sélection IA, entretiens, et onboarding</p>
          </div>
        </div>
      </div>
    </div>
  );
}