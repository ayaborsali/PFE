// components/recruitment/JobOfferCard.tsx
import { Eye, Edit2, Tag, FileText, Calendar, Clock, DollarSign, Users, Globe, Share2, CheckCircle, ChevronRight } from 'lucide-react';
import { JobOffer } from '../../types/jobOffer';

interface JobOfferCardProps {
  offer: JobOffer;
  onViewDetails: (offer: JobOffer) => void;
  onEdit: (offer: JobOffer) => void;
  onPublish: (offer: JobOffer) => void;
  onClose: (offerId: string) => void;
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

export const JobOfferCard = ({ offer, onViewDetails, onEdit, onPublish, onClose }: JobOfferCardProps) => {
  return (
    <div className="p-6 transition-all bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-slate-300">
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
                <p className="mt-1 text-xs text-slate-400">Issue de la demande #{offer.request_id}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => onViewDetails(offer)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="Voir détails">
                <Eye className="w-4 h-4" />
              </button>
              {offer.status === 'draft' && (
                <button onClick={() => onEdit(offer)} className="p-2 text-blue-400 rounded-lg hover:text-blue-600 hover:bg-blue-50" title="Modifier">
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
                <p className="font-medium text-slate-900">{new Date(offer.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Clôture</p>
                <p className="font-medium text-slate-900">{new Date(offer.application_deadline).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          {(offer.salary_min || offer.salary_max) && (
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">{formatSalary(offer.salary_min, offer.salary_max)}</span>
            </div>
          )}

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
              onClick={() => onPublish(offer)}
              className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
            >
              <Share2 className="w-5 h-5" />
              <span>Publier l'offre</span>
            </button>
          ) : offer.status === 'published' ? (
            <button
              onClick={() => onClose(offer.id)}
              className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Clôturer l'offre</span>
            </button>
          ) : null}

          <button
            onClick={() => onViewDetails(offer)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-medium rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
            <span>Voir les détails</span>
          </button>
        </div>
      </div>
    </div>
  );
};