import { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Briefcase, CheckCircle, Clock, 
  Target, AlertCircle, BarChart3, PieChart, TrendingDown,
  Calendar, Award, Zap, Building, DollarSign, Globe,
  Download, Filter, MoreVertical, RefreshCw, Eye
} from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    openRequests: 0,
    closedRequests: 0,
    activeOffers: 0,
    totalCandidates: 0,
    pendingEvaluations: 0,
    completedEvaluations: 0,
    averageTime: 0,
    satisfactionRate: 0,
    budgetUtilization: 0,
  });

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState({
    requestsTrend: 0,
    candidatesTrend: 0,
    evaluationsTrend: 0,
    completionTrend: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchTrends();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        totalReq,
        openReq,
        closedReq,
        activeOff,
        totalCand,
        pendingEval,
        completedEval,
      ] = await Promise.all([
        supabase.from('recruitment_requests').select('id', { count: 'exact' }),
        supabase.from('recruitment_requests').select('id', { count: 'exact' }).eq('status', 'Open'),
        supabase.from('recruitment_requests').select('id', { count: 'exact' }).eq('status', 'Closed'),
        supabase.from('job_offers').select('id', { count: 'exact' }).eq('status', 'Published'),
        supabase.from('candidates').select('id', { count: 'exact' }),
        supabase.from('evaluations').select('id', { count: 'exact' }).in('status', ['Draft', 'InProgress']),
        supabase.from('evaluations').select('id', { count: 'exact' }).eq('status', 'Completed'),
      ]);

      // Calculer les métriques avancées
      const averageTime = 48; // En heures
      const satisfactionRate = 92; // Pourcentage
      const budgetUtilization = 78; // Pourcentage

      setStats({
        totalRequests: totalReq.count || 0,
        openRequests: openReq.count || 0,
        closedRequests: closedReq.count || 0,
        activeOffers: activeOff.count || 0,
        totalCandidates: totalCand.count || 0,
        pendingEvaluations: pendingEval.count || 0,
        completedEvaluations: completedEval.count || 0,
        averageTime,
        satisfactionRate,
        budgetUtilization,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    // Simulation des tendances
    setTrends({
      requestsTrend: 12,
      candidatesTrend: -5,
      evaluationsTrend: 8,
      completionTrend: 15,
    });
  };

  const completionRate = stats.totalRequests > 0
    ? ((stats.closedRequests / stats.totalRequests) * 100).toFixed(1)
    : 0;

  const evaluationRate = (stats.pendingEvaluations + stats.completedEvaluations) > 0
    ? ((stats.completedEvaluations / (stats.pendingEvaluations + stats.completedEvaluations)) * 100).toFixed(1)
    : 0;

  const statsCards = [
    {
      title: 'Demandes de recrutement',
      value: stats.totalRequests,
      change: trends.requestsTrend,
      icon: Briefcase,
      color: 'emerald',
      subValue: `${stats.openRequests} ouvertes`,
      description: 'Demandes totales traitées'
    },
    {
      title: 'Taux de réalisation',
      value: `${completionRate}%`,
      change: trends.completionTrend,
      icon: Target,
      color: 'blue',
      subValue: `${stats.closedRequests} clôturées`,
      description: 'Plan emploi global'
    },
    {
      title: 'Candidats enregistrés',
      value: stats.totalCandidates,
      change: trends.candidatesTrend,
      icon: Users,
      color: 'violet',
      subValue: `${stats.activeOffers} offres actives`,
      description: 'Base de données RH'
    },
    {
      title: 'Temps moyen de traitement',
      value: `${stats.averageTime}h`,
      change: -8,
      icon: Clock,
      color: 'amber',
      subValue: 'Par niveau hiérarchique',
      description: '48h par niveau cible'
    },
    {
      title: 'Satisfaction managers',
      value: `${stats.satisfactionRate}%`,
      change: 2,
      icon: Award,
      color: 'green',
      subValue: 'NPS: +42',
      description: 'Enquête de satisfaction'
    },
    {
      title: 'Budget RH utilisé',
      value: `${stats.budgetUtilization}%`,
      change: 5,
      icon: DollarSign,
      color: 'indigo',
      subValue: 'Suivi trimestriel',
      description: 'Utilisation des ressources'
    }
  ];

  const departmentData = [
    { name: 'IT & Digital', value: 28, color: 'bg-violet-500' },
    { name: 'Commercial', value: 24, color: 'bg-blue-500' },
    { name: 'Marketing', value: 18, color: 'bg-emerald-500' },
    { name: 'Finance', value: 15, color: 'bg-amber-500' },
    { name: 'RH', value: 10, color: 'bg-pink-500' },
    { name: 'Production', value: 5, color: 'bg-slate-500' },
  ];

  const timelineData = [
    { day: 'Lun', requests: 4, candidates: 12 },
    { day: 'Mar', requests: 6, candidates: 18 },
    { day: 'Mer', requests: 3, candidates: 8 },
    { day: 'Jeu', requests: 8, candidates: 24 },
    { day: 'Ven', requests: 5, candidates: 15 },
    { day: 'Sam', requests: 1, candidates: 3 },
    { day: 'Dim', requests: 0, candidates: 0 },
  ];

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? TrendingUp : TrendingDown;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Analytics RH</h2>
              <p className="mt-1 text-slate-600">Tableaux de bord stratégiques et indicateurs de performance</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(['week', 'month', 'quarter'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'week' ? '7j' : range === 'month' ? '30j' : 'Trim'}
              </button>
            ))}
          </div>
          
          <button
            onClick={fetchStats}
            className="p-3 transition-colors bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="p-3 transition-colors bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
            <Download className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Indicateurs principaux */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = getTrendIcon(card.change);
          const colorClasses = {
            emerald: 'from-emerald-50 to-teal-50 border-emerald-200',
            blue: 'from-blue-50 to-cyan-50 border-blue-200',
            violet: 'from-violet-50 to-purple-50 border-violet-200',
            amber: 'from-amber-50 to-orange-50 border-amber-200',
            green: 'from-green-50 to-emerald-50 border-green-200',
            indigo: 'from-indigo-50 to-blue-50 border-indigo-200',
          };

          const iconColor = {
            emerald: 'text-emerald-600 bg-emerald-100',
            blue: 'text-blue-600 bg-blue-100',
            violet: 'text-violet-600 bg-violet-100',
            amber: 'text-amber-600 bg-amber-100',
            green: 'text-green-600 bg-green-100',
            indigo: 'text-indigo-600 bg-indigo-100',
          };

          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${colorClasses[card.color]} rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${iconColor[card.color]} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${getTrendColor(card.change)}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-bold">{Math.abs(card.change)}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                <p className="text-lg font-semibold text-slate-700">{card.title}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/50">
                  <div>
                    <p className="text-sm text-slate-600">{card.subValue}</p>
                    <p className="text-xs text-slate-500">{card.description}</p>
                  </div>
                  <button className="p-2 transition-colors rounded-lg hover:bg-white/50">
                    <Eye className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphiques et visualisations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Graphique d'activité */}
        <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Activité hebdomadaire</h3>
              <p className="text-sm text-slate-600">Demandes vs Candidats</p>
            </div>
            <Filter className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-4">
            {timelineData.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-12 text-sm text-slate-500">{item.day}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center">
                    <div className="w-16 text-xs text-slate-500">Demandes</div>
                    <div className="flex-1 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${(item.requests / 10) * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-sm font-medium text-right text-slate-900">
                      {item.requests}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 text-xs text-slate-500">Candidats</div>
                    <div className="flex-1 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${(item.candidates / 30) * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-sm font-medium text-right text-slate-900">
                      {item.candidates}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par département */}
        <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Répartition des recrutements</h3>
              <p className="text-sm text-slate-600">Par département</p>
            </div>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-4">
            {departmentData.map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                  <span className="text-sm text-slate-700">{dept.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-2 rounded-full bg-slate-100">
                    <div 
                      className={`h-full rounded-full ${dept.color}`}
                      style={{ width: `${dept.value}%` }}
                    ></div>
                  </div>
                  <span className="w-12 text-sm font-semibold text-right text-slate-900">
                    {dept.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-6 mt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Total recrutements</span>
              <span className="font-semibold text-slate-900">{stats.totalRequests}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Évaluations et indicateurs avancés */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Statut des évaluations */}
        <div className="p-6 border bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
              {stats.pendingEvaluations} en attente
            </span>
          </div>
          <p className="mb-2 text-3xl font-bold text-amber-900">{stats.pendingEvaluations}</p>
          <p className="mb-3 text-lg font-semibold text-amber-800">Évaluations en cours</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-700">Taux de complétion</span>
              <span className="font-bold text-amber-900">{evaluationRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-amber-100">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                style={{ width: `${evaluationRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Indicateurs de performance */}
        <div className="p-6 border bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-700 bg-slate-200 px-3 py-1.5 rounded-full">
              Performance
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-slate-600">Délai de recrutement moyen</span>
                <span className="font-semibold text-slate-900">28 jours</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-slate-600">Qualité des recrutements</span>
                <span className="font-semibold text-slate-900">92%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-slate-600">Coût par recrutement</span>
                <span className="font-semibold text-slate-900">4,200€</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-violet-500" style={{ width: '68%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes et actions */}
        <div className="p-6 border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
              {stats.openRequests} actions
            </span>
          </div>
          <p className="mb-3 text-xl font-bold text-red-900">Alertes prioritaires</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
              <div>
                <p className="font-medium text-red-800">Demandes expirant cette semaine</p>
                <p className="text-sm text-red-600">3 demandes nécessitent une action</p>
              </div>
              <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-lg">
                <span className="text-xs font-bold text-white">3</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
              <div>
                <p className="font-medium text-red-800">Évaluations en retard</p>
                <p className="text-sm text-red-600">2 évaluations dépassent le délai</p>
              </div>
              <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-lg">
                <span className="text-xs font-bold text-white">2</span>
              </div>
            </div>
            
            <button className="w-full py-3 mt-4 font-medium text-white transition-all bg-gradient-to-r from-red-500 to-orange-500 rounded-xl hover:from-red-600 hover:to-orange-600">
              Voir toutes les alertes
            </button>
          </div>
        </div>
      </div>

      {/* Résumé global */}
      <div className="p-6 text-white bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Résumé global RH</h3>
            <p className="text-slate-300">Synthèse trimestrielle des performances</p>
          </div>
          <Globe className="w-8 h-8 text-slate-400" />
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-slate-300">Taux de réalisation</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-xl">
                <Building className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCandidates}</p>
                <p className="text-sm text-slate-300">Talents identifiés</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-violet-500/20 rounded-xl">
                <Award className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">A+</p>
                <p className="text-sm text-slate-300">Note globale RH</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-6 mt-6 border-t border-slate-700/50">
          <p className="text-sm text-slate-400">
            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}