// components/recruitment/JobOfferEditModal.tsx
import { useState } from 'react';
import { X, Save, FileText, Users, Calendar, DollarSign, Briefcase, MapPin, Clock, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { JobOffer, CONTRACT_TYPES, EXPERIENCE_LEVELS, LOCATIONS, DEPARTMENTS } from '../../types/jobOffer';

interface JobOfferEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: JobOffer | null;
  onSave: () => void;
}

export const JobOfferEditModal = ({ isOpen, onClose, offer, onSave }: JobOfferEditModalProps) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<Partial<JobOffer>>({});
  const [loading, setLoading] = useState(false);

  // Initialiser le formulaire quand l'offre change
  useState(() => {
    if (offer) {
      setFormData({
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
    }
  }, [offer]);

  const handleChange = (field: keyof JobOffer, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!offer) return;
    
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/job-offers/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }
      
      toast.success('Offre modifiée avec succès');
      onSave();
      onClose();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/30">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Modifier l'offre</h3>
              <p className="text-sm text-slate-600">Référence: {offer.reference || 'Non définie'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Ligne 1: Titre, Département, Localisation */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Titre du poste *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Département *</label>
                <select
                  value={formData.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
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
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une localisation</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ligne 2: Type contrat, Expérience, Salaire */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Type de contrat *</label>
                <select
                  value={formData.contract_type || ''}
                  onChange={(e) => handleChange('contract_type', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CONTRACT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Expérience requise *</label>
                <select
                  value={formData.experience || ''}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ligne 3: Salaire min et max */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Salaire minimum (DT/mois)</label>
                <input
                  type="number"
                  value={formData.salary_min || ''}
                  onChange={(e) => handleChange('salary_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Salaire maximum (DT/mois)</label>
                <input
                  type="number"
                  value={formData.salary_max || ''}
                  onChange={(e) => handleChange('salary_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Ligne 4: Télétravail, Date de début */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex items-center pt-2 space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.remote_work || false}
                    onChange={(e) => handleChange('remote_work', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Télétravail possible</span>
                </label>
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Date de début souhaitée</label>
                <input
                  type="date"
                  value={formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description du poste */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Description du poste *</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez les responsabilités, missions, etc."
              />
            </div>
            
            {/* Profil recherché */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Profil recherché *</label>
              <textarea
                value={formData.profile_required || ''}
                onChange={(e) => handleChange('profile_required', e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez le profil idéal, compétences, formation, etc."
              />
            </div>
            
            {/* Avantages */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Avantages</label>
              <div className="flex flex-wrap gap-2">
                {(formData.benefits || []).map((benefit, index) => (
                  <span key={index} className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-emerald-50 text-emerald-700">
                    {benefit}
                    <button
                      onClick={() => {
                        const newBenefits = [...(formData.benefits || [])];
                        newBenefits.splice(index, 1);
                        handleChange('benefits', newBenefits);
                      }}
                      className="text-emerald-500 hover:text-emerald-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Ajouter un avantage..."
                  className="px-3 py-1 text-sm border rounded-full border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleChange('benefits', [...(formData.benefits || []), e.currentTarget.value.trim()]);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Date de clôture */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Date de clôture *</label>
              <input
                type="date"
                value={formData.application_deadline ? new Date(formData.application_deadline).toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('application_deadline', new Date(e.target.value).toISOString())}
                className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Boutons */}
            <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-6 py-2 font-medium transition-all rounded-lg bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 hover:from-slate-300 hover:to-slate-400"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 space-x-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};