// components/recruitment/JobOffersList.tsx
import { useState, useEffect } from 'react';
import { Briefcase, Filter, Search, Linkedin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

import { JobOffer, PUBLISH_PLATFORMS } from '../../types/jobOffer';
import { useLinkedIn } from '../../hooks/useLinkedIn';
import { JobOffersStats } from './JobOffersStats';
import { JobOfferCard } from './JobOfferCard';
import { PublishModal } from './PublishModal';
import { JobOfferDetailsModal } from './JobOfferDetailsModal';
import { JobOfferEditModal } from './JobOfferEditModal';

interface Props {
  onUpdate: () => void;
  searchTerm?: string;
}

export default function JobOffersList({ onUpdate, searchTerm = '' }: Props) {
  const { token } = useAuth();
  const { isConnected: isLinkedInConnected, connect: connectLinkedIn, checkConnection: checkLinkedInConnection } = useLinkedIn();
  
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [searchInput, setSearchInput] = useState(searchTerm);
  
  // États pour les modals
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedOfferForPublish, setSelectedOfferForPublish] = useState<JobOffer | null>(null);
  const [isReopenMode, setIsReopenMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<JobOffer>>({});
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  // Charger les offres
  useEffect(() => {
    fetchOffers();
    checkLinkedInConnection();
  }, [filter, searchInput]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!authToken) {
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };
      let url = `${API}/api/job-offers`;      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (searchInput) params.append('search', searchInput);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const data = await response.json();
      setOffers(data);
    } catch (error) {
      console.error('❌ Error fetching job offers:', error);
      toast.error('Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishSuccess = () => {
    fetchOffers();
    onUpdate();
  };

  const handlePublish = (offer: JobOffer) => {
    setSelectedOfferForPublish(offer);
    setIsReopenMode(false);
    setShowPublishModal(true);
  };

  const handleReopen = (offer: JobOffer) => {
    setSelectedOfferForPublish(offer);
    setIsReopenMode(true);
    setShowPublishModal(true);
  };

  const handleCloseOffer = async (offerId: string) => {
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API}/api/job-offers/${offerId}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Erreur lors de la clôture');
      toast.success('Offre clôturée avec succès');
      fetchOffers();
      onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la clôture');
    }
  };

  // Statistiques
  const stats = {
    total: offers.length,
    published: offers.filter(o => o.status === 'published').length,
    draft: offers.filter(o => o.status === 'draft').length,
    closed: offers.filter(o => o.status === 'closed' || o.status === 'filled').length
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
          
          <button
            onClick={connectLinkedIn}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isLinkedInConnected 
                ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            <Linkedin className="w-4 h-4" />
            <span>{isLinkedInConnected ? '✅ LinkedIn connecté' : '🔗 Connecter LinkedIn'}</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <JobOffersStats {...stats} />

      {/* Filtres */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {(['all', 'draft', 'published', 'closed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === f
                    ? f === 'draft' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : f === 'published' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'Toutes les offres' : f === 'draft' ? 'Brouillons' : f === 'published' ? 'Publiées' : 'Clôturées'}
              </button>
            ))}
          </div>
          
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

      {/* Liste des offres */}
      <div className="space-y-4">
        {offers.length > 0 ? (
          offers.map((offer) => (
            <JobOfferCard
              key={offer.id}
              offer={offer}
              onViewDetails={(offer) => { setSelectedOffer(offer); setShowDetails(true); }}
              onEdit={(offer) => { setSelectedOffer(offer); setShowEditModal(true); }}
              onPublish={handlePublish}
              onClose={handleCloseOffer}
              onReopen={handleReopen}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-50 to-slate-100">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-slate-900">Aucune offre trouvée</h3>
            <p className="text-slate-600">Les offres d'emploi apparaîtront automatiquement lorsque les demandes de recrutement seront validées.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false);
          setIsReopenMode(false);
        }}
        offer={selectedOfferForPublish}
        onPublishSuccess={handlePublishSuccess}
        isReopen={isReopenMode}
      />

      <JobOfferDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        offer={selectedOffer}
        onEdit={(offer) => {
          setShowDetails(false);
          setSelectedOffer(offer);
          setShowEditModal(true);
        }}
        onPublish={handlePublish}
        onCloseOffer={handleCloseOffer}
        onReopen={handleReopen}
      />

      <JobOfferEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        offer={selectedOffer}
        onSave={() => {
          fetchOffers();
          onUpdate();
        }}
      />
    </div>
  );
}