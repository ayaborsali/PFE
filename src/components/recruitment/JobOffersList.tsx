import { useState, useEffect } from 'react';
import { 
  Briefcase, Calendar, Edit2, Eye, Globe, Linkedin, 
  Users, Zap, FileText, Building, Clock, Tag, 
  ChevronRight, Plus, Filter, Search, Download,
  Share2, Printer, ExternalLink, CheckCircle,
  XCircle, AlertCircle, Sparkles, Save, X,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface JobOffer {
  id: string;
  reference: string;
  title: string;
  description: string;
  profile_required?: string;
  department: string;
  location: string;
  contract_type: string;
  publication_date: string | null;
  application_deadline: string;
  status: 'draft' | 'published' | 'closed' | 'filled' | 'archived';
  salary_min?: number;
  salary_max?: number;
  experience: string;
  level: string;
  remote_work: boolean;
  travel_required: boolean;
  start_date: string;
  benefits: string[];
  required_skills: string[];
  views_count: number;
  applications_count: number;
  request_id?: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  onUpdate: () => void;
  searchTerm?: string;
}

// Listes prédéfinies
const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'];
const EXPERIENCE_LEVELS = ['0-1 an', '1-3 ans', '3-5 ans', '5-8 ans', '8+ ans'];
const LOCATIONS = ['Charguia 1', 'Jbel Wost', 'Ain Zaghouan', 'Tunis', 'Sfax', 'Sousse'];
const DEPARTMENTS = ['Direction IT', 'Ressources Humaines', 'Finance & Comptabilité', 'Marketing & Communication', 'Commercial & Ventes', 'Direction Générale', 'Production', 'Logistique', 'Service Client'];

// Plateformes de publication
const PUBLISH_PLATFORMS = [
  { id: 'internal', name: 'Interne', icon: Building, description: 'Site intranet', color: 'blue' },
  { id: 'tanitjobs', name: 'Tanitjobs', icon: Globe, description: 'Plateforme d\'emploi externe', color: 'emerald' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, description: 'Réseau professionnel', color: 'blue' },
  { id: 'other', name: 'Autres', icon: Briefcase, description: 'Indeed, Monster, etc.', color: 'amber' }
];

export default function JobOffersList({ onUpdate, searchTerm = '' }: Props) {
  const { user, token } = useAuth();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedOfferForPublish, setSelectedOfferForPublish] = useState<JobOffer | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [searchInput, setSearchInput] = useState(searchTerm);
  
  // États pour l'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<JobOffer>>({});

  useEffect(() => {
    fetchOffers();
  }, [filter, searchInput]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!authToken) {
        setLoading(false);
        return;
      }

      const headers = { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      let url = 'http://localhost:5000/api/job-offers';
      const params = new URLSearchParams();
      
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      if (searchInput) {
        params.append('search', searchInput);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('📡 Récupération des offres:', url);
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          return;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${data.length} offre(s) récupérée(s)`, data);
      
      setOffers(data);
    } catch (error) {
      console.error('❌ Error fetching job offers:', error);
      toast.error('Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (offer: JobOffer) => {
    setEditingOffer(offer);
    setEditFormData({
      title: offer.title,
      description: offer.description,
      profile_required: offer.profile_required,
      department: offer.department,
      location: offer.location,
      contract_type: offer.contract_type,
      experience: offer.experience,
      level: offer.level,
      salary_min: offer.salary_min,
      salary_max: offer.salary_max,
      remote_work: offer.remote_work,
      travel_required: offer.travel_required,
      start_date: offer.start_date,
      application_deadline: offer.application_deadline,
      benefits: offer.benefits,
      required_skills: offer.required_skills
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (field: keyof JobOffer, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingOffer) return;

    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`http://localhost:5000/api/job-offers/${editingOffer.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }

      toast.success('Offre modifiée avec succès');
      setShowEditModal(false);
      setEditingOffer(null);
      setShowDetails(false);
      fetchOffers();
      onUpdate();

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const openPublishModal = (offer: JobOffer) => {
    setSelectedOfferForPublish(offer);
    setSelectedPlatforms([]);
    setShowPublishModal(true);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublishOffer = async () => {
    if (!selectedOfferForPublish) return;
    
    if (selectedPlatforms.length === 0) {
      toast.error('Veuillez sélectionner au moins une plateforme');
      return;
    }
    
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`http://localhost:5000/api/job-offers/${selectedOfferForPublish.id}/publish`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ platforms: selectedPlatforms })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la publication');
      }

      const platformNames = selectedPlatforms.map(p => {
        const platform = PUBLISH_PLATFORMS.find(pp => pp.id === p);
        return platform?.name || p;
      }).join(', ');

      toast.success(`Offre publiée avec succès sur: ${platformNames}`);
      setShowPublishModal(false);
      setSelectedOfferForPublish(null);
      setSelectedPlatforms([]);
      fetchOffers();
      onUpdate();

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la publication');
    }
  };

  const handleCloseOffer = async (offerId: string) => {
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`http://localhost:5000/api/job-offers/${offerId}/close`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la clôture');
      }

      toast.success('Offre clôturée avec succès');
      fetchOffers();
      onUpdate();

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la clôture');
    }
  };

  const formatSalary = (min?: number, max?: number): string => {
    if (min && max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()} DT/mois`;
    }
    if (min) {
      return `≥ ${min.toLocaleString()} DT/mois`;
    }
    if (max) {
      return `≤ ${max.toLocaleString()} DT/mois`;
    }
    return 'Non spécifié';
  };

  const getStatusColor = (status: JobOffer['status']) => {
    switch (status) {
      case 'draft': return 'bg-amber-100 text-amber-700';
      case 'published': return 'bg-emerald-100 text-emerald-700';
      case 'closed': return 'bg-blue-100 text-blue-700';
      case 'filled': return 'bg-purple-100 text-purple-700';
      case 'archived': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: JobOffer['status']) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'published': return 'Publiée';
      case 'closed': return 'Clôturée';
      case 'filled': return 'Pourvue';
      case 'archived': return 'Archivée';
      default: return status;
    }
  };

  const getContractColor = (contractType: string) => {
    switch (contractType) {
      case 'CDI': return 'bg-green-100 text-green-700';
      case 'CDD': return 'bg-blue-100 text-blue-700';
      case 'Alternance': return 'bg-purple-100 text-purple-700';
      case 'Stage': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <Briefcase className="text-white w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Offres d'emploi</h2>
              <p className="text-slate-600">Gérez vos offres issues des demandes de recrutement validées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-5 border bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-emerald-700">Total</span>
            <Briefcase className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-900">{offers.length}</div>
          <p className="text-sm text-emerald-700">Offres créées</p>
        </div>
        
        <div className="p-5 border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-blue-700">Publiées</span>
            <Globe className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {offers.filter(o => o.status === 'published').length}
          </div>
          <p className="text-sm text-blue-700">Actuellement en ligne</p>
        </div>
        
        <div className="p-5 border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-amber-700">Brouillons</span>
            <Edit2 className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-900">
            {offers.filter(o => o.status === 'draft').length}
          </div>
          <p className="text-sm text-amber-700">À publier</p>
        </div>
        
        <div className="p-5 border bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-violet-700">Clôturées</span>
            <CheckCircle className="w-5 h-5 text-violet-500" />
          </div>
          <div className="text-3xl font-bold text-violet-900">
            {offers.filter(o => o.status === 'closed' || o.status === 'filled').length}
          </div>
          <p className="text-sm text-violet-700">Recrutement terminé</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Toutes les offres
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'draft'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Brouillons
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'published'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Publiées
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'closed'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Clôturées
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une offre..."
                className="py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des offres */}
      <div className="space-y-4">
        {offers.length > 0 ? (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="p-6 transition-all bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-slate-300"
            >
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                {/* Informations principales */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center mb-2 space-x-3">
                        <h3 className="text-lg font-bold text-slate-900">{offer.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                          {getStatusText(offer.status)}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        <span className="font-medium">{offer.department}</span> • {offer.location}
                      </p>
                      {offer.request_id && (
                        <p className="mt-1 text-xs text-slate-400">
                          Issue de la demande #{offer.request_id}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          setShowDetails(true);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {offer.status === 'draft' && (
                        <button
                          onClick={() => handleOpenEditModal(offer)}
                          className="p-2 text-blue-400 rounded-lg hover:text-blue-600 hover:bg-blue-50"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Référence</p>
                        <p className="font-medium text-slate-900">{offer.reference || 'Non définie'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Contrat</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getContractColor(offer.contract_type)}`}>
                          {offer.contract_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Création</p>
                        <p className="font-medium text-slate-900">
                          {new Date(offer.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Clôture</p>
                        <p className="font-medium text-slate-900">
                          {new Date(offer.application_deadline).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Salaire */}
                  {(offer.salary_min || offer.salary_max) && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">
                        {formatSalary(offer.salary_min, offer.salary_max)}
                      </span>
                    </div>
                  )}

                  {/* Métriques */}
                  {offer.status === 'published' && (
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-slate-600">{offer.views_count || 0} vues</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-slate-600">{offer.applications_count || 0} candidatures</span>
                      </div>
                      {offer.remote_work && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-violet-500" />
                          <span className="text-sm text-slate-600">Télétravail possible</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3 lg:w-64">
                  {offer.status === 'draft' ? (
                    <button
                      onClick={() => openPublishModal(offer)}
                      className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Publier l'offre</span>
                    </button>
                  ) : offer.status === 'published' ? (
                    <button
                      onClick={() => handleCloseOffer(offer.id)}
                      className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Clôturer l'offre</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => {
                      setSelectedOffer(offer);
                      setShowDetails(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-medium rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>Voir les détails</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-50 to-slate-100">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-slate-900">Aucune offre trouvée</h3>
            <p className="text-slate-600">
              Les offres d'emploi apparaîtront automatiquement lorsque les demandes de recrutement seront validées.
            </p>
          </div>
        )}
      </div>

      {/* Modal de publication avec sélection des plateformes */}
      {showPublishModal && selectedOfferForPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl border shadow-2xl bg-gradient-to-br from-white to-slate-50 rounded-2xl border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Publier l'offre</h3>
                  <p className="text-sm text-slate-600">{selectedOfferForPublish.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setSelectedOfferForPublish(null);
                  setSelectedPlatforms([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <XCircle className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Sélectionnez les plateformes de publication :</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {PUBLISH_PLATFORMS.map((platform) => {
                      const Icon = platform.icon;
                      const isSelected = selectedPlatforms.includes(platform.id);
                      return (
                        <label
                          key={platform.id}
                          className={`flex items-center p-4 space-x-3 border cursor-pointer rounded-xl transition-all ${
                            isSelected
                              ? `border-${platform.color}-500 bg-gradient-to-r from-${platform.color}-50 to-${platform.color}-100 ring-2 ring-${platform.color}-500/30`
                              : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePlatform(platform.id)}
                            className={`w-4 h-4 rounded focus:ring-${platform.color}-500 text-${platform.color}-600`}
                          />
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? `bg-${platform.color}-100` : 'bg-slate-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                isSelected ? `text-${platform.color}-600` : 'text-slate-500'
                              }`} />
                            </div>
                            <div>
                              <p className={`font-medium ${
                                isSelected ? `text-${platform.color}-900` : 'text-slate-900'
                              }`}>
                                {platform.name}
                              </p>
                              <p className="text-sm text-slate-500">{platform.description}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowPublishModal(false);
                      setSelectedOfferForPublish(null);
                      setSelectedPlatforms([]);
                    }}
                    className="px-6 py-3 font-medium transition-all bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-xl hover:from-slate-300 hover:to-slate-400"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePublishOffer}
                    disabled={selectedPlatforms.length === 0}
                    className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publier maintenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetails && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Détails de l'offre</h3>
                  <p className="text-sm text-slate-600">Référence: {selectedOffer.reference}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <XCircle className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                <div className="p-5 border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                      <h4 className="mb-1 text-lg font-bold text-slate-900">{selectedOffer.title}</h4>
                      <p className="text-slate-600">{selectedOffer.department} • {selectedOffer.location}</p>
                      {selectedOffer.request_id && (
                        <p className="mt-1 text-xs text-slate-500">
                          Issue de la demande de recrutement #{selectedOffer.request_id}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOffer.status)}`}>
                        {getStatusText(selectedOffer.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getContractColor(selectedOffer.contract_type)}`}>
                        {selectedOffer.contract_type}
                      </span>
                      {selectedOffer.remote_work && (
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700">
                          Télétravail
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="mb-1 text-sm text-slate-500">Date publication</p>
                    <p className="font-medium text-slate-900">
                      {selectedOffer.publication_date 
                        ? new Date(selectedOffer.publication_date).toLocaleDateString('fr-FR')
                        : 'Non publiée'}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="mb-1 text-sm text-slate-500">Date clôture</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedOffer.application_deadline).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="mb-1 text-sm text-slate-500">Salaire</p>
                    <p className="font-medium text-slate-900">
                      {formatSalary(selectedOffer.salary_min, selectedOffer.salary_max)}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="mb-1 text-sm text-slate-500">Expérience</p>
                    <p className="font-medium text-slate-900">{selectedOffer.experience}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="p-5 bg-white border border-slate-200 rounded-xl">
                    <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span>Description du poste</span>
                    </h4>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-line text-slate-700">{selectedOffer.description}</p>
                    </div>
                  </div>
                  <div className="p-5 bg-white border border-slate-200 rounded-xl">
                    <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                      <Users className="w-5 h-5 text-emerald-500" />
                      <span>Profil recherché</span>
                    </h4>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-line text-slate-700">{selectedOffer.profile_required}</p>
                    </div>
                  </div>
                </div>

                {selectedOffer.status === 'published' && (
                  <div className="p-5 bg-white border border-slate-200 rounded-xl">
                    <h4 className="mb-3 font-semibold text-slate-900">Statistiques</h4>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{selectedOffer.views_count}</div>
                        <p className="text-sm text-slate-600">Vues</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600">{selectedOffer.applications_count}</div>
                        <p className="text-sm text-slate-600">Candidatures</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-600">
                          {selectedOffer.applications_count > 0 && selectedOffer.views_count > 0
                            ? Math.round((selectedOffer.applications_count / selectedOffer.views_count) * 100)
                            : 0}%
                        </div>
                        <p className="text-sm text-slate-600">Taux de conversion</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-4 space-x-3">
                  <button
                    onClick={() => {
                      handleOpenEditModal(selectedOffer);
                      setShowDetails(false);
                    }}
                    className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600"
                  >
                    Modifier l'offre
                  </button>
                  <button
                    onClick={() => {
                      if (selectedOffer.status === 'draft') {
                        openPublishModal(selectedOffer);
                      } else if (selectedOffer.status === 'published') {
                        handleCloseOffer(selectedOffer.id);
                      }
                      setShowDetails(false);
                    }}
                    className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
                  >
                    {selectedOffer.status === 'draft' ? 'Publier' : 
                     selectedOffer.status === 'published' ? 'Clôturer' : 'Ré-ouvrir'}
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-6 py-3 font-medium transition-all bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-xl hover:from-slate-300 hover:to-slate-400"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Modifier l'offre</h3>
                  <p className="text-sm text-slate-600">Référence: {editingOffer.reference}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOffer(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Titre du poste *</label>
                      <input
                        type="text"
                        value={editFormData.title || ''}
                        onChange={(e) => handleEditFormChange('title', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Département *</label>
                      <select
                        value={editFormData.department || ''}
                        onChange={(e) => handleEditFormChange('department', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un département</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Localisation *</label>
                      <select
                        value={editFormData.location || ''}
                        onChange={(e) => handleEditFormChange('location', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner une localisation</option>
                        {LOCATIONS.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Type de contrat *</label>
                      <select
                        value={editFormData.contract_type || ''}
                        onChange={(e) => handleEditFormChange('contract_type', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {CONTRACT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Salaire minimum (DT/mois)</label>
                      <input
                        type="number"
                        value={editFormData.salary_min || ''}
                        onChange={(e) => handleEditFormChange('salary_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Salaire maximum (DT/mois)</label>
                      <input
                        type="number"
                        value={editFormData.salary_max || ''}
                        onChange={(e) => handleEditFormChange('salary_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Expérience requise *</label>
                      <select
                        value={editFormData.experience || ''}
                        onChange={(e) => handleEditFormChange('experience', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {EXPERIENCE_LEVELS.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center pt-2 space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editFormData.remote_work || false}
                          onChange={(e) => handleEditFormChange('remote_work', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Télétravail possible</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">Description du poste *</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez les responsabilités, missions, etc."
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">Profil recherché *</label>
                  <textarea
                    value={editFormData.profile_required || ''}
                    onChange={(e) => handleEditFormChange('profile_required', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez le profil idéal, compétences, formation, etc."
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">Date de clôture *</label>
                  <input
                    type="date"
                    value={editFormData.application_deadline ? new Date(editFormData.application_deadline).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleEditFormChange('application_deadline', new Date(e.target.value).toISOString())}
                    className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingOffer(null);
                    }}
                    className="px-6 py-2 font-medium transition-all rounded-lg bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 hover:from-slate-300 hover:to-slate-400"
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
    </div>
  );
}