// components/recruitment/JobOfferDetailsModal.tsx
import { XCircle, Briefcase, FileText, Users, Calendar, Clock, DollarSign, RotateCcw } from 'lucide-react';
import { JobOffer } from '../../types/jobOffer';

interface JobOfferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: JobOffer | null;
  onEdit: (offer: JobOffer) => void;
  onPublish: (offer: JobOffer) => void;
  onCloseOffer: (offerId: string) => void;
  onReopen?: (offerId: string) => void;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-blue-100 text-blue-700',
    filled: 'bg-purple-100 text-purple-700',
    archived: 'bg-slate-100 text-slate-700'
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: 'Brouillon',
    published: 'Publiée',
    closed: 'Clôturée',
    filled: 'Pourvue',
    archived: 'Archivée'
  };
  return texts[status] || status;
};

const getContractColor = (contractType: string) => {
  const colors: Record<string, string> = {
    CDI: 'bg-green-100 text-green-700',
    CDD: 'bg-blue-100 text-blue-700',
    Alternance: 'bg-purple-100 text-purple-700',
    Stage: 'bg-amber-100 text-amber-700'
  };
  return colors[contractType] || 'bg-slate-100 text-slate-700';
};

const formatSalary = (min?: number, max?: number) => {
  if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} DT/mois`;
  if (min) return `≥ ${min.toLocaleString()} DT/mois`;
  if (max) return `≤ ${max.toLocaleString()} DT/mois`;
  return 'Non spécifié';
};

export const JobOfferDetailsModal = ({ isOpen, onClose, offer, onEdit, onPublish, onCloseOffer, onReopen }: JobOfferDetailsModalProps) => {
  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Détails de l'offre</h3>
              <p className="text-sm text-slate-600">Référence: {offer.reference || 'Non définie'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <XCircle className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* En-tête avec titre et statut */}
            <div className="p-5 border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h4 className="mb-1 text-lg font-bold text-slate-900">{offer.title}</h4>
                  <p className="text-slate-600">{offer.department} • {offer.location}</p>
                  {offer.request_id && (
                    <p className="mt-1 text-xs text-slate-500">
                      Issue de la demande de recrutement #{offer.request_id}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(offer.status)}`}>
                    {getStatusText(offer.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getContractColor(offer.contract_type)}`}>
                    {offer.contract_type}
                  </span>
                  {offer.remote_work && (
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
                  {offer.publication_date 
                    ? new Date(offer.publication_date).toLocaleDateString('fr-FR')
                    : 'Non publiée'}
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <p className="mb-1 text-sm text-slate-500">Date clôture</p>
                <p className="font-medium text-slate-900">
                  {new Date(offer.application_deadline).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <p className="mb-1 text-sm text-slate-500">Salaire</p>
                <p className="font-medium text-slate-900">
                  {formatSalary(offer.salary_min, offer.salary_max)}
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <p className="mb-1 text-sm text-slate-500">Expérience</p>
                <p className="font-medium text-slate-900">{offer.experience}</p>
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
                  <p className="whitespace-pre-line text-slate-700">{offer.description}</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-xl">
                <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <span>Profil recherché</span>
                </h4>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line text-slate-700">{offer.profile_required || 'Non spécifié'}</p>
                </div>
              </div>
            </div>

            {/* Avantages */}
            {offer.benefits && offer.benefits.length > 0 && (
              <div className="p-5 bg-white border border-slate-200 rounded-xl">
                <h4 className="flex items-center mb-3 space-x-2 font-semibold text-slate-900">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <span>Avantages</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {offer.benefits.map((benefit, index) => (
                    <span key={index} className="px-3 py-1 text-sm rounded-full bg-emerald-50 text-emerald-700">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statistiques (si publiée) */}
            {offer.status === 'published' && (
              <div className="p-5 bg-white border border-slate-200 rounded-xl">
                <h4 className="mb-3 font-semibold text-slate-900">Statistiques</h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{offer.views_count || 0}</div>
                    <p className="text-sm text-slate-600">Vues</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">{offer.applications_count || 0}</div>
                    <p className="text-sm text-slate-600">Candidatures</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600">
                      {offer.applications_count > 0 && offer.views_count > 0
                        ? Math.round((offer.applications_count / offer.views_count) * 100)
                        : 0}%
                    </div>
                    <p className="text-sm text-slate-600">Taux de conversion</p>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-center pt-4 space-x-3">
              {offer.status === 'draft' && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(offer);
                  }}
                  className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600"
                >
                  Modifier l'offre
                </button>
              )}
              
              {offer.status === 'draft' && (
                <button
                  onClick={() => {
                    onClose();
                    onPublish(offer);
                  }}
                  className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
                >
                  Publier
                </button>
              )}
              
              {offer.status === 'published' && (
                <button
                  onClick={() => {
                    onCloseOffer(offer.id);
                    onClose();
                  }}
                  className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600"
                >
                  Clôturer
                </button>
              )}
              
              {offer.status === 'closed' && onReopen && (
                <button
                  onClick={() => {
                    onReopen(offer.id);
                    onClose();
                  }}
                  className="px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600"
                >
                  <RotateCcw className="inline w-4 h-4 mr-2" />
                  Rouvrir l'offre
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-6 py-3 font-medium transition-all bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-xl hover:from-slate-300 hover:to-slate-400"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};