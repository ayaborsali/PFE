import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, ClipboardCheck, LogOut, BarChart3, Briefcase, 
  Building, ChevronRight, Sparkles, Zap, Target,
  UserCheck, TrendingUp, Shield, Clock, AlertTriangle,
  X, Check, Bell, Settings, HelpCircle, MessageSquare,
  Database, Cpu, PieChart, ArrowRight, Eye, Lock,
  Calendar, FileText, Search, Filter, Download,
  CheckCircle, Clock as ClockIcon, ArrowUpRight
} from 'lucide-react';
import RecruitmentModule from './recruitment/RecruitmentModule';
import EvaluationModule from './evaluation/EvaluationModule';
import Analytics from './Analytics';

type Module = 'recruitment' | 'evaluation' | 'analytics';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>('recruitment');
  const [hoveredCard, setHoveredCard] = useState<Module | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const modules = [
    {
      id: 'recruitment' as Module,
      name: 'Espace Recrutement',
      icon: Users,
      description: 'Digitalisation complète du workflow RH',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      lightGradient: 'from-emerald-50 via-teal-50 to-cyan-50',
      darkGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      stats: '5 demandes • 12 candidats • 3 entretiens',
      features: ['Expression de besoin', 'Validation hiérarchique', 'Pré-sélection IA'],
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-500',
      metrics: [
        { label: 'Traitement moyen', value: '48h', change: '+12%' },
        { label: 'Taux de succès', value: '92%', change: '+5%' }
      ],
      progress: 75,
      alerts: 2
    },
    {
      id: 'evaluation' as Module,
      name: 'Espace Évaluation',
      icon: ClipboardCheck,
      description: 'Suivi intelligent des périodes d\'essai',
      gradient: 'from-blue-500 via-indigo-500 to-violet-500',
      lightGradient: 'from-blue-50 via-indigo-50 to-violet-50',
      darkGradient: 'from-blue-600 via-indigo-600 to-violet-600',
      stats: '8 contrats à évaluer • 3 en attente',
      features: ['Déclenchement automatique', 'Circuit de validation', 'Archivage'],
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      badgeColor: 'bg-blue-500',
      metrics: [
        { label: 'Évaluations en cours', value: '8/12', change: '+3' },
        { label: 'Terminé à temps', value: '89%', change: '+7%' }
      ],
      progress: 67,
      alerts: 1
    },
    {
      id: 'analytics' as Module,
      name: 'Espace Analytics',
      icon: BarChart3,
      description: 'Indicateurs et tableaux de bord stratégiques',
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      lightGradient: 'from-violet-50 via-purple-50 to-fuchsia-50',
      darkGradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
      stats: 'KPI temps réel • 12 rapports • 98% taux',
      features: ['Dashboard RH', 'Analytics prédictif', 'Reporting automatique'],
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      badgeColor: 'bg-violet-500',
      metrics: [
        { label: 'Data actualisée', value: '15min', change: '-30s' },
        { label: 'Précision', value: '99.2%', change: '+0.3%' }
      ],
      progress: 90,
      alerts: 0
    },
  ];

  const getCurrentModule = modules.find(m => m.id === activeModule);
  const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const notificationItems = [
    { id: 1, title: 'Nouvelle demande Marketing', time: 'Il y a 2h', unread: true },
    { id: 2, title: '5 candidatures reçues', time: 'Il y a 4h', unread: true },
    { id: 3, title: 'Évaluation à valider', time: 'Il y a 1j', unread: false },
  ];

  return (
    <>
      {/* Modal de confirmation de déconnexion */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-md w-full border border-white/30">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Confirmer la déconnexion</h3>
                  <p className="text-slate-600 mt-1">Êtes-vous sûr de vouloir vous déconnecter ?</p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    handleSignOut();
                    setShowLogoutConfirm(false);
                  }}
                  className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium py-2.5 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Notifications */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}>
          <div className="absolute top-16 right-6 bg-white rounded-2xl shadow-2xl border border-slate-200/50 w-80 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Notifications</h3>
                <span className="text-sm text-slate-600">{notifications} non lues</span>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notificationItems.map((item) => (
                <div key={item.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 mt-2 rounded-full ${item.unread ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{item.time}</p>
                    </div>
                    {item.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200">
              <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium">
                Voir toutes les notifications
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
        {/* Effets de fond décoratifs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-gradient-to-r from-violet-500/3 to-purple-500/3 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {/* Header avec glassmorphism */}
          <header className="sticky top-0 z-40">
            <div className="px-6 lg:px-8 py-4">
              <div className="bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-lg shadow-slate-200/30">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Building className="w-7 h-7 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Zap className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                          Kilani Groupe
                        </h1>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Shield className="w-3 h-3 text-emerald-500" />
                              <span>RH Digitalisée</span>
                            </div>
                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>{formatTime(currentTime)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Boutons d'action rapide */}
                      <div className="hidden md:flex items-center space-x-2">
                        <button className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" title="Aide">
                          <HelpCircle className="w-5 h-5 text-slate-600" />
                        </button>
                        <button className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" title="Support">
                          <MessageSquare className="w-5 h-5 text-slate-600" />
                        </button>
                        <button className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" title="Base de données">
                          <Database className="w-5 h-5 text-slate-600" />
                        </button>
                      </div>

                      {/* Notifications */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowNotifications(!showNotifications)}
                          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors relative"
                        >
                          <Bell className="w-5 h-5 text-slate-600" />
                          {notifications > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-white">
                              <span className="text-xs font-bold text-white">{notifications}</span>
                            </div>
                          )}
                        </button>
                      </div>

                      {/* Profil utilisateur */}
                      <div className="hidden md:block">
                        <div className="bg-gradient-to-r from-white to-slate-50 border border-slate-200/50 rounded-xl px-4 py-2.5 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-2xl ${
                                profile?.role === 'manager' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                                profile?.role === 'rh' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                profile?.role === 'directeur' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                                profile?.role === 'daf' ? 'bg-gradient-to-br from-violet-500 to-violet-600' :
                                profile?.role === 'dga' ? 'bg-gradient-to-br from-rose-500 to-rose-600' : 
                                'bg-gradient-to-br from-slate-500 to-slate-600'
                              } flex items-center justify-center shadow-lg`}>
                                <span className="text-white font-bold text-lg">
                                  {profile?.full_name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border-2 border-slate-100">
                                <div className={`w-2 h-2 rounded-full ${
                                  profile?.role === 'manager' ? 'bg-emerald-500' :
                                  profile?.role === 'rh' ? 'bg-blue-500' :
                                  profile?.role === 'directeur' ? 'bg-amber-500' :
                                  profile?.role === 'daf' ? 'bg-violet-500' :
                                  profile?.role === 'dga' ? 'bg-rose-500' : 'bg-slate-500'
                                }`}></div>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{profile?.full_name}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-500">{profile?.department}</span>
                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  profile?.role === 'manager' ? 'bg-emerald-100 text-emerald-700' :
                                  profile?.role === 'rh' ? 'bg-blue-100 text-blue-700' :
                                  profile?.role === 'directeur' ? 'bg-amber-100 text-amber-700' :
                                  profile?.role === 'daf' ? 'bg-violet-100 text-violet-700' :
                                  profile?.role === 'dga' ? 'bg-rose-100 text-rose-700' : 
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {profile?.role?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bouton déconnexion */}
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="group relative overflow-hidden bg-gradient-to-r from-white to-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl px-4 py-2.5 shadow-sm transition-all duration-300 hover:shadow-md"
                        title="Déconnexion"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-slate-100 group-hover:bg-red-50 rounded-lg transition-colors">
                            <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-500 transition-colors" />
                          </div>
                          <span className="font-medium text-slate-700 group-hover:text-red-600 transition-colors hidden md:inline">
                            Déconnexion
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-6 lg:px-8 pb-8">
            {/* Bannière du module actif */}
            {getCurrentModule && (
              <div className="mb-8 animate-fadeIn">
                <div className={`relative overflow-hidden bg-gradient-to-r ${getCurrentModule.lightGradient} border border-white/50 rounded-2xl p-6 lg:p-8 shadow-xl`}>
                  {/* Effet de fond animé */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${getCurrentModule.gradient} opacity-5 animate-pulse`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <div className={`p-4 rounded-2xl ${getCurrentModule.iconBg} shadow-xl`}>
                            <getCurrentModule.icon className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-white to-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <div className={`w-3 h-3 rounded-full ${getCurrentModule.badgeColor}`}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
                              {getCurrentModule.name}
                            </h2>
                            <div className="flex items-center space-x-1">
                              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                              <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                Actif
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-600 mb-4 max-w-2xl">{getCurrentModule.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {getCurrentModule.features.map((feature, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center space-x-2 bg-white/80 border border-white/50 px-4 py-2 rounded-xl text-sm text-slate-700 shadow-sm"
                              >
                                <Target className="w-3 h-3 text-emerald-500" />
                                <span className="font-medium">{feature}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/90 border border-white/50 rounded-xl px-6 py-4 shadow-lg">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                          <div>
                            <p className="font-bold text-slate-900">{getCurrentModule.stats}</p>
                            <p className="text-xs text-slate-500 mt-1">Dernière mise à jour</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sélection d'espace - Cartes professionnelles améliorées */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {modules.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;
                const isHovered = hoveredCard === module.id;
                
                return (
                  <div
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    onMouseEnter={() => setHoveredCard(module.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`group relative cursor-pointer transition-all duration-500 ${
                      isActive ? 'scale-[1.02]' : ''
                    }`}
                  >
                    {/* Carte principale */}
                    <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
                      isActive 
                        ? 'shadow-2xl ring-2 ring-white/50' 
                        : 'shadow-lg group-hover:shadow-2xl'
                    }`}>
                      {/* Effet de fond dégradé */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.lightGradient} ${
                        isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                      } transition-opacity duration-500`}></div>
                      
                      {/* Barre de progression en haut */}
                      <div className="relative h-2 bg-white/20 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${module.gradient} transition-all duration-1000 ease-out`}
                          style={{ width: `${module.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="relative p-6">
                        {/* En-tête de carte */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className={`relative p-4 rounded-2xl shadow-xl transition-transform duration-500 group-hover:scale-110 ${
                              isActive 
                                ? 'bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm' 
                                : 'bg-white/90'
                            }`}>
                              <Icon className={`w-8 h-8 ${
                                isActive 
                                  ? 'text-white' 
                                  : `bg-gradient-to-br ${module.gradient} bg-clip-text text-transparent`
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-xl font-bold text-slate-900">{module.name}</h3>
                                {isActive && (
                                  <div className="flex items-center space-x-1 animate-pulse">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span className="text-xs font-medium text-emerald-600">Actif</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{module.description}</p>
                            </div>
                          </div>
                          
                          {/* Badge d'alerte */}
                          {module.alerts > 0 && (
                            <div className="relative">
                              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                                <span className="text-xs font-bold text-white">{module.alerts}</span>
                              </div>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-slate-100 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Métriques en temps réel */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          {module.metrics.map((metric, idx) => (
                            <div 
                              key={idx}
                              className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500">{metric.label}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  metric.change.startsWith('+') 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {metric.change}
                                </span>
                              </div>
                              <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Liste des fonctionnalités */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-700">Fonctionnalités principales</span>
                            <div className="flex items-center space-x-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-500">Sécurisé</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {module.features.map((feature, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors"
                              >
                                <div className={`w-2 h-2 rounded-full ${
                                  isActive 
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                                    : 'bg-slate-300 group-hover:bg-emerald-400'
                                } transition-colors`}></div>
                                <span className="text-sm font-medium text-slate-700">{feature}</span>
                                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Footer de carte */}
                        <div className="pt-5 border-t border-white/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <ClockIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">{module.stats}</span>
                              </div>
                            </div>
                            
                            <button
                              className={`relative overflow-hidden px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                                isActive
                                  ? 'bg-gradient-to-r from-white to-white/90 text-slate-900 shadow-lg'
                                  : 'bg-gradient-to-r from-white/80 to-white/60 text-slate-700 hover:text-slate-900 group-hover:shadow-lg'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span>{isActive ? 'Module ouvert' : 'Ouvrir'}</span>
                                <ArrowUpRight className={`w-4 h-4 transition-transform ${
                                  isActive ? 'rotate-45' : 'group-hover:translate-x-1 group-hover:-translate-y-1'
                                }`} />
                              </div>
                              
                              {/* Effet hover sur le bouton */}
                              <div className={`absolute inset-0 bg-gradient-to-r ${module.gradient} opacity-0 ${
                                isActive ? '' : 'group-hover:opacity-10'
                              } transition-opacity duration-300`}></div>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Effet de bordure lumineuse */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl p-[2px]">
                          <div className={`absolute inset-0 bg-gradient-to-r ${module.gradient} rounded-2xl opacity-20`}></div>
                          <div className="absolute inset-[2px] bg-gradient-to-br from-white/95 to-white/90 rounded-[14px]"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicateur d'état (seulement pour actif) */}
                    {isActive && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center space-x-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>Module sélectionné</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Contenu du module sélectionné */}
            <div className="mb-8">
              <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-slate-300/10 overflow-hidden">
                {/* Barre d'outils du module */}
                <div className="bg-gradient-to-r from-white to-white/90 border-b border-white/50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getCurrentModule?.badgeColor}`}></div>
                      <h3 className="font-bold text-slate-900">
                        {getCurrentModule?.name} - Interface principale
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title="Rafraîchir">
                        <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title="Paramètres">
                        <Settings className="w-4 h-4 text-slate-600" />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title="Vue détaillée">
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 lg:p-8">
                  {activeModule === 'recruitment' && <RecruitmentModule />}
                  {activeModule === 'evaluation' && <EvaluationModule />}
                  {activeModule === 'analytics' && <Analytics />}
                </div>
              </div>
            </div>

            {/* Footer avec informations système */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center space-x-2 px-4 py-2 bg-white/80 border border-slate-200/50 rounded-xl">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Système sécurisé ISO 27001</span>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    <span>Connecté • {formatTime(currentTime)}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-slate-500 flex items-center space-x-3">
                <span className="px-3 py-1 bg-slate-100 rounded-full">v2.5.1</span>
                <span>Kilani Groupe • Plateforme RH Digitalisée • © 2026</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600">Opérationnel</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Styles CSS pour animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}