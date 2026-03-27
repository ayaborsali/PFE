// components/recruitment/PublishModal.tsx
import { useState } from 'react';
import { Share2, XCircle, Sparkles, Building, Globe, Linkedin, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { PUBLISH_PLATFORMS } from '../../types/jobOffer';
import { useLinkedIn } from '../../hooks/useLinkedIn';
import { useAuth } from '../../contexts/AuthContext';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  onPublishSuccess: () => void;
}

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = { Building, Globe, Linkedin, Briefcase };
  return icons[iconName] || Briefcase;
};

export const PublishModal = ({ isOpen, onClose, offer, onPublishSuccess }: PublishModalProps) => {
  const { token } = useAuth();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [useAI, setUseAI] = useState(true);
  const [isPublishingLocal, setIsPublishingLocal] = useState(false);
  
  const { isConnected: isLinkedInConnected, connect: connectLinkedIn, publishOffer: publishToLinkedIn } = useLinkedIn();

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // ⭐ Fonction pour mettre à jour le statut de l'offre dans la base de données
  const updateOfferStatus = async () => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!authToken) {
      console.error('❌ Token JWT manquant');
      return false;
    }
    
    try {
      console.log('📤 Mise à jour du statut de l\'offre...');
      
      const response = await fetch(`http://localhost:5000/api/job-offers/${offer.id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          platforms: [],  // Pas de plateformes, juste pour changer le statut
          useAI: useAI 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erreur mise à jour statut:', errorData);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Statut de l\'offre mis à jour:', result);
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      return false;
    }
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Veuillez sélectionner au moins une plateforme');
      return;
    }

    setIsPublishingLocal(true);

    try {
      let linkedinSuccess = false;
      let otherSuccess = false;
      
      // 1. Publier sur LinkedIn si sélectionné
      if (selectedPlatforms.includes('linkedin')) {
        console.log('📤 Publication sur LinkedIn...');
        linkedinSuccess = await publishToLinkedIn(offer);
        
        if (!linkedinSuccess && selectedPlatforms.length === 1) {
          toast.error('La publication sur LinkedIn a échoué');
          setIsPublishingLocal(false);
          return;
        }
      }

      // 2. Publier sur les autres plateformes (via backend)
      const otherPlatforms = selectedPlatforms.filter(p => p !== 'linkedin');
      
      if (otherPlatforms.length > 0) {
        console.log('📤 Publication sur autres plateformes:', otherPlatforms);
        
        const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/job-offers/${offer.id}/publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            platforms: otherPlatforms,
            useAI: useAI 
          })
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Erreur backend:', errorData);
          throw new Error(`Erreur ${response.status}: ${errorData}`);
        }
        
        const result = await response.json();
        otherSuccess = result.success;
        console.log('Résultat autres plateformes:', result);
      }
      
      // ⭐ 3. SI LINKEDIN A ÉTÉ PUBLIÉ SEUL, METTRE À JOUR LE STATUT ⭐
      if (selectedPlatforms.includes('linkedin') && linkedinSuccess && otherPlatforms.length === 0) {
        console.log('📤 Mise à jour du statut de l\'offre après publication LinkedIn...');
        const statusUpdated = await updateOfferStatus();
        
        if (!statusUpdated) {
          console.warn('⚠️ La publication LinkedIn a réussi mais le statut n\'a pas pu être mis à jour');
          // On continue quand même car la publication LinkedIn a réussi
        }
      }
      
      // 4. Succès - Afficher le message
      const platformNames = selectedPlatforms.map(p => {
        const platform = PUBLISH_PLATFORMS.find(pp => pp.id === p);
        return platform?.name || p;
      }).join(', ');
      
      toast.success(`✅ Offre publiée avec succès sur: ${platformNames}`);
      
      // 5. Fermer la modal et rafraîchir
      onClose();
      onPublishSuccess();
      
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      toast.error(`Erreur: ${error.message || 'Erreur lors de la publication'}`);
    } finally {
      setIsPublishingLocal(false);
      setSelectedPlatforms([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl border shadow-2xl bg-gradient-to-br from-white to-slate-50 rounded-2xl border-white/30">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Publier l'offre</h3>
              <p className="text-sm text-slate-600">{offer.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <XCircle className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {/* Sélection des plateformes */}
            <div>
              <h4 className="mb-3 font-semibold text-slate-900">Sélectionnez les plateformes :</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {PUBLISH_PLATFORMS.map((platform) => {
                  const Icon = getIcon(platform.icon);
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const colorClass = platform.color;
                  return (
                    <label
                      key={platform.id}
                      className={`flex items-center p-4 space-x-3 border cursor-pointer rounded-xl transition-all ${
                        isSelected
                          ? `border-${colorClass}-500 bg-gradient-to-r from-${colorClass}-50 to-${colorClass}-100 ring-2 ring-${colorClass}-500/30`
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePlatform(platform.id)}
                        className="w-4 h-4 rounded"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isSelected ? `bg-${colorClass}-100` : 'bg-slate-100'}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? `text-${colorClass}-600` : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${isSelected ? `text-${colorClass}-900` : 'text-slate-900'}`}>
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

            {/* Option IA */}
            <div className="p-4 border border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-4 h-4 mt-1 text-purple-600 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Optimiser avec l'IA</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Reformule automatiquement l'offre pour la rendre plus attrayante
                  </p>
                </div>
              </label>
            </div>

            {/* Connexion LinkedIn si nécessaire */}
            {selectedPlatforms.includes('linkedin') && !isLinkedInConnected && (
              <div className="p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <Linkedin className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Connexion LinkedIn requise</p>
                      <p className="text-sm text-blue-700">Connectez votre compte pour publier</p>
                    </div>
                  </div>
                  <button
                    onClick={connectLinkedIn}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    Se connecter
                  </button>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end pt-4 space-x-3 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-6 py-3 font-medium transition-all bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-xl hover:from-slate-300 hover:to-slate-400"
              >
                Annuler
              </button>
              <button
                onClick={handlePublish}
                disabled={selectedPlatforms.length === 0 || isPublishingLocal}
                className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishingLocal ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                    <span>Publication en cours...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Publier maintenant</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};