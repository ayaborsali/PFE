import { useState, useEffect } from 'react';
import { 
  Briefcase, Calendar, Edit2, Eye, Globe, Linkedin, 
  Users, Zap, FileText, Building, Clock, Tag, 
  ChevronRight, Plus, Filter, Search, Download,
  Share2, Printer, ExternalLink, CheckCircle,
  XCircle, AlertCircle, Sparkles, Save, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface JobOffer {
  id: string;
  reference: string;
  title: string;
  description: string;
  profile_required: string;
  department: string;
  site: string;
  contract_type: string;
  publication_date: string;
  closing_date: string;
  status: 'Draft' | 'Published' | 'Closed' | 'Archived';
  salary_range?: string;
  experience_level: string;
  remote_work: boolean;
  created_at: string;
  updated_at: string;
  recruitment_request_id?: string;
  published_on: string[];
  views_count: number;
  applications_count: number;
}

interface Props {
  onUpdate: () => void;
}

// Listes prédéfinies pour les sélections
const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'];
const EXPERIENCE_LEVELS = ['Junior (0-2 ans)', 'Mid-Level (2-4 ans)', 'Confirmé (3-5 ans)', 'Senior (5-8 ans)', 'Expert (8+ ans)'];
const SITES = ['Paris - Siège Social', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes'];
const DEPARTMENTS = ['Direction IT', 'Marketing', 'Commercial', 'Ressources Humaines', 'Direction Financière', 'Direction Administrative', 'Direction Technique'];

export default function JobOffersList({ onUpdate }: Props) {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [testMode, setTestMode] = useState(true);
  
  // États pour l'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<JobOffer>>({});

  // Exemple d'offres pour le mode test
  const exampleOffers: JobOffer[] = [
    {
      id: 'offer-001',
      reference: 'DEV-FS-2024-001',
      title: 'Développeur Full Stack Senior',
      description: `Nous recherchons un Développeur Full Stack Senior pour rejoindre notre équipe technique.

Responsabilités :
• Développer et maintenir des applications web modernes
• Participer à la conception technique et aux revues de code
• Collaborer avec les équipes produit et design
• Mentorat des développeurs juniors
• Amélioration continue des processus de développement

Stack technique :
• Frontend : React, TypeScript, Tailwind CSS
• Backend : Node.js, Express, NestJS
• Base de données : PostgreSQL, MongoDB
• Infrastructure : AWS, Docker, Kubernetes
• Outils : Git, Jira, Figma`,
      profile_required: `Profil recherché :
• Bac+5 en informatique ou formation équivalente
• Minimum 5 ans d'expérience en développement full stack
• Expertise en React et Node.js
• Connaissance des architectures microservices
• Expérience avec les services cloud AWS
• Bonne maîtrise des méthodologies Agile
• Excellentes compétences en communication`,
      department: 'Direction IT',
      site: 'Paris - Siège Social',
      contract_type: 'CDI',
      publication_date: new Date().toISOString(),
      closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 jours
      status: 'Published',
      salary_range: '65-80K€',
      experience_level: 'Senior (5-8 ans)',
      remote_work: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      recruitment_request_id: 'req-001',
      published_on: ['Internal', 'Tanitjobs', 'LinkedIn'],
      views_count: 245,
      applications_count: 18
    },
    {
      id: 'offer-002',
      reference: 'MARK-2024-002',
      title: 'Marketing Manager',
      description: `Responsable de la stratégie marketing digitale et des campagnes publicitaires.`,
      profile_required: `Expérience en marketing B2B, maîtrise des outils analytics.`,
      department: 'Marketing',
      site: 'Lyon',
      contract_type: 'CDI',
      publication_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      closing_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Published',
      salary_range: '45-55K€',
      experience_level: 'Mid-Level (3-5 ans)',
      remote_work: false,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      recruitment_request_id: 'req-002',
      published_on: ['Internal', 'Tanitjobs'],
      views_count: 189,
      applications_count: 12
    },
    {
      id: 'offer-003',
      reference: 'RH-2024-003',
      title: 'Assistant RH',
      description: `Support aux équipes RH pour le recrutement et la gestion administrative.`,
      profile_required: `Formation RH, connaissances en droit du travail, excellente organisation.`,
      department: 'Ressources Humaines',
      site: 'Paris - Siège Social',
      contract_type: 'CDD',
      publication_date: '',
      closing_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Draft',
      salary_range: '28-32K€',
      experience_level: 'Junior (0-2 ans)',
      remote_work: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      recruitment_request_id: 'req-003',
      published_on: [],
      views_count: 0,
      applications_count: 0
    },
    {
      id: 'offer-004',
      reference: 'SALES-2023-015',
      title: 'Commercial B2B',
      description: `Développement du portefeuille clients entreprises.`,
      profile_required: `Expérience en vente B2B, excellente capacité de négociation.`,
      department: 'Commercial',
      site: 'Marseille',
      contract_type: 'CDI',
      publication_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      closing_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Closed',
      salary_range: '40-50K€ + variable',
      experience_level: 'Mid-Level (2-4 ans)',
      remote_work: false,
      created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      recruitment_request_id: 'req-004',
      published_on: ['Internal', 'Tanitjobs', 'LinkedIn', 'RegionsJob'],
      views_count: 432,
      applications_count: 45
    }
  ];

  useEffect(() => {
    if (testMode) {
      // Mode test - utiliser les exemples
      setOffers(exampleOffers);
      setLoading(false);
    } else {
      // Mode production - récupérer de la base de données
      fetchOffers();
    }
  }, [testMode]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('job_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching job offers:', error);
      toast.error('Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ouvrir le modal d'édition
  const handleOpenEditModal = (offer: JobOffer) => {
    setEditingOffer(offer);
    setEditFormData({
      title: offer.title,
      description: offer.description,
      profile_required: offer.profile_required,
      department: offer.department,
      site: offer.site,
      contract_type: offer.contract_type,
      salary_range: offer.salary_range || '',
      experience_level: offer.experience_level,
      remote_work: offer.remote_work,
      closing_date: offer.closing_date
    });
    setShowEditModal(true);
  };

  // Fonction pour gérer les changements dans le formulaire d'édition
  const handleEditFormChange = (field: keyof JobOffer, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = () => {
    if (!editingOffer) return;

    const updatedOffers = offers.map(offer => {
      if (offer.id === editingOffer.id) {
        return {
          ...offer,
          ...editFormData,
          updated_at: new Date().toISOString()
        };
      }
      return offer;
    });

    setOffers(updatedOffers);
    setShowEditModal(false);
    setEditingOffer(null);
    setShowDetails(false);

    toast.success('Offre modifiée avec succès', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const getStatusColor = (status: JobOffer['status']) => {
    switch (status) {
      case 'Draft': return 'bg-amber-100 text-amber-700';
      case 'Published': return 'bg-emerald-100 text-emerald-700';
      case 'Closed': return 'bg-blue-100 text-blue-700';
      case 'Archived': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: JobOffer['status']) => {
    switch (status) {
      case 'Draft': return 'Brouillon';
      case 'Published': return 'Publiée';
      case 'Closed': return 'Clôturée';
      case 'Archived': return 'Archivée';
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

  const handlePublishOffer = (offerId: string, platforms: string[]) => {
    if (testMode) {
      toast.success(`Offre publiée sur: ${platforms.join(', ')}`, {
        duration: 3000,
        position: 'top-right',
      });
      
      // Mettre à jour l'état local
      setOffers(offers.map(offer => {
        if (offer.id === offerId) {
          return {
            ...offer,
            status: 'Published',
            publication_date: new Date().toISOString(),
            published_on: platforms,
            updated_at: new Date().toISOString()
          };
        }
        return offer;
      }));
    }
  };

  const handleCreateFromTemplate = () => {
    if (testMode) {
      const newOffer: JobOffer = {
        id: `offer-${Date.now()}`,
        reference: `DEV-${new Date().getFullYear()}-${offers.length + 1}`,
        title: 'Nouvelle Offre - Développeur',
        description: 'Description à compléter...',
        profile_required: 'Profil à définir...',
        department: 'IT',
        site: 'Paris',
        contract_type: 'CDI',
        publication_date: '',
        closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Draft',
        salary_range: 'À définir',
        experience_level: 'Senior',
        remote_work: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_on: [],
        views_count: 0,
        applications_count: 0
      };

      setOffers([newOffer, ...offers]);
      toast.success('Nouvelle offre créée en brouillon', {
        duration: 3000,
        position: 'top-right',
      });
    }
  };

  const handleCloseOffer = (offerId: string) => {
    if (testMode) {
      setOffers(offers.map(offer => {
        if (offer.id === offerId) {
          return {
            ...offer,
            status: 'Closed',
            updated_at: new Date().toISOString()
          };
        }
        return offer;
      }));
      
      toast.success('Offre clôturée avec succès', {
        duration: 3000,
        position: 'top-right',
      });
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (filter === 'all') return true;
    return offer.status.toLowerCase() === filter.toLowerCase();
  });

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
              <p className="text-slate-600">Gérez et publiez vos offres d'emploi</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            
          </div>
        </div>
      </div>

      {/* Filtres et statistiques */}
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
            {offers.filter(o => o.status === 'Published').length}
          </div>
          <p className="text-sm text-blue-700">Actuellement en ligne</p>
        </div>
        
        <div className="p-5 border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-amber-700">Vues totales</span>
            <Eye className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-900">
            {offers.reduce((sum, offer) => sum + offer.views_count, 0)}
          </div>
          <p className="text-sm text-amber-700">Consultations</p>
        </div>
        
        <div className="p-5 border bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-violet-700">Candidatures</span>
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          <div className="text-3xl font-bold text-violet-900">
            {offers.reduce((sum, offer) => sum + offer.applications_count, 0)}
          </div>
          <p className="text-sm text-violet-700">Total reçues</p>
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
              />
            </div>
            <button className="p-2 border rounded-lg border-slate-300 hover:bg-slate-50">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des offres */}
      <div className="space-y-4">
        {filteredOffers.map((offer) => (
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
                      <span className="font-medium">{offer.department}</span> • {offer.site}
                    </p>
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
                    <button
                      onClick={() => handleOpenEditModal(offer)}
                      className="p-2 text-blue-400 rounded-lg hover:text-blue-600 hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Référence</p>
                      <p className="font-medium text-slate-900">{offer.reference}</p>
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
                      <p className="text-sm text-slate-500">Publication</p>
                      <p className="font-medium text-slate-900">
                        {offer.publication_date 
                          ? new Date(offer.publication_date).toLocaleDateString('fr-FR')
                          : 'Non publiée'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Clôture</p>
                      <p className="font-medium text-slate-900">
                        {new Date(offer.closing_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Métriques */}
                {offer.status === 'Published' && (
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-600">{offer.views_count} vues</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-slate-600">{offer.applications_count} candidatures</span>
                    </div>
                    {offer.remote_work && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-violet-500" />
                        <span className="text-sm text-slate-600">Télétravail possible</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Plateformes de publication */}
                {offer.published_on && offer.published_on.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-slate-500">Publiée sur :</span>
                    {offer.published_on.map((platform, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 lg:w-64">
                {offer.status === 'Draft' ? (
                  <button
                    onClick={() => setShowPublishModal(true)}
                    className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Publier l'offre</span>
                  </button>
                ) : offer.status === 'Published' ? (
                  <button
                    onClick={() => handleCloseOffer(offer.id)}
                    className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/30"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Clôturer l'offre</span>
                  </button>
                ) : (
                  <button
                    onClick={() => toast.success('Offre ré-ouverte')}
                    className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Ré-ouvrir</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                 
                  <button
                    onClick={() => toast.success('PDF généré avec succès')}
                    className="flex items-center justify-center px-3 py-2 space-x-2 font-medium transition-all rounded-lg bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 hover:from-violet-200 hover:to-purple-200"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">PDF</span>
                  </button>
                </div>

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
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="py-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-50 to-slate-100">
            <Briefcase className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-900">Aucune offre trouvée</h3>
          <p className="text-slate-600">
            {filter === 'all'
              ? 'Commencez par créer votre première offre d\'emploi'
              : `Aucune offre ${filter === 'draft' ? 'brouillon' : filter === 'published' ? 'publiée' : 'clôturée'}`}
          </p>
        </div>
      )}

      {/* Modal de publication */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl border shadow-2xl bg-gradient-to-br from-white to-slate-50 rounded-2xl border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Publier l'offre</h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <XCircle className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Sélectionnez les plateformes :</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="flex items-center p-4 space-x-3 border cursor-pointer border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      <div className="flex items-center space-x-2">
                        <Building className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-slate-900">Interne</p>
                          <p className="text-sm text-slate-600">Site intranet</p>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 space-x-3 border cursor-pointer border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50">
                      <input type="checkbox" className="w-4 h-4 rounded text-emerald-600" />
                      <div className="flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="font-medium text-slate-900">Tanitjobs</p>
                          <p className="text-sm text-slate-600">Site externe</p>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 space-x-3 border cursor-pointer border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      <div className="flex items-center space-x-2">
                        <Linkedin className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-slate-900">LinkedIn</p>
                          <p className="text-sm text-slate-600">Réseau professionnel</p>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 space-x-3 border cursor-pointer border-slate-200 rounded-xl hover:border-amber-300 hover:bg-amber-50">
                      <input type="checkbox" className="w-4 h-4 rounded text-amber-600" />
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="font-medium text-slate-900">Autres plateformes</p>
                          <p className="text-sm text-slate-600">Indeed, Monster, etc.</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Date de clôture
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="px-6 py-3 font-medium transition-all bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-xl hover:from-slate-300 hover:to-slate-400"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      handlePublishOffer(selectedOffer?.id || 'offer-001', ['Internal', 'Tanitjobs', 'LinkedIn']);
                      setShowPublishModal(false);
                    }}
                    className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
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
                {/* En-tête avec statut */}
                <div className="p-5 border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                      <h4 className="mb-1 text-lg font-bold text-slate-900">{selectedOffer.title}</h4>
                      <p className="text-slate-600">{selectedOffer.department} • {selectedOffer.site}</p>
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

                {/* Informations clés */}
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
                      {new Date(selectedOffer.closing_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="mb-1 text-sm text-slate-500">Salaire</p>
                    <p className="font-medium text-slate-900">{selectedOffer.salary_range || 'Non spécifié'}</p>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="mb-1 text-sm text-slate-500">Expérience</p>
                    <p className="font-medium text-slate-900">{selectedOffer.experience_level}</p>
                  </div>
                </div>

                {/* Description et profil */}
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

                {/* Statistiques */}
                {selectedOffer.status === 'Published' && (
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
                          {selectedOffer.applications_count > 0 
                            ? Math.round((selectedOffer.applications_count / selectedOffer.views_count) * 100) 
                            : 0}%
                        </div>
                        <p className="text-sm text-slate-600">Taux de conversion</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-violet-600">
                          {selectedOffer.published_on?.length || 0}
                        </div>
                        <p className="text-sm text-slate-600">Plateformes</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
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
                      if (selectedOffer.status === 'Draft') {
                        setShowPublishModal(true);
                      } else if (selectedOffer.status === 'Published') {
                        handleCloseOffer(selectedOffer.id);
                      }
                      setShowDetails(false);
                    }}
                    className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
                  >
                    {selectedOffer.status === 'Draft' ? 'Publier' : 
                     selectedOffer.status === 'Published' ? 'Clôturer' : 'Ré-ouvrir'}
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
                {/* Informations principales */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Titre du poste *
                      </label>
                      <input
                        type="text"
                        value={editFormData.title || ''}
                        onChange={(e) => handleEditFormChange('title', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Département *
                      </label>
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
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Site / Localisation *
                      </label>
                      <select
                        value={editFormData.site || ''}
                        onChange={(e) => handleEditFormChange('site', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un site</option>
                        {SITES.map(site => (
                          <option key={site} value={site}>{site}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Type de contrat *
                      </label>
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
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Salaire (optionnel)
                      </label>
                      <input
                        type="text"
                        value={editFormData.salary_range || ''}
                        onChange={(e) => handleEditFormChange('salary_range', e.target.value)}
                        placeholder="ex: 45-55K€"
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Niveau d'expérience *
                      </label>
                      <select
                        value={editFormData.experience_level || ''}
                        onChange={(e) => handleEditFormChange('experience_level', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {EXPERIENCE_LEVELS.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        Date de clôture *
                      </label>
                      <input
                        type="date"
                        value={editFormData.closing_date ? new Date(editFormData.closing_date).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleEditFormChange('closing_date', new Date(e.target.value).toISOString())}
                        className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
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
                
                {/* Description */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Description du poste *
                  </label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez les responsabilités, missions, etc."
                  />
                </div>
                
                {/* Profil recherché */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Profil recherché *
                  </label>
                  <textarea
                    value={editFormData.profile_required || ''}
                    onChange={(e) => handleEditFormChange('profile_required', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez le profil idéal, compétences, formation, etc."
                  />
                </div>
                
                {/* Boutons d'action */}
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


