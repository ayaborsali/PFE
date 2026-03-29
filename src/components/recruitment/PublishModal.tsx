// components/recruitment/PublishModal.tsx
import { useState } from 'react';
import { Share2, XCircle, Sparkles, Building, Globe, Linkedin, Briefcase, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { PUBLISH_PLATFORMS } from '../../types/jobOffer';
import { useLinkedIn } from '../../hooks/useLinkedIn';
import { useAuth } from '../../contexts/AuthContext';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  onPublishSuccess: () => void;
  isReopen?: boolean;
}

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = { Building, Globe, Linkedin, Briefcase, Copy };
  return icons[iconName] || Briefcase;
};

export const PublishModal = ({ isOpen, onClose, offer, onPublishSuccess, isReopen = false }: PublishModalProps) => {
  const { token } = useAuth();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [useAI, setUseAI] = useState(true);
  const [isPublishingLocal, setIsPublishingLocal] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { isConnected: isLinkedInConnected, connect: connectLinkedIn, publishOffer: publishToLinkedIn } = useLinkedIn();

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
    setGeneratedText(null);
    setCopied(false);
  };

  const generateText = async () => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!authToken) {
      toast.error('Authentification requise');
      return false;
    }
    
    try {
      console.log('📤 Génération du texte via NLP...');
      
      const response = await fetch(`http://localhost:5000/api/job-offers/${offer.id}/generate-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          useAI: useAI 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erreur génération:', errorData);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Texte généré:', result);
      
      if (result.success && result.generatedText) {
        setGeneratedText(result.generatedText);
        toast.success('✅ Texte généré avec succès !');
        return true;
      }
      return false;
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      toast.error('Erreur lors de la génération du texte');
      return false;
    }
  };

  const copyToClipboard = async () => {
    if (!generatedText) return;
    
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast.success('📋 Texte copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const sendInternalEmail = async () => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!authToken) {
      toast.error('Authentification requise');
      return false;
    }
    
    try {
      console.log('📧 Envoi de l\'offre par email...');
      
      const response = await fetch(`http://localhost:5000/api/job-offers/${offer.id}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          useAI: useAI 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erreur envoi email:', errorData);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Email envoyé:', result);
      
      if (result.success) {
        toast.success(`✅ ${result.message}`);
        if (result.generatedText) {
          setGeneratedText(result.generatedText);
        }
        return true;
      }
      return false;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error);
      toast.error('Erreur lors de l\'envoi des emails');
      return false;
    }
  };

  const updateOfferStatus = async () => {
    const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!authToken) return false;
    
    const endpoint = isReopen ? 'reopen' : 'publish';
    
    try {
      const response = await fetch(`http://localhost:5000/api/job-offers/${offer.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          platforms: [],
          useAI: useAI 
        })
      });
      
      if (!response.ok) return false;
      return true;
    } catch (error) {
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
      // Séparer les plateformes
      const hasLinkedIn = selectedPlatforms.includes('linkedin');
      const hasInternal = selectedPlatforms.includes('internal');
      const hasPrepare = selectedPlatforms.includes('prepare');
      const otherPlatforms = selectedPlatforms.filter(p => p !== 'linkedin' && p !== 'internal' && p !== 'prepare');
      
      let linkedinSuccess = false;
      let internalSuccess = false;
      let generatedTextResult = null;
      
      // 1. GÉNÉRER LE TEXTE SI "PRÉPARER LE TEXTE" EST SÉLECTIONNÉ
      if (hasPrepare) {
        console.log('📝 Génération du texte...');
        const success = await generateText();
        if (success && generatedText) {
          generatedTextResult = generatedText;
        }
      }
      
      // 2. ENVOYER L'EMAIL SI "INTERNET" EST SÉLECTIONNÉ
      if (hasInternal) {
        console.log('📧 Envoi de l\'email...');
        internalSuccess = await sendInternalEmail();
        if (!internalSuccess) {
          toast.warning('⚠️ L\'envoi des emails a échoué partiellement');
        }
      }
      
      // 3. PUBLIER SUR LINKEDIN SI SÉLECTIONNÉ
      if (hasLinkedIn) {
        console.log('📤 Publication sur LinkedIn...');
        linkedinSuccess = await publishToLinkedIn(offer);
        if (!linkedinSuccess) {
          toast.error('La publication sur LinkedIn a échoué');
        }
      }
      
      // 4. PUBLIER SUR LES AUTRES PLATEFORMES (tanitjobs, etc.)
      if (otherPlatforms.length > 0) {
        console.log('📤 Publication sur autres plateformes:', otherPlatforms);
        
        const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
        const linkedinToken = localStorage.getItem('linkedin_token');
        const endpoint = isReopen ? 'reopen' : 'publish';
        
        const response = await fetch(`http://localhost:5000/api/job-offers/${offer.id}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'x-linkedin-token': linkedinToken || ''
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
        console.log('Résultat autres plateformes:', result);
      }
      
      // 5. METTRE À JOUR LE STATUT DE L'OFFRE
      // Mettre à jour le statut si au moins une action a réussi ou si on veut juste changer le statut
      if (hasLinkedIn || hasInternal || otherPlatforms.length > 0 || selectedPlatforms.length === 0) {
        await updateOfferStatus();
      }
      
      // 6. AFFICHER LE RÉSUMÉ DES ACTIONS
      const actions = [];
      if (hasLinkedIn && linkedinSuccess) actions.push('LinkedIn');
      if (hasInternal && internalSuccess) actions.push('Intranet (email)');
      if (hasPrepare && generatedTextResult) actions.push('texte généré');
      if (otherPlatforms.length > 0) actions.push(otherPlatforms.map(p => {
        const platform = PUBLISH_PLATFORMS.find(pp => pp.id === p);
        return platform?.name || p;
      }).join(', '));
      
      if (actions.length > 0) {
        const actionMessage = isReopen ? 'republiée' : 'publiée';
        toast.success(`✅ Offre ${actionMessage} avec succès sur: ${actions.join(', ')}`);
      } else {
        toast.warning('⚠️ Aucune action n\'a été réalisée avec succès');
      }
      
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

  const isPrepareOnly = selectedPlatforms.length === 1 && selectedPlatforms.includes('prepare');
  const buttonText = isPrepareOnly 
    ? (generatedText ? 'Regénérer le texte' : 'Générer le texte')
    : 'Publier maintenant';
  const buttonIcon = isPrepareOnly ? (generatedText ? Sparkles : Sparkles) : Share2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl border shadow-2xl bg-gradient-to-br from-white to-slate-50 rounded-2xl border-white/30">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isReopen ? 'Republier l\'offre' : (isPrepareOnly ? 'Préparer le texte' : 'Publier l\'offre')}
              </h3>
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
              <p className="mt-2 text-xs text-slate-500">
                Vous pouvez sélectionner plusieurs plateformes simultanément.
              </p>
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

            {/* Affichage du texte généré */}
            {generatedText && (
              <div className="p-4 border border-emerald-200 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Texte généré par l'IA</span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <div className="p-3 overflow-y-auto bg-white rounded-lg max-h-64">
                  <p className="text-sm whitespace-pre-wrap text-slate-700">{generatedText}</p>
                </div>
              </div>
            )}

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
                    {buttonIcon === Share2 ? <Share2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    <span>{buttonText}</span>
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